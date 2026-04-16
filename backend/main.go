package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	googleOauthConfig *oauth2.Config
	db                *gorm.DB
	jwtSecret         []byte
	PendingLogins     = make(map[string]string) 
)

// User - Структура пользователя в базе данных
type User struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex"`
	Name      string
	Picture   string
	Provider  string // 'google', 'facebook', 'email'
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
		return c.SendString("Devora Auth Server with DB is running!")
	})

	// OAuth Endpoints
	app.Get("/auth/google/login", googleLogin)
	app.Get("/auth/google/callback", googleCallback)
	app.Get("/api/auth/poll", authPoll)

	// API Endpoints (Требуют токен)
	api := app.Group("/api", authMiddleware)
	api.Get("/user/me", getUserMe)
	api.Post("/user/avatar", uploadAvatar)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	log.Printf("Starting Auth Server on port %s", port)
	app.Listen(":" + port)
}

// ---------------------- OAUTH ----------------------

func googleLogin(c *fiber.Ctx) error {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		sessionID = "devora_state"
	}
	url := googleOauthConfig.AuthCodeURL(sessionID)
	return c.Redirect(url)
}

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

func googleCallback(c *fiber.Ctx) error {
	state := c.Query("state")
	if state == "" {
		return c.Status(fiber.StatusUnauthorized).SendString("Invalid state")
	}

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

	// Ищем пользователя в БД
	var user User
	result := db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		// Создаем нового
		user = User{
			Email:    email,
			Name:     name,
			Picture:  picture,
			Provider: "google",
		}
		db.Create(&user)
	} else if user.Picture == "" {
		// Обновляем фотку, если не было
		user.Picture = picture
		db.Save(&user)
	}

	// Генерируем JWT токен
	jwtToken, err := generateJWT(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate token")
	}

	// Сохраняем в памяти для Devora IDE
	PendingLogins[state] = jwtToken

	htmlStr := fmt.Sprintf(`
		<html>
		<body style="background: #08080E; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
			<div style="text-align: center;">
				<h2>Успешный вход!</h2>
				<p style="color: #ccc; margin-top: 10px;">Можете закрыть эту вкладку и вернуться в Devora.</p>
				<script>
					setTimeout(() => window.close(), 3000);
				</script>
			</div>
		</body>
		</html>
	`)

	c.Set("Content-Type", "text/html")
	return c.SendString(htmlStr)
}

// ---------------------- MIDDLEWARE & JWT ----------------------

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

// ---------------------- API ----------------------

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

	fileUrl := fmt.Sprintf("http://localhost:8082/uploads/%s", filename) // Для VDS это будет api.devoraide.ru/uploads/...

	var user User
	if err := db.First(&user, userID).Error; err == nil {
		user.Picture = fileUrl
		db.Save(&user)
	}

	return c.JSON(fiber.Map{"picture": fileUrl})
}
