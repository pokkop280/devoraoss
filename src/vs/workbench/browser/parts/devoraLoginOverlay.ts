/*---------------------------------------------------------------------------------------------
 *  Devora Login Overlay
 *  Sign-in modal with GitHub, Google, Email (code) auth + welcome + profile
 *--------------------------------------------------------------------------------------------*/

let overlayElement: HTMLElement | null = null;

// ── SVG Data URIs ───────────────────────────────────────────────────────────
const VSCODE_OSS_ICON = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
  <circle cx="12" cy="8" r="4"/>
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
</svg>`);

const GITHUB_ICON = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjY2NjY2NjIj48cGF0aCBkPSJNMTIgMkM2LjQ3NyAyIDIgNi40NzcgMiAxMmMwIDQuNDIgMi44NjUgOC4xNjYgNi44MzkgOS40OS41LjA5Mi42ODItLjIxNy42ODItLjQ4MiAwLS4yMzctLjAwOC0uODY2LS4wMTMtMS43LTIuNzgyLjYwMy0zLjM2OS0xLjM0LTMuMzY5LTEuMzQtLjQ1NC0xLjE1Ni0xLjExLTEuNDY0LTEuMTEtMS40NjQtLjkwOC0uNjIuMDY5LS42MDguMDY5LS42MDggMS4wMDMuMDcgMS41MzEgMS4wMyAxLjUzMSAxLjAzLjg5MiAxLjUyOSAyLjM0MSAxLjA4NyAyLjkxLjgzMS4wOTItLjY0Ni4zNS0xLjA4Ni42MzYtMS4zMzYtMi4yMi0uMjUzLTQuNTU1LTEuMTEtNC41NTUtNC45NDMgMC0xLjA5MS4zOS0xLjk4NCAxLjAyOS0yLjY4My0uMTAzLS4yNTMtLjQ0Ni0xLjI3LjA5OC0yLjY0NyAwIDAgLjg0LS4yNjkgMi43NSAxLjAyNUE5LjU3OCA5LjU3OCAwIDAxMTIgNi44MzZjLjg1LjAwNCAxLjcwNS4xMTQgMi41MDQuMzM2IDEuOTA5LTEuMjk0IDIuNzQ3LTEuMDI1IDIuNzQ3LTEuMDI1LjU0NiAxLjM3Ny4yMDMgMi4zOTQuMSAyLjY0Ny42NC42OTkgMS4wMjggMS41OTIgMS4wMjggMi42ODMgMCAzLjg0Mi0yLjMzOSA0LjY4Ny00LjU2NiA0LjkzNS4zNTkuMzA5LjY3OC45MTkuNjc4IDEuODUyIDAgMS4zMzYtLjAxMiAyLjQxNS0uMDEyIDIuNzQzIDAgLjI2Ny4xOC41NzguNjg4LjQ4QzE5LjEzOCAyMC4xNjEgMjIgMTYuNDE4IDIyIDEyYzAtNS41MjMtNC40NzctMTAtMTAtMTB6Ii8+PC9zdmc+';
const GOOGLE_ICON = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiLz48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDLjkyIDE2LjQ2IDAgMjAuMTIgMCAyNGMwIDMuODguOTIgNy41NCAyLjU2IDEwLjc4bDcuOTctNi4xOXoiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ii8+PC9zdmc+';
const EMAIL_ICON = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA0aDE2YzEuMSAwIDIgLjkgMiAydjEyYzAgMS4xLS45IDItMiAySDRjLTEuMSAwLTItLjktMi0yVjZjMC0xLjEuOS0yIDItMnoiLz48cG9seWxpbmUgcG9pbnRzPSIyMiw2IDEyLDEzIDIsNiIvPjwvc3ZnPg==';

const AUTH_SERVER = 'http://localhost:8082';

// ── Profile cache helpers ──────────────────────────────────────────────────
function saveProfileCache(name: string, email: string, picture: string): void {
	localStorage.setItem('devora-profile', JSON.stringify({ name, email, picture }));
}

function getProfileCache(): { name: string; email: string; picture: string } | null {
	try {
		const raw = localStorage.getItem('devora-profile');
		if (raw) { return JSON.parse(raw); }
	} catch { }
	return null;
}

function clearProfileCache(): void {
	localStorage.removeItem('devora-auth-token');
	localStorage.removeItem('devora-profile');
}

export function showDevoraLoginOverlay(): void {
	if (overlayElement) {
		return;
	}

	// Check if user is already logged in
	const existingToken = localStorage.getItem('devora-auth-token');
	if (existingToken) {
		showProfileOverlay();
		return;
	}

	createLoginOverlay();
}

function createLoginOverlay(): void {
	// ── Overlay container ────────────────────────────────────────────────
	const overlay = document.createElement('div');
	overlay.id = 'devora-login-overlay';
	overlay.style.cssText = `
		position: fixed;
		inset: 0;
		z-index: 99999;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: rgba(0, 0, 0, 0.4);
	`;

	// ── Glass card ───────────────────────────────────────────────────────
	const card = document.createElement('div');
	card.style.cssText = `
		position: relative;
		width: 380px;
		padding: 32px;
		border-radius: 8px;
		background: #252526;
		border: 1px solid #454545;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		text-align: center;
		color: #cccccc;
		display: flex;
		flex-direction: column;
		align-items: center;
	`;

	// ── Close button ─────────────────────────────────────────────────────
	const closeBtn = createCloseButton();

	// ── VS Code OSS Icon (no glow) ───────────────────────────────────────
	const iconWrap = document.createElement('div');
	iconWrap.style.cssText = 'width: 56px; height: 56px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;';
	const logoImg = document.createElement('img');
	logoImg.src = VSCODE_OSS_ICON;
	logoImg.style.cssText = 'width: 100%; height: 100%;';
	iconWrap.appendChild(logoImg);

	const title = document.createElement('h2');
	title.textContent = 'Sign in for all features';
	title.style.cssText = 'font-size: 16px; font-weight: 500; color: #cccccc; margin: 0 0 24px 0;';

	const contentArea = document.createElement('div');
	contentArea.style.width = '100%';

	// ── Auth buttons ────────────────────────────────────────────────────
	const githubBtn = makeBtn(GITHUB_ICON, 'Continue with GitHub', true);
	const googleBtn = makeBtn(GOOGLE_ICON, 'Continue with Google', false);
	const emailBtn = makeBtn(EMAIL_ICON, 'Continue with Email', false);

	// ── Button handlers ─────────────────────────────────────────────────
	githubBtn.onclick = () => {
		showWaiting(contentArea, renderButtons);
		const sessionId = Math.random().toString(36).substring(2, 15);
		openExternal(`${AUTH_SERVER}/auth/github/login?session_id=${sessionId}`);
		startPolling(sessionId, contentArea, renderButtons);
	};

	googleBtn.onclick = () => {
		showWaiting(contentArea, renderButtons);
		const sessionId = Math.random().toString(36).substring(2, 15);
		openExternal(`${AUTH_SERVER}/auth/google/login?session_id=${sessionId}`);
		startPolling(sessionId, contentArea, renderButtons);
	};

	emailBtn.onclick = () => {
		showEmailInput(contentArea, renderButtons);
	};

	const renderButtons = () => {
		contentArea.textContent = '';
		contentArea.style.padding = '0';
		contentArea.appendChild(githubBtn);
		contentArea.appendChild(googleBtn);
		contentArea.appendChild(emailBtn);
	};

	renderButtons();

	// ── Footer ──────────────────────────────────────────────────────────
	const footer = document.createElement('p');
	footer.style.cssText = 'font-size: 12px; color: #858585; margin: 24px 0 0 0; line-height: 1.5;';
	const p1 = document.createElement('div');
	p1.textContent = "By continuing, you agree to Devora's Terms and Privacy Statement.";
	const p2 = document.createElement('div');
	p2.textContent = "Devora may use your data to improve the product.";
	p2.style.marginTop = '4px';
	footer.appendChild(p1);
	footer.appendChild(p2);

	// ── Assemble ─────────────────────────────────────────────────────────
	card.appendChild(closeBtn);
	card.appendChild(iconWrap);
	card.appendChild(title);
	card.appendChild(contentArea);
	card.appendChild(footer);
	overlay.appendChild(card);
	document.body.appendChild(overlay);
	overlayElement = overlay;

	setupOverlayListeners(overlay);
	animateIn(card);
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL AUTH FLOW (code-based, no password)
// ══════════════════════════════════════════════════════════════════════════════

function showEmailInput(contentArea: HTMLElement, renderButtons: () => void): void {
	contentArea.textContent = '';
	contentArea.style.padding = '0';

	const label = document.createElement('div');
	label.textContent = 'Enter your email address';
	label.style.cssText = 'font-size: 13px; color: #cccccc; margin-bottom: 12px; text-align: left;';

	const input = document.createElement('input');
	input.type = 'email';
	input.placeholder = 'your@email.com';
	input.style.cssText = `
		width: 100%; padding: 8px 12px; border-radius: 4px; border: 1px solid #3c3c3c;
		background: #1e1e1e; color: #cccccc; font-size: 13px; font-family: inherit;
		outline: none; box-sizing: border-box; margin-bottom: 12px;
	`;
	input.onfocus = () => input.style.borderColor = '#0e639c';
	input.onblur = () => input.style.borderColor = '#3c3c3c';

	const sendBtn = document.createElement('button');
	sendBtn.textContent = 'Send Code';
	sendBtn.style.cssText = `
		width: 100%; padding: 8px 16px; border-radius: 4px; background: #0e639c;
		border: 1px solid #1177bb; color: #ffffff; font-size: 13px; font-family: inherit;
		cursor: pointer; margin-bottom: 12px; transition: background 0.2s;
	`;
	sendBtn.onmouseenter = () => sendBtn.style.background = '#1177bb';
	sendBtn.onmouseleave = () => sendBtn.style.background = '#0e639c';

	const backBtn = createBackButton(renderButtons);

	const errorMsg = document.createElement('div');
	errorMsg.style.cssText = 'font-size: 12px; color: #f48771; margin-bottom: 8px; display: none;';

	sendBtn.onclick = async () => {
		const email = input.value.trim();
		if (!email || !email.includes('@')) {
			errorMsg.textContent = 'Please enter a valid email address.';
			errorMsg.style.display = 'block';
			return;
		}
		errorMsg.style.display = 'none';
		sendBtn.textContent = 'Sending...';
		sendBtn.style.opacity = '0.7';
		sendBtn.style.pointerEvents = 'none';

		try {
			const res = await fetch(`${AUTH_SERVER}/auth/email/send-code`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to send code');
			}
			showCodeInput(contentArea, email, renderButtons);
		} catch (e: any) {
			errorMsg.textContent = e.message || 'Failed to send code. Is the server running?';
			errorMsg.style.display = 'block';
			sendBtn.textContent = 'Send Code';
			sendBtn.style.opacity = '1';
			sendBtn.style.pointerEvents = 'auto';
		}
	};

	input.onkeydown = (e) => { if (e.key === 'Enter') { sendBtn.click(); } };

	contentArea.appendChild(label);
	contentArea.appendChild(input);
	contentArea.appendChild(errorMsg);
	contentArea.appendChild(sendBtn);
	contentArea.appendChild(backBtn);

	setTimeout(() => input.focus(), 50);
}

function showCodeInput(contentArea: HTMLElement, email: string, renderButtons: () => void): void {
	contentArea.textContent = '';

	const infoText = document.createElement('div');
	infoText.style.cssText = 'font-size: 13px; color: #cccccc; margin-bottom: 4px;';
	infoText.textContent = 'We sent a code to';

	const emailText = document.createElement('div');
	emailText.textContent = email;
	emailText.style.cssText = 'font-size: 13px; color: #0e9fff; margin-bottom: 16px; font-weight: 500;';

	// 6-digit code input boxes
	const codeWrap = document.createElement('div');
	codeWrap.style.cssText = 'display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;';

	const inputs: HTMLInputElement[] = [];
	for (let i = 0; i < 6; i++) {
		const box = document.createElement('input');
		box.type = 'text';
		box.maxLength = 1;
		box.style.cssText = `
			width: 38px; height: 44px; text-align: center; font-size: 18px; font-weight: 600;
			border-radius: 4px; border: 1px solid #3c3c3c; background: #1e1e1e; color: #cccccc;
			font-family: 'Consolas', 'Courier New', monospace; outline: none; box-sizing: border-box;
		`;
		box.onfocus = () => box.style.borderColor = '#0e639c';
		box.onblur = () => box.style.borderColor = '#3c3c3c';
		box.oninput = () => {
			if (box.value && i < 5) { inputs[i + 1].focus(); }
		};
		box.onkeydown = (e) => {
			if (e.key === 'Backspace' && !box.value && i > 0) { inputs[i - 1].focus(); }
		};
		inputs.push(box);
		codeWrap.appendChild(box);
	}

	const errorMsg = document.createElement('div');
	errorMsg.style.cssText = 'font-size: 12px; color: #f48771; margin-bottom: 8px; display: none;';

	const verifyBtn = document.createElement('button');
	verifyBtn.textContent = 'Verify';
	verifyBtn.style.cssText = `
		width: 100%; padding: 8px 16px; border-radius: 4px; background: #0e639c;
		border: 1px solid #1177bb; color: #ffffff; font-size: 13px; font-family: inherit;
		cursor: pointer; margin-bottom: 12px; transition: background 0.2s;
	`;
	verifyBtn.onmouseenter = () => verifyBtn.style.background = '#1177bb';
	verifyBtn.onmouseleave = () => verifyBtn.style.background = '#0e639c';

	verifyBtn.onclick = async () => {
		const code = inputs.map(i => i.value).join('');
		if (code.length !== 6) {
			errorMsg.textContent = 'Please enter the full 6-digit code.';
			errorMsg.style.display = 'block';
			return;
		}
		errorMsg.style.display = 'none';
		verifyBtn.textContent = 'Verifying...';
		verifyBtn.style.opacity = '0.7';

		try {
			const res = await fetch(`${AUTH_SERVER}/auth/email/verify-code`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code })
			});
			const data = await res.json();
			if (!res.ok) { throw new Error(data.error || 'Invalid code'); }
			if (data.token) {
				localStorage.setItem('devora-auth-token', data.token);
				saveProfileCache(data.name || email.split('@')[0], data.email || email, '');
				closeDevoraLoginOverlay();
				showWelcomeOverlay(data.name || email.split('@')[0], data.email || email);
			}
		} catch (e: any) {
			errorMsg.textContent = e.message || 'Invalid code.';
			errorMsg.style.display = 'block';
			verifyBtn.textContent = 'Verify';
			verifyBtn.style.opacity = '1';
			inputs.forEach(i => { i.value = ''; });
			inputs[0].focus();
		}
	};

	const backBtn = createBackButton(renderButtons);

	contentArea.appendChild(infoText);
	contentArea.appendChild(emailText);
	contentArea.appendChild(codeWrap);
	contentArea.appendChild(errorMsg);
	contentArea.appendChild(verifyBtn);
	contentArea.appendChild(backBtn);

	setTimeout(() => inputs[0].focus(), 50);
}

// ══════════════════════════════════════════════════════════════════════════════
// WELCOME SCREEN (shown after first login)
// ══════════════════════════════════════════════════════════════════════════════

function showWelcomeOverlay(name: string, email: string): void {
	const overlay = document.createElement('div');
	overlay.id = 'devora-login-overlay';
	overlay.style.cssText = `
		position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center;
		justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: rgba(0, 0, 0, 0.4);
	`;

	const card = document.createElement('div');
	card.style.cssText = `
		position: relative; width: 420px; padding: 36px; border-radius: 8px;
		background: #252526; border: 1px solid #454545; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
		text-align: center; color: #cccccc; display: flex; flex-direction: column; align-items: center;
	`;

	const closeBtn = createCloseButton();
	card.appendChild(closeBtn);

	// Welcome heading
	const heading = document.createElement('h2');
	heading.textContent = `Welcome, ${name}!`;
	heading.style.cssText = 'font-size: 20px; font-weight: 600; color: #ffffff; margin: 0 0 8px 0;';

	const subtext = document.createElement('div');
	subtext.textContent = email;
	subtext.style.cssText = 'font-size: 13px; color: #858585; margin-bottom: 24px;';

	// Feature highlights
	const features = [
		{ icon: '🤖', title: 'AI-Powered Coding', desc: 'Intelligent code completion and chat assistant' },
		{ icon: '⚡', title: 'Lightning Fast', desc: 'Optimized performance for large projects' },
		{ icon: '🔌', title: 'Extensions', desc: 'Full VS Code extension marketplace support' },
		{ icon: '🔒', title: 'Secure', desc: 'Your code stays private and protected' },
	];

	const featuresWrap = document.createElement('div');
	featuresWrap.style.cssText = 'width: 100%; text-align: left; margin-bottom: 24px;';

	for (const f of features) {
		const row = document.createElement('div');
		row.style.cssText = `
			display: flex; align-items: center; gap: 12px; padding: 10px 12px;
			border-radius: 6px; margin-bottom: 6px; transition: background 0.15s;
		`;
		row.onmouseenter = () => row.style.background = 'rgba(255,255,255,0.04)';
		row.onmouseleave = () => row.style.background = 'transparent';

		const icon = document.createElement('span');
		icon.textContent = f.icon;
		icon.style.cssText = 'font-size: 22px; flex-shrink: 0;';

		const textWrap = document.createElement('div');
		const titleEl = document.createElement('div');
		titleEl.textContent = f.title;
		titleEl.style.cssText = 'font-size: 13px; font-weight: 500; color: #e0e0e0;';
		const descEl = document.createElement('div');
		descEl.textContent = f.desc;
		descEl.style.cssText = 'font-size: 12px; color: #858585; margin-top: 2px;';
		textWrap.appendChild(titleEl);
		textWrap.appendChild(descEl);

		row.appendChild(icon);
		row.appendChild(textWrap);
		featuresWrap.appendChild(row);
	}

	const continueBtn = document.createElement('button');
	continueBtn.textContent = 'Get Started';
	continueBtn.style.cssText = `
		width: 100%; padding: 10px 16px; border-radius: 4px; background: #0e639c;
		border: 1px solid #1177bb; color: #ffffff; font-size: 14px; font-weight: 500;
		font-family: inherit; cursor: pointer; transition: background 0.2s;
	`;
	continueBtn.onmouseenter = () => continueBtn.style.background = '#1177bb';
	continueBtn.onmouseleave = () => continueBtn.style.background = '#0e639c';
	continueBtn.onclick = () => closeDevoraLoginOverlay();

	card.appendChild(heading);
	card.appendChild(subtext);
	card.appendChild(featuresWrap);
	card.appendChild(continueBtn);

	overlay.appendChild(card);
	document.body.appendChild(overlay);
	overlayElement = overlay;

	setupOverlayListeners(overlay);
	animateIn(card);
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE SCREEN (shown when already logged in)
// ══════════════════════════════════════════════════════════════════════════════

function showProfileOverlay(): void {
	const overlay = document.createElement('div');
	overlay.id = 'devora-login-overlay';
	overlay.style.cssText = `
		position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center;
		justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: rgba(0, 0, 0, 0.4);
	`;

	const card = document.createElement('div');
	card.style.cssText = `
		position: relative; width: 440px; max-height: 85vh; padding: 28px; border-radius: 8px;
		background: #252526; border: 1px solid #454545; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
		text-align: center; color: #cccccc; display: flex; flex-direction: column; align-items: center;
		overflow-y: auto;
	`;

	const closeBtn = createCloseButton();
	card.appendChild(closeBtn);

	// Loading state
	const spinnerWrap = document.createElement('div');
	spinnerWrap.style.cssText = 'display: flex; justify-content: center; margin: 8px 0;';
	const spinner = document.createElement('div');
	spinner.style.cssText = 'width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #0e639c; border-radius: 50%;';
	spinner.animate([
		{ transform: 'rotate(0deg)' },
		{ transform: 'rotate(360deg)' }
	], { duration: 1000, iterations: Infinity });
	spinnerWrap.appendChild(spinner);

	const loadingText = document.createElement('div');
	loadingText.textContent = 'Loading profile...';
	loadingText.style.cssText = 'font-size: 13px; color: #858585;';

	card.appendChild(spinnerWrap);
	card.appendChild(loadingText);

	overlay.appendChild(card);
	document.body.appendChild(overlay);
	overlayElement = overlay;

	setupOverlayListeners(overlay);
	animateIn(card);

	// Show cached profile immediately, then try to update from server
	const cached = getProfileCache();
	if (cached) {
		renderProfile(card, cached.name || 'User', cached.email || '', cached.picture || '');
	}

	const token = localStorage.getItem('devora-auth-token')!;
	fetch(`${AUTH_SERVER}/api/user/me`, {
		headers: { 'Authorization': `Bearer ${token}` }
	}).then(res => {
		if (!res.ok) { throw new Error('Unauthorized'); }
		return res.json();
	}).then(data => {
		saveProfileCache(data.name || 'User', data.email || '', data.picture || '');
		renderProfile(card, data.name || 'User', data.email || '', data.picture || '');
	}).catch((err) => {
		if (err.message === 'Unauthorized') {
			clearProfileCache();
			closeDevoraLoginOverlay();
			createLoginOverlay();
		}
	});
}

function renderProfile(card: HTMLElement, name: string, email: string, picture: string): void {
	const closeBtn = card.querySelector('button');
	card.textContent = '';
	if (closeBtn) { card.appendChild(closeBtn); }

	// ── Header section ─────────────────────────────────────────────────
	const headerSection = document.createElement('div');
	headerSection.style.cssText = 'display: flex; align-items: center; gap: 16px; width: 100%; margin-bottom: 20px; text-align: left;';

	// Avatar (clickable to change)
	const avatarWrap = document.createElement('div');
	avatarWrap.style.cssText = 'width: 56px; height: 56px; border-radius: 50%; overflow: hidden; background: #333; flex-shrink: 0; cursor: pointer; position: relative;';
	avatarWrap.title = 'Change avatar';

	if (picture) {
		const img = document.createElement('img');
		img.src = picture;
		img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
		avatarWrap.appendChild(img);
	} else {
		const initials = document.createElement('div');
		initials.textContent = (name || 'U').substring(0, 2).toUpperCase();
		initials.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600; color: #ffffff; background: #0e639c;';
		avatarWrap.appendChild(initials);
	}

	// Avatar hover overlay
	const avatarHover = document.createElement('div');
	avatarHover.style.cssText = 'position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; border-radius: 50%;';
	avatarHover.textContent = '📷';
	avatarWrap.appendChild(avatarHover);
	avatarWrap.onmouseenter = () => avatarHover.style.opacity = '1';
	avatarWrap.onmouseleave = () => avatarHover.style.opacity = '0';

	// Hidden file input for avatar
	const avatarInput = document.createElement('input');
	avatarInput.type = 'file';
	avatarInput.accept = 'image/*';
	avatarInput.style.display = 'none';
	avatarInput.onchange = async () => {
		const file = avatarInput.files?.[0];
		if (!file) { return; }
		const formData = new FormData();
		formData.append('avatar', file);
		const token = localStorage.getItem('devora-auth-token');
		try {
			const res = await fetch(`${AUTH_SERVER}/api/user/avatar`, {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` },
				body: formData
			});
			if (res.ok) {
				const data = await res.json();
				saveProfileCache(name, email, data.picture || '');
				renderProfile(card, name, email, data.picture || '');
				showToast('Avatar updated!');
			}
		} catch { showToast('Failed to upload avatar'); }
	};
	avatarWrap.onclick = () => avatarInput.click();

	const userInfo = document.createElement('div');
	const nameEl = document.createElement('div');
	nameEl.textContent = name;
	nameEl.style.cssText = 'font-size: 16px; font-weight: 600; color: #ffffff;';
	const emailEl = document.createElement('div');
	emailEl.textContent = email;
	emailEl.style.cssText = 'font-size: 12px; color: #858585; margin-top: 2px;';
	const badgeEl = document.createElement('div');
	badgeEl.textContent = '✓ Verified';
	badgeEl.style.cssText = 'font-size: 11px; color: #4ec9b0; margin-top: 4px;';
	userInfo.appendChild(nameEl);
	userInfo.appendChild(emailEl);
	userInfo.appendChild(badgeEl);

	headerSection.appendChild(avatarWrap);
	headerSection.appendChild(avatarInput);
	headerSection.appendChild(userInfo);
	card.appendChild(headerSection);

	// ── Divider ────────────────────────────────────────────────────────
	const divider1 = document.createElement('div');
	divider1.style.cssText = 'width: 100%; height: 1px; background: #3c3c3c; margin-bottom: 16px;';
	card.appendChild(divider1);

	// ── Storage section ────────────────────────────────────────────────
	const storageSection = document.createElement('div');
	storageSection.style.cssText = 'width: 100%; text-align: left; margin-bottom: 16px;';

	const storageTitleRow = document.createElement('div');
	storageTitleRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
	const storageTitle = document.createElement('div');
	storageTitle.textContent = '☁️ Cloud Storage';
	storageTitle.style.cssText = 'font-size: 13px; font-weight: 500; color: #e0e0e0;';
	const storageUsage = document.createElement('div');
	storageUsage.textContent = '0 MB / 3 GB';
	storageUsage.style.cssText = 'font-size: 11px; color: #858585;';
	storageTitleRow.appendChild(storageTitle);
	storageTitleRow.appendChild(storageUsage);

	// Progress bar
	const progressBg = document.createElement('div');
	progressBg.style.cssText = 'width: 100%; height: 6px; background: #1e1e1e; border-radius: 3px; overflow: hidden; margin-bottom: 12px;';
	const progressFill = document.createElement('div');
	progressFill.style.cssText = 'width: 0%; height: 100%; background: linear-gradient(90deg, #0e639c, #0e9fff); border-radius: 3px; transition: width 0.5s ease;';
	progressBg.appendChild(progressFill);

	// File list area
	const fileListWrap = document.createElement('div');
	fileListWrap.style.cssText = 'width: 100%; max-height: 120px; overflow-y: auto; margin-bottom: 8px;';
	const emptyState = document.createElement('div');
	emptyState.textContent = 'No files uploaded yet';
	emptyState.style.cssText = 'font-size: 12px; color: #585858; text-align: center; padding: 12px 0;';
	fileListWrap.appendChild(emptyState);

	// Upload button
	const uploadBtn = document.createElement('button');
	uploadBtn.textContent = '↑ Upload Files';
	uploadBtn.style.cssText = `
		width: 100%; padding: 7px 16px; border-radius: 4px; background: #0e639c;
		border: 1px solid #1177bb; color: #ffffff; font-size: 12px; font-family: inherit;
		cursor: pointer; transition: background 0.2s;
	`;
	uploadBtn.onmouseenter = () => uploadBtn.style.background = '#1177bb';
	uploadBtn.onmouseleave = () => uploadBtn.style.background = '#0e639c';
	uploadBtn.onclick = () => {
		showToast('Storage API not configured yet. Contact admin.');
	};

	storageSection.appendChild(storageTitleRow);
	storageSection.appendChild(progressBg);
	storageSection.appendChild(fileListWrap);
	storageSection.appendChild(uploadBtn);
	card.appendChild(storageSection);

	// ── Divider ────────────────────────────────────────────────────────
	const divider2 = document.createElement('div');
	divider2.style.cssText = 'width: 100%; height: 1px; background: #3c3c3c; margin-bottom: 16px;';
	card.appendChild(divider2);

	// ── Account info rows ──────────────────────────────────────────────
	const infoSection = document.createElement('div');
	infoSection.style.cssText = 'width: 100%; margin-bottom: 16px;';

	const infoRows = [
		{ icon: '🔑', label: 'Account Type', value: 'Free' },
		{ icon: '📅', label: 'Member Since', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) },
		{ icon: '🤖', label: 'AI Requests', value: 'Unlimited' },
	];

	for (const info of infoRows) {
		const row = document.createElement('div');
		row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; transition: background 0.15s;';
		row.onmouseenter = () => row.style.background = 'rgba(255,255,255,0.03)';
		row.onmouseleave = () => row.style.background = 'transparent';

		const left = document.createElement('div');
		left.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 12px; color: #cccccc;';
		const iconSpan = document.createElement('span');
		iconSpan.textContent = info.icon;
		const labelSpan = document.createElement('span');
		labelSpan.textContent = info.label;
		left.appendChild(iconSpan);
		left.appendChild(labelSpan);

		const right = document.createElement('div');
		right.textContent = info.value;
		right.style.cssText = 'font-size: 12px; color: #858585;';

		row.appendChild(left);
		row.appendChild(right);
		infoSection.appendChild(row);
	}
	card.appendChild(infoSection);

	// ── Sign out button ────────────────────────────────────────────────
	const signOutBtn = document.createElement('button');
	signOutBtn.textContent = 'Sign Out';
	signOutBtn.style.cssText = `
		width: 100%; padding: 8px 16px; border-radius: 4px; background: transparent;
		border: 1px solid #3c3c3c; color: #cccccc; font-size: 13px; font-family: inherit;
		cursor: pointer; transition: background 0.2s, border-color 0.2s;
	`;
	signOutBtn.onmouseenter = () => { signOutBtn.style.background = 'rgba(255,80,80,0.08)'; signOutBtn.style.borderColor = '#6e3030'; signOutBtn.style.color = '#f48771'; };
	signOutBtn.onmouseleave = () => { signOutBtn.style.background = 'transparent'; signOutBtn.style.borderColor = '#3c3c3c'; signOutBtn.style.color = '#cccccc'; };
	signOutBtn.onclick = () => {
		clearProfileCache();
		showToast('Signed out successfully');
		closeDevoraLoginOverlay();
	};
	card.appendChild(signOutBtn);

	// ── Fetch storage info (placeholder - needs API) ────────────────
	const token = localStorage.getItem('devora-auth-token');
	if (token) {
		fetch(`${AUTH_SERVER}/api/user/storage`, {
			headers: { 'Authorization': `Bearer ${token}` }
		}).then(res => res.ok ? res.json() : null).then(data => {
			if (data) {
				const usedMB = (data.used_bytes || 0) / (1024 * 1024);
				const maxGB = 3;
				const pct = Math.min((usedMB / (maxGB * 1024)) * 100, 100);
				storageUsage.textContent = `${usedMB.toFixed(1)} MB / ${maxGB} GB`;
				progressFill.style.width = `${pct}%`;
				if (pct > 80) { progressFill.style.background = 'linear-gradient(90deg, #c9680e, #ff4444)'; }

				if (data.files && data.files.length > 0) {
					fileListWrap.textContent = '';
					for (const f of data.files) {
						const fileRow = document.createElement('div');
						fileRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; transition: background 0.15s;';
						fileRow.onmouseenter = () => fileRow.style.background = 'rgba(255,255,255,0.03)';
						fileRow.onmouseleave = () => fileRow.style.background = 'transparent';

						const fileName = document.createElement('div');
						fileName.textContent = `📄 ${f.name}`;
						fileName.style.cssText = 'font-size: 12px; color: #cccccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;';

						const fileSize = document.createElement('div');
						const sizeB = f.size || 0;
						const sMB = sizeB / (1024 * 1024);
						fileSize.textContent = sMB < 1 ? `${(sizeB / 1024).toFixed(1)} KB` : `${sMB.toFixed(1)} MB`;
						fileSize.style.cssText = 'font-size: 11px; color: #585858; flex-shrink: 0;';

						fileRow.appendChild(fileName);
						fileRow.appendChild(fileSize);
						fileListWrap.appendChild(fileRow);
					}
				}
			}
		}).catch(() => { /* storage API not available yet */ });
	}
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function makeBtn(iconUri: string, text: string, isPrimary: boolean): HTMLButtonElement {
	const btn = document.createElement('button');
	const bg = isPrimary ? '#0e639c' : 'transparent';
	const border = isPrimary ? '1px solid #1177bb' : '1px solid #3c3c3c';
	const hoverBg = isPrimary ? '#1177bb' : 'rgba(255, 255, 255, 0.05)';

	btn.style.cssText = `
		width: 100%; padding: 8px 16px; margin-bottom: 12px; border-radius: 4px;
		background: ${bg}; border: ${border}; color: #cccccc; font-size: 13px;
		font-family: inherit; cursor: pointer; display: flex; align-items: center;
		justify-content: center; gap: 8px; transition: background 0.2s;
	`;

	const iconSpan = document.createElement('img');
	iconSpan.style.cssText = 'width:16px;height:16px;';
	iconSpan.src = iconUri;

	const textSpan = document.createElement('span');
	textSpan.textContent = text;

	btn.appendChild(iconSpan);
	btn.appendChild(textSpan);

	btn.onmouseenter = () => btn.style.background = hoverBg;
	btn.onmouseleave = () => btn.style.background = bg;
	return btn;
}

function createCloseButton(): HTMLButtonElement {
	const svgNamespace = "http://www.w3.org/2000/svg";
	const closeBtn = document.createElement('button');
	const closeSvg = document.createElementNS(svgNamespace, "svg");
	closeSvg.setAttribute("width", "16");
	closeSvg.setAttribute("height", "16");
	closeSvg.setAttribute("viewBox", "0 0 24 24");
	closeSvg.setAttribute("fill", "none");
	closeSvg.setAttribute("stroke", "currentColor");
	closeSvg.setAttribute("stroke-width", "2");
	const line1 = document.createElementNS(svgNamespace, "line");
	line1.setAttribute("x1", "18"); line1.setAttribute("y1", "6"); line1.setAttribute("x2", "6"); line1.setAttribute("y2", "18");
	const line2 = document.createElementNS(svgNamespace, "line");
	line2.setAttribute("x1", "6"); line2.setAttribute("y1", "6"); line2.setAttribute("x2", "18"); line2.setAttribute("y2", "18");
	closeSvg.appendChild(line1);
	closeSvg.appendChild(line2);
	closeBtn.appendChild(closeSvg);
	closeBtn.style.cssText = `
		position: absolute; top: 12px; right: 12px; background: transparent;
		border: none; color: #858585; cursor: pointer; display: flex; align-items: center;
		justify-content: center; padding: 4px; border-radius: 4px;
	`;
	closeBtn.onmouseenter = () => closeBtn.style.color = '#cccccc';
	closeBtn.onmouseleave = () => closeBtn.style.color = '#858585';
	closeBtn.onclick = closeDevoraLoginOverlay;
	return closeBtn;
}

function createBackButton(renderButtons: () => void): HTMLButtonElement {
	const backBtn = document.createElement('button');
	backBtn.textContent = 'Back';
	backBtn.style.cssText = `
		width: 100%; padding: 8px 16px; border-radius: 4px; background: transparent;
		border: 1px solid #3c3c3c; color: #cccccc; font-size: 13px; font-family: inherit;
		cursor: pointer; transition: background 0.2s;
	`;
	backBtn.onmouseenter = () => backBtn.style.background = 'rgba(255,255,255,0.05)';
	backBtn.onmouseleave = () => backBtn.style.background = 'transparent';
	backBtn.onclick = renderButtons;
	return backBtn;
}

function showWaiting(contentArea: HTMLElement, renderButtons: () => void): void {
	contentArea.textContent = '';
	contentArea.style.padding = '8px 0';

	const spinnerWrap = document.createElement('div');
	spinnerWrap.style.cssText = 'display: flex; justify-content: center; margin-bottom: 8px;';
	const spinner = document.createElement('div');
	spinner.style.cssText = 'width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #0e639c; border-radius: 50%;';
	spinner.animate([
		{ transform: 'rotate(0deg)' },
		{ transform: 'rotate(360deg)' }
	], { duration: 1000, iterations: Infinity });
	spinnerWrap.appendChild(spinner);

	const waitMsg = document.createElement('div');
	waitMsg.textContent = 'Waiting for authentication...';
	waitMsg.style.cssText = 'font-size: 13px; color: #cccccc; margin-bottom: 12px;';

	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = 'Cancel';
	cancelBtn.style.cssText = `
		background: transparent; border: 1px solid #3c3c3c; color: #cccccc; padding: 6px 16px;
		border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 12px; transition: background 0.2s;
	`;
	cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(255,255,255,0.05)';
	cancelBtn.onmouseleave = () => cancelBtn.style.background = 'transparent';
	cancelBtn.onclick = () => {
		if ((overlayElement as any)?.__pollInterval) {
			clearInterval((overlayElement as any).__pollInterval);
		}
		renderButtons();
	};

	contentArea.appendChild(spinnerWrap);
	contentArea.appendChild(waitMsg);
	contentArea.appendChild(cancelBtn);
}

function startPolling(sessionId: string, contentArea: HTMLElement, renderButtons: () => void): void {
	let attempts = 0;
	const pollInterval = window.setInterval(async () => {
		attempts++;
		if (attempts > 120) {
			clearInterval(pollInterval);
			showToast('Auth timeout!');
			renderButtons();
			return;
		}
		try {
			const res = await fetch(`${AUTH_SERVER}/api/auth/poll?session_id=${sessionId}`);
			if (res.ok) {
				const data = await res.json();
				if (data.token) {
					clearInterval(pollInterval);
					localStorage.setItem('devora-auth-token', data.token);

					// Fetch user info for welcome screen and cache it
					try {
						const userRes = await fetch(`${AUTH_SERVER}/api/user/me`, {
							headers: { 'Authorization': `Bearer ${data.token}` }
						});
						const userData = await userRes.json();
						saveProfileCache(userData.name || 'User', userData.email || '', userData.picture || '');
						closeDevoraLoginOverlay();
						showWelcomeOverlay(userData.name || 'User', userData.email || '');
					} catch {
						saveProfileCache('User', '', '');
						closeDevoraLoginOverlay();
						showToast('Login successful!');
					}
				}
			}
		} catch { } // Ignore fetch errors while waiting
	}, 2000);
	if (overlayElement) {
		(overlayElement as any).__pollInterval = pollInterval;
	}
}

function openExternal(url: string): void {
	const a = document.createElement('a');
	a.href = url;
	a.target = '_blank';
	a.rel = 'noopener noreferrer';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function setupOverlayListeners(overlay: HTMLElement): void {
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') { closeDevoraLoginOverlay(); }
	};
	document.addEventListener('keydown', onKey);
	(overlay as any).__onKey = onKey;

	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) { closeDevoraLoginOverlay(); }
	});
}

function animateIn(card: HTMLElement): void {
	card.style.opacity = '0';
	card.style.transform = 'scale(0.97)';
	card.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			card.style.opacity = '1';
			card.style.transform = 'scale(1)';
		});
	});
}

function closeDevoraLoginOverlay(): void {
	if (!overlayElement) { return; }

	if ((overlayElement as any).__pollInterval) {
		clearInterval((overlayElement as any).__pollInterval);
	}

	const onKey = (overlayElement as any).__onKey;
	if (onKey) { document.removeEventListener('keydown', onKey); }

	overlayElement.style.opacity = '0';
	overlayElement.style.transition = 'opacity 0.15s ease';
	setTimeout(() => {
		overlayElement?.remove();
		overlayElement = null;
	}, 150);
}

function showToast(message: string): void {
	const toast = document.createElement('div');
	toast.textContent = message;
	toast.style.cssText = `
		position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(10px);
		background: #007acc; color: white; padding: 8px 16px; border-radius: 4px; font-size: 13px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; z-index: 100000;
		opacity: 0; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
	`;
	document.body.appendChild(toast);
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			toast.style.opacity = '1';
			toast.style.transform = 'translateX(-50%) translateY(0)';
		});
	});
	setTimeout(() => {
		toast.style.opacity = '0';
		setTimeout(() => toast.remove(), 250);
	}, 3000);
}
