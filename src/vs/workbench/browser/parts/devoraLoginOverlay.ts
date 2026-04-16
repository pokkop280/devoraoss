/*---------------------------------------------------------------------------------------------
 *  Devora Login Overlay
 *  Space-themed sign-in modal with particle animation
 *--------------------------------------------------------------------------------------------*/

let overlayElement: HTMLElement | null = null;

export function showDevoraLoginOverlay(): void {
	if (overlayElement) {
		return;
	}

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
	const closeBtn = document.createElement('button');
	// SVG created using DOM
	const svgNamespace = "http://www.w3.org/2000/svg";
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
		position: absolute;
		top: 12px;
		right: 12px;
		background: transparent;
		border: none;
		color: #858585;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 4px;
	`;
	closeBtn.onmouseenter = () => closeBtn.style.color = '#cccccc';
	closeBtn.onmouseleave = () => closeBtn.style.color = '#858585';
	closeBtn.onclick = closeDevoraLoginOverlay;

	// ── Top Icon ────────────────────────────────────────────────────────
	const iconWrap = document.createElement('div');
	iconWrap.style.cssText = 'width: 64px; height: 64px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center; position: relative;';
	
	// Beautiful Avatar SVG (Modern Profile with Glow)
	const avatarSvg = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgNjQgNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWU5MGZmIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzBlNjM5YyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9InVybCgjYSkiLz4KICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjI0IiByPSIxMCIgZmlsbD0iI2ZmZmZmZiIvPgogIDxwYXRoIGQ9Ik0zMiAzOGMtMTAgMC0xOCA1LTE4IDEwdjJoMzZ2LTJjMC01LTgtMTAtMTgtMTB6IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==';
	const logoImg = document.createElement('img');
	logoImg.src = avatarSvg;
	logoImg.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);';
	iconWrap.appendChild(logoImg);

	const title = document.createElement('h2');
	title.textContent = 'Sign in to use AI Features';
	title.style.cssText = `
		font-size: 16px;
		font-weight: 500;
		color: #cccccc;
		margin: 0 0 24px 0;
	`;

	const contentArea = document.createElement('div');
	contentArea.style.width = '100%';

	// ── Buttons ────────────────────────────────────────────────────────
	const makeBtn = (iconUri: string, text: string, isPrimary: boolean) => {
		const btn = document.createElement('button');
		const bg = isPrimary ? '#0e639c' : 'transparent';
		const border = isPrimary ? '1px solid #1177bb' : '1px solid #3c3c3c';
		const hoverBg = isPrimary ? '#1177bb' : 'rgba(255, 255, 255, 0.05)';
		
		btn.style.cssText = `
			width: 100%;
			padding: 8px 16px;
			margin-bottom: 12px;
			border-radius: 4px;
			background: ${bg};
			border: ${border};
			color: #cccccc;
			font-size: 13px;
			font-family: inherit;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			transition: background 0.2s;
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
	};

	const githubSvg = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjY2NjY2NjIj48cGF0aCBkPSJNMTIgMkM2LjQ3NyAyIDIgNi40NzcgMiAxMmMwIDQuNDIgMi44NjUgOC4xNjYgNi44MzkgOS40OS41LjA5Mi42ODItLjIxNy42ODItLjQ4MiAwLS4yMzctLjAwOC0uODY2LS4wMTMtMS43LTIuNzgyLjYwMy0zLjM2OS0xLjM0LTMuMzY5LTEuMzQtLjQ1NC0xLjE1Ni0xLjExLTEuNDY0LTEuMTEtMS40NjQtLjkwOC0uNjIuMDY5LS42MDguMDY5LS42MDggMS4wMDMuMDcgMS41MzEgMS4wMyAxLjUzMSAxLjAzLjg5MiAxLjUyOSAyLjM0MSAxLjA4NyAyLjkxLjgzMS4wOTItLjY0Ni4zNS0xLjA4Ni42MzYtMS4zMzYtMi4yMi0uMjUzLTQuNTU1LTEuMTEtNC41NTUtNC45NDMgMC0xLjA5MS4zOS0xLjk4NCAxLjAyOS0yLjY4My0uMTAzLS4yNTMtLjQ0Ni0xLjI3LjA5OC0yLjY0NyAwIDAgLjg0LS4yNjkgMi43NSAxLjAyNUE5LjU3OCA5LjU3OCAwIDAxMTIgNi44MzZjLjg1LjAwNCAxLjcwNS4xMTQgMi41MDQuMzM2IDEuOTA5LTEuMjk0IDIuNzQ3LTEuMDI1IDIuNzQ3LTEuMDI1LjU0NiAxLjM3Ny4yMDMgMi4zOTQuMSAyLjY0Ny42NC42OTkgMS4wMjggMS41OTIgMS4wMjggMi42ODMgMCAzLjg0Mi0yLjMzOSA0LjY4Ny00LjU2NiA0LjkzNS4zNTkuMzA5LjY3OC45MTkuNjc4IDEuODUyIDAgMS4zMzYtLjAxMiAyLjQxNS0uMDEyIDIuNzQzIDAgLjI2Ny4xOC41NzguNjg4LjQ4QzE5LjEzOCAyMC4xNjEgMjIgMTYuNDE4IDIyIDEyYzAtNS41MjMtNC40NzctMTAtMTAtMTB6Ii8+PC9zdmc+';
	const googleSvg = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiLz48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDLjkyIDE2LjQ2IDAgMjAuMTIgMCAyNGMwIDMuODguOTIgNy41NCAyLjU2IDEwLjc4bDcuOTctNi4xOXoiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ii8+PC9zdmc+';
	const emailSvg = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2NjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA0aDE2YzEuMSAwIDIgLjkgMiAydjEyYzAgMS4xLS45IDItMiAySDRjLTEuMSAwLTItLjktMi0yVjZjMC0xLjEuOS0yIDItMnoiLz48cG9seWxpbmUgcG9pbnRzPSIyMiw2IDEyLDEzIDIsNiIvPjwvc3ZnPg==';

	const githubBtn = makeBtn(githubSvg, 'Continue with GitHub', true);
	const googleBtn = makeBtn(googleSvg, 'Continue with Google', false);
	const emailBtn = makeBtn(emailSvg, 'Continue with Email', false);

	// ── Waiting screen ─────────────────────────────────────────────────
	const showWaiting = (providerName: string) => {
		contentArea.textContent = '';
		contentArea.style.padding = '24px 0';

		const spinnerWrap = document.createElement('div');
		spinnerWrap.style.cssText = 'display: flex; justify-content: center; margin-bottom: 16px;';
		
		const spinner = document.createElement('div');
		spinner.style.cssText = 'width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #0e639c; border-radius: 50%;';
		spinner.animate([
			{ transform: 'rotate(0deg)' },
			{ transform: 'rotate(360deg)' }
		], { duration: 1000, iterations: Infinity });
		
		spinnerWrap.appendChild(spinner);

		const waitMsg = document.createElement('div');
		waitMsg.textContent = 'Waiting for authentication...';
		waitMsg.style.cssText = 'font-size: 13px; color: #cccccc; margin-bottom: 24px;';

		const cancelBtn = document.createElement('button');
		cancelBtn.textContent = 'Cancel';
		cancelBtn.style.cssText = `
			background: transparent; border: 1px solid #3c3c3c; color: #cccccc; padding: 6px 16px; 
			border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 12px; transition: background 0.2s;
		`;
		cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(255,255,255,0.05)';
		cancelBtn.onmouseleave = () => cancelBtn.style.background = 'transparent';
		cancelBtn.onclick = () => {
			if ((overlayElement as any).__pollInterval) {
				clearInterval((overlayElement as any).__pollInterval);
			}
			renderButtons();
		};

		contentArea.appendChild(spinnerWrap);
		contentArea.appendChild(waitMsg);
		contentArea.appendChild(cancelBtn);
	};

	const startPolling = (sessionId: string) => {
		let attempts = 0;
		const pollInterval = window.setInterval(async () => {
			attempts++;
			if (attempts > 120) { // 4 minutes timeout
				clearInterval(pollInterval);
				showToast('Auth timeout!');
				renderButtons();
				return;
			}
			try {
				const res = await fetch(`http://localhost:8082/api/auth/poll?session_id=${sessionId}`);
				if (res.ok) {
					const data = await res.json();
					if (data.token) {
						clearInterval(pollInterval);
						localStorage.setItem('devora-auth-token', data.token);
						showToast('Auth Success!');
						setTimeout(() => { closeDevoraLoginOverlay(); }, 500);
					}
				}
			} catch(e) { } // Ignore fetch errors while waiting
		}, 2000);
		(overlayElement as any).__pollInterval = pollInterval;
	};

	googleBtn.onclick = () => {
		showWaiting('Google');
		const sessionId = Math.random().toString(36).substring(2, 15);
		const url = `http://localhost:8082/auth/google/login?session_id=${sessionId}`;
		
		const a = document.createElement('a');
		a.href = url;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		startPolling(sessionId);
	};

	githubBtn.onclick = () => {
		showToast('GitHub Login is in development 🛠️');
	};

	emailBtn.onclick = () => {
		showToast('Email Login is in development 🛠️');
	};

	const renderButtons = () => {
		contentArea.textContent = '';
		contentArea.style.padding = '0';
		contentArea.appendChild(githubBtn);
		contentArea.appendChild(googleBtn);
		contentArea.appendChild(emailBtn);
	};

	renderButtons();

	// ── Footer text ────────────────────────────────────────────────────
	const footer = document.createElement('p');
	footer.style.cssText = `
		font-size: 12px;
		color: #858585;
		margin: 24px 0 0 0;
		line-height: 1.5;
	`;
	const p1 = document.createElement('div');
	p1.textContent = "By continuing, you agree to Devora's Terms and Privacy Statement.";
	
	const p2 = document.createElement('div');
	p2.textContent = "Devora may use your data to improve the product.";
	p2.style.marginTop = '4px';
	
	footer.appendChild(p1);
	footer.appendChild(p2);


	// ── Assemble card ────────────────────────────────────────────────────
	card.appendChild(closeBtn);
	card.appendChild(iconWrap);
	card.appendChild(title);
	card.appendChild(contentArea);
	card.appendChild(footer);

	overlay.appendChild(card);
	document.body.appendChild(overlay);
	overlayElement = overlay;

	// ── Escape key closes ────────────────────────────────────────────────
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') { closeDevoraLoginOverlay(); }
	};
	document.addEventListener('keydown', onKey);
	(overlay as any).__onKey = onKey;

	// ── Click outside card closes ─────────────────────────────────────────
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) { closeDevoraLoginOverlay(); }
	});

	// ── Animate card in ───────────────────────────────────────────────────
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
		position: fixed;
		bottom: 32px;
		left: 50%;
		transform: translateX(-50%) translateY(10px);
		background: #007acc;
		color: white;
		padding: 8px 16px;
		border-radius: 4px;
		font-size: 13px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		z-index: 100000;
		opacity: 0;
		transition: opacity 0.2s, transform 0.2s;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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

