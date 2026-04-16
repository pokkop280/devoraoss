const WebSocket = require('ws');

// Function to find DevTools websocket target
const http = require('http');
http.get('http://127.0.0.1:9224/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const targets = JSON.parse(data);
        const target = targets.find(t => t.type === 'page');
        if (!target) {
            console.error("Target NOT FOUND!", targets.map(t=>t.title));
            process.exit(1);
        }
        
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.on('open', () => {
            ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
            ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
            
            // Wait a sec for enable events, then CLICK the account icon
            setTimeout(() => {
                ws.send(JSON.stringify({
                    id: 3,
                    method: 'Runtime.evaluate',
                    params: {
                        expression: `
                            (function() {
                                const acc = document.querySelector('.codicon-account');
                                if (!acc) return "NO ACCOUNT ICON FOUND";
                                const li = acc.closest('li.action-item');
                                if (!li) return "NO LI FOUND";
                                li.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
                                li.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, button: 0}));
                                li.click();
                                return "CLICKED ACCOUNT ICON";
                            })()
                        `
                    }
                }));
            }, 500);
            
            setTimeout(() => { process.exit(0); }, 3000);
        });

        ws.on('message', m => {
            const msg = JSON.parse(m.toString());
            if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
                console.error("CONSOLE ERROR:", JSON.stringify(msg.params.args));
            }
            if (msg.method === 'Runtime.exceptionThrown') {
                console.error("EXCEPTION:", JSON.stringify(msg.params.exceptionDetails));
            }
            if (msg.id === 3) {
                console.log("CLICK RESULT:", JSON.stringify(msg.result));
            }
        });
    });
});
