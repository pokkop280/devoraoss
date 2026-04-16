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
                            const acc = document.querySelector('.codicon-accounts-view-bar-icon');
                            if (!acc) return "NO ACCOUNT ICON FOUND";
                            const li = acc.closest('li.action-item');
                            if (!li) return "NO LI FOUND";
                            li.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
                            li.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, button: 0}));
                            
                            return "CLICKED! overlay? " + !!document.getElementById('devora-login-overlay');
                        })()
                    `
                }
            }));
            
            setTimeout(() => { process.exit(0); }, 1000);
        });

            // Listeners
            ws.on('message', m => {
                const msg = JSON.parse(m.toString());
                if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
                    console.error("CONSOLE ERROR:", JSON.stringify(msg.params.args));
                }
                if (msg.method === 'Runtime.exceptionThrown') {
                    console.error("EXCEPTION:", JSON.stringify(msg.params.exceptionDetails));
                }
                if (msg.id === 1) {
                    console.log("RESULT:", JSON.stringify(msg.result));
                }
            });
    });
});
