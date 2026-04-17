package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	googleOauthConfig *oauth2.Config
	githubOauthConfig *oauth2.Config
	db                *gorm.DB
	jwtSecret         []byte
	PendingLogins     = make(map[string]string)

	// Email verification codes: email -> {code, expiresAt}
	emailCodes   = make(map[string]emailCode)
	emailCodesMu sync.Mutex

	// IP-based rate limiting for email verify: IP -> []attemptTimestamp
	ipAttempts   = make(map[string][]time.Time)
	ipAttemptsMu sync.Mutex
)

type emailCode struct {
	Code      string
	ExpiresAt time.Time
}

// User - Структура пользователя в базе данных
type User struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex"`
	Name      string
	Picture   string
	Provider  string // 'google', 'github', 'email'
	CreatedAt time.Time
	UpdatedAt time.Time
}

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("devora_super_secret_fallback_key")
	}

	googleOauthConfig = &oauth2.Config{
		RedirectURL:  os.Getenv("GOOGLE_CALLBACK_URL"),
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}

	githubOauthConfig = &oauth2.Config{
		RedirectURL:  os.Getenv("GITHUB_CALLBACK_URL"),
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		Scopes:       []string{"user:email", "read:user"},
		Endpoint:     github.Endpoint,
	}

	// Инициализация базы данных SQLite
	var err error
	db, err = gorm.Open(sqlite.Open("devora.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database")
	}

	// Автоматическое создание таблиц
	db.AutoMigrate(&User{})
}

func main() {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Папка для загруженных аватарок
	os.MkdirAll("./uploads", os.ModePerm)
	app.Static("/uploads", "./uploads")

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Devora Auth Server is running!")
	})

	// ── OAuth Endpoints ──────────────────────────────────
	app.Get("/auth/google/login", googleLogin)
	app.Get("/auth/google/callback", googleCallback)
	app.Get("/auth/github/login", githubLogin)
	app.Get("/auth/github/callback", githubCallback)
	app.Get("/api/auth/poll", authPoll)

	// ── Email Code Auth ──────────────────────────────────
	app.Post("/auth/email/send-code", emailSendCode)
	app.Post("/auth/email/verify-code", emailVerifyCode)

	// ── API Endpoints (require token) ────────────────────
	api := app.Group("/api", authMiddleware)
	api.Get("/user/me", getUserMe)
	api.Post("/user/avatar", uploadAvatar)
	api.Get("/user/storage", getUserStorage)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	log.Printf("Starting Devora Auth Server on port %s", port)
	app.Listen(":" + port)
}

// ══════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ══════════════════════════════════════════════════════════════════════════════

func googleLogin(c *fiber.Ctx) error {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		sessionID = "devora_state"
	}
	// Encode session_id as state with provider prefix
	url := googleOauthConfig.AuthCodeURL("google:" + sessionID)
	return c.Redirect(url)
}

func googleCallback(c *fiber.Ctx) error {
	state := c.Query("state")
	if state == "" {
		return c.Status(fiber.StatusUnauthorized).SendString("Invalid state")
	}

	// Extract session ID
	sessionID := strings.TrimPrefix(state, "google:")

	code := c.Query("code")
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to exchange token")
	}

	response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to get user data")
	}
	defer response.Body.Close()

	contents, err := io.ReadAll(response.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to read user data")
	}

	var googleUser map[string]interface{}
	json.Unmarshal(contents, &googleUser)

	email := googleUser["email"].(string)
	name := ""
	if n, ok := googleUser["name"]; ok {
		name = n.(string)
	}
	picture := ""
	if p, ok := googleUser["picture"]; ok {
		picture = p.(string)
	}

	jwtToken := findOrCreateUserAndGetToken(email, name, picture, "google")
	if jwtToken == "" {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate token")
	}

	PendingLogins[sessionID] = jwtToken
	return sendSuccessHTML(c)
}

// ══════════════════════════════════════════════════════════════════════════════
// GITHUB OAUTH
// ══════════════════════════════════════════════════════════════════════════════

func githubLogin(c *fiber.Ctx) error {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		sessionID = "devora_state"
	}
	url := githubOauthConfig.AuthCodeURL("github:" + sessionID)
	return c.Redirect(url)
}

func githubCallback(c *fiber.Ctx) error {
	state := c.Query("state")
	if state == "" {
		return c.Status(fiber.StatusUnauthorized).SendString("Invalid state")
	}

	sessionID := strings.TrimPrefix(state, "github:")

	code := c.Query("code")
	token, err := githubOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to exchange token: " + err.Error())
	}

	// Get user info from GitHub API
	client := &http.Client{}

	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to get GitHub user")
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var ghUser map[string]interface{}
	json.Unmarshal(body, &ghUser)

	name := ""
	if n, ok := ghUser["name"]; ok && n != nil {
		name = n.(string)
	}
	if name == "" {
		if login, ok := ghUser["login"]; ok && login != nil {
			name = login.(string)
		}
	}
	picture := ""
	if p, ok := ghUser["avatar_url"]; ok && p != nil {
		picture = p.(string)
	}

	// Get email (may need separate call if email is private)
	email := ""
	if e, ok := ghUser["email"]; ok && e != nil {
		email = e.(string)
	}

	if email == "" {
		// Fetch primary email from API
		reqEmails, _ := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
		reqEmails.Header.Set("Authorization", "Bearer "+token.AccessToken)
		reqEmails.Header.Set("Accept", "application/json")
		respEmails, err := client.Do(reqEmails)
		if err == nil {
			defer respEmails.Body.Close()
			emailsBody, _ := io.ReadAll(respEmails.Body)
			var emails []map[string]interface{}
			json.Unmarshal(emailsBody, &emails)
			for _, em := range emails {
				if primary, ok := em["primary"].(bool); ok && primary {
					if addr, ok := em["email"].(string); ok {
						email = addr
						break
					}
				}
			}
			// Fallback: just use first email
			if email == "" && len(emails) > 0 {
				if addr, ok := emails[0]["email"].(string); ok {
					email = addr
				}
			}
		}
	}

	if email == "" {
		return c.Status(fiber.StatusInternalServerError).SendString("Could not retrieve email from GitHub")
	}

	jwtToken := findOrCreateUserAndGetToken(email, name, picture, "github")
	if jwtToken == "" {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate token")
	}

	PendingLogins[sessionID] = jwtToken
	return sendSuccessHTML(c)
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL CODE AUTH (passwordless)
// ══════════════════════════════════════════════════════════════════════════════

func emailSendCode(c *fiber.Ctx) error {
	type req struct {
		Email string `json:"email"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil || body.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is required"})
	}

	email := strings.TrimSpace(strings.ToLower(body.Email))

	// Generate 6-digit code
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	emailCodesMu.Lock()
	emailCodes[email] = emailCode{
		Code:      code,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	emailCodesMu.Unlock()

	// Try to send via SMTP, but in dev mode just log it
	smtpHost := os.Getenv("SMTP_HOST")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpFrom := os.Getenv("SMTP_FROM")

	if smtpHost != "" && smtpUser != "" && smtpPass != "" {
		err := sendEmailSMTP(smtpHost, smtpUser, smtpPass, smtpFrom, email, code)
		if err != nil {
			log.Printf("[EMAIL] SMTP send failed: %v", err)
			// Still allow — code is generated, just log to console as fallback
			log.Printf("═══════════════════════════════════════════")
			log.Printf("  FALLBACK: CODE for %s: %s", email, code)
			log.Printf("═══════════════════════════════════════════")
		} else {
			log.Printf("[EMAIL] Code sent to %s via SMTP", email)
		}
	} else {
		// Dev mode: print code to console
		log.Printf("═══════════════════════════════════════════")
		log.Printf("  EMAIL VERIFICATION CODE for %s", email)
		log.Printf("  Code: %s", code)
		log.Printf("═══════════════════════════════════════════")
	}

	return c.JSON(fiber.Map{"status": "sent", "message": "Check your email for the code"})
}

func emailVerifyCode(c *fiber.Ctx) error {
	// IP-based rate limiting: 10 failed attempts per hour
	ip := c.IP()
	ipAttemptsMu.Lock()
	now := time.Now()
	// Clean old attempts (older than 1 hour)
	var recent []time.Time
	for _, t := range ipAttempts[ip] {
		if now.Sub(t) < time.Hour {
			recent = append(recent, t)
		}
	}
	ipAttempts[ip] = recent
	if len(recent) >= 10 {
		ipAttemptsMu.Unlock()
		return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": "Too many attempts. Try again in an hour."})
	}
	ipAttemptsMu.Unlock()

	type req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	email := strings.TrimSpace(strings.ToLower(body.Email))
	code := strings.TrimSpace(body.Code)

	emailCodesMu.Lock()
	stored, exists := emailCodes[email]
	emailCodesMu.Unlock()

	if !exists {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No code was sent. Please request a new one."})
	}

	if time.Now().After(stored.ExpiresAt) {
		emailCodesMu.Lock()
		delete(emailCodes, email)
		emailCodesMu.Unlock()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Code expired. Please request a new one."})
	}

	if stored.Code != code {
		// Record failed attempt for rate limiting
		ipAttemptsMu.Lock()
		ipAttempts[ip] = append(ipAttempts[ip], now)
		ipAttemptsMu.Unlock()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid code. Please try again."})
	}

	// Auth successful - delete code (one-time use)
	emailCodesMu.Lock()
	delete(emailCodes, email)
	emailCodesMu.Unlock()

	name := strings.Split(email, "@")[0]
	jwtToken := findOrCreateUserAndGetToken(email, name, "", "email")
	if jwtToken == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.JSON(fiber.Map{
		"token": jwtToken,
		"email": email,
		"name":  name,
	})
}

// ══════════════════════════════════════════════════════════════════════════════
// POLLING
// ══════════════════════════════════════════════════════════════════════════════

func authPoll(c *fiber.Ctx) error {
	sessionID := c.Query("session_id")
	token, exists := PendingLogins[sessionID]
	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"status": "pending"})
	}

	// Delete after retrieving so it can't be fetched again
	delete(PendingLogins, sessionID)
	return c.JSON(fiber.Map{"token": token})
}

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE & JWT
// ══════════════════════════════════════════════════════════════════════════════

func generateJWT(userID uint, email string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(time.Hour * 72 * 30).Unix(), // 30 дней
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func authMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing or invalid token"})
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	claims := token.Claims.(jwt.MapClaims)
	c.Locals("user_id", uint(claims["user_id"].(float64)))
	return c.Next()
}

// ══════════════════════════════════════════════════════════════════════════════
// API
// ══════════════════════════════════════════════════════════════════════════════

func getUserMe(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	var user User
	if err := db.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(fiber.Map{
		"email":   user.Email,
		"name":    user.Name,
		"picture": user.Picture,
	})
}

func uploadAvatar(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	file, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot open uploaded file"})
	}

	ext := ".png"
	if strings.Contains(file.Filename, ".jpg") || strings.Contains(file.Filename, ".jpeg") {
		ext = ".jpg"
	}

	filename := fmt.Sprintf("avatar_%d_%d%s", userID, time.Now().Unix(), ext)
	filepath := fmt.Sprintf("./uploads/%s", filename)

	if err := c.SaveFile(file, filepath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save file"})
	}

	fileUrl := fmt.Sprintf("http://localhost:8082/uploads/%s", filename)

	var user User
	if err := db.First(&user, userID).Error; err == nil {
		user.Picture = fileUrl
		db.Save(&user)
	}

	return c.JSON(fiber.Map{"picture": fileUrl})
}

// getUserStorage returns placeholder storage info for the profile panel
func getUserStorage(c *fiber.Ctx) error {
	// Placeholder - will be connected to real storage API later
	return c.JSON(fiber.Map{
		"used_bytes": 0,
		"max_bytes":  3 * 1024 * 1024 * 1024, // 3 GB
		"files":      []interface{}{},
	})
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

func findOrCreateUserAndGetToken(email, name, picture, provider string) string {
	var user User
	result := db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		// Create new user
		user = User{
			Email:    email,
			Name:     name,
			Picture:  picture,
			Provider: provider,
		}
		db.Create(&user)
	} else {
		// Update picture if it was empty
		if user.Picture == "" && picture != "" {
			user.Picture = picture
			db.Save(&user)
		}
		// Update name if it was empty
		if user.Name == "" && name != "" {
			user.Name = name
			db.Save(&user)
		}
	}

	jwtToken, err := generateJWT(user.ID, user.Email)
	if err != nil {
		log.Printf("Failed to generate JWT: %v", err)
		return ""
	}
	return jwtToken
}

func sendSuccessHTML(c *fiber.Ctx) error {
	htmlStr := `
		<html>
		<body style="background: #1e1e1e; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
			<div style="text-align: center;">
				<div style="font-size: 48px; margin-bottom: 16px;">✅</div>
				<h2 style="margin: 0 0 8px 0;">Authentication Successful!</h2>
				<p style="color: #858585; margin: 0;">You can close this tab and return to Devora.</p>
				<script>setTimeout(() => window.close(), 3000);</script>
			</div>
		</body>
		</html>
	`
	c.Set("Content-Type", "text/html")
	return c.SendString(htmlStr)
}

// sendEmailSMTP sends verification code via SMTP (SSL on port 465 for Mail.ru)
func sendEmailSMTP(host, user, pass, from, to, code string) error {
	if from == "" {
		from = user
	}

	portStr := os.Getenv("SMTP_PORT")
	port := 465
	if portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}

	subject := "Devora — Verification Code"
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#1e1e1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;padding:40px 0;">
<tr><td align="center">
<table width="400" cellpadding="0" cellspacing="0" style="background:#252526;border-radius:8px;border:1px solid #454545;padding:32px;">
<tr><td align="center" style="padding-bottom:24px;">
  <h2 style="color:#ffffff;margin:0 0 8px 0;font-size:20px;">Devora Verification</h2>
  <p style="color:#858585;margin:0;font-size:13px;">Your verification code:</p>
</td></tr>
<tr><td align="center" style="padding-bottom:24px;">
  <div style="background:#1e1e1e;border:1px solid #3c3c3c;border-radius:8px;padding:16px 32px;display:inline-block;">
    <span style="font-size:32px;font-weight:700;color:#0e9fff;letter-spacing:8px;font-family:'Consolas',monospace;">%s</span>
  </div>
</td></tr>
<tr><td align="center">
  <p style="color:#858585;font-size:12px;margin:0;">This code expires in 10 minutes.<br>If you didn't request this, ignore this email.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`, code)

	// Build MIME message
	headers := fmt.Sprintf("From: Devora <%s>\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n", from, to, subject)
	msg := []byte(headers + htmlBody)

	addr := fmt.Sprintf("%s:%d", host, port)

	// SSL connection (port 465)
	tlsConfig := &tls.Config{
		ServerName: host,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("TLS dial failed: %w", err)
	}

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("SMTP client failed: %w", err)
	}
	defer client.Close()

	auth := smtp.PlainAuth("", user, pass, host)
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP auth failed: %w", err)
	}

	if err = client.Mail(from); err != nil {
		return fmt.Errorf("SMTP MAIL FROM failed: %w", err)
	}
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("SMTP RCPT TO failed: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP DATA failed: %w", err)
	}
	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("SMTP write failed: %w", err)
	}
	err = w.Close()
	if err != nil {
		return fmt.Errorf("SMTP close failed: %w", err)
	}

	return client.Quit()
}
