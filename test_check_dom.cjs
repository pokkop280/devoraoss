const WebSocket = require('ws');
const http = require('http');

http.get('http://127.0.0.1:9224/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const targets = JSON.parse(data);
        const target = targets.find(t => t.type === 'page');
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.on('open', () => {
            ws.send(JSON.stringify({
                id: 1,
                method: 'Runtime.evaluate',
                params: {
                    expression: `
                        (function() {
                            const overlay = document.getElementById('devora-login-overlay');
                            if (overlay) return "OVERLAY EXISTS! z-index: " + getComputedStyle(overlay).zIndex + ", display: " + getComputedStyle(overlay).display + ", parent: " + overlay.parentElement.tagName;
                            return "OVERLAY DOES NOT EXIST";
                        })()
                    `
                }
            }));
            
            setTimeout(() => { process.exit(0); }, 1000);
        });

        ws.on('message', m => {
            const msg = JSON.parse(m.toString());
            if (msg.id === 1) {
                console.log("RESULT:", JSON.stringify(msg.result));
            }
        });
    });
});
