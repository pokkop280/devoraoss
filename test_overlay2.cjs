const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:9224/devtools/page/454CE6A461DAD4242A707E42FAC9B6C8');

ws.on('open', () => {
    ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    
    // Simulate click on accounts!
    setTimeout(() => {
        ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
                expression: 'document.querySelector(".profile-badge-content")?.closest("li.action-item")?.click()'
            }
        }));
    }, 500);
    
    setTimeout(() => { process.exit(); }, 2000);
});

ws.on('message', m => {
    const msg = JSON.parse(m.toString());
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        console.error("CONSOLE ERROR:", msg.params.args);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
        console.error("EXCEPTION:", msg.params.exceptionDetails);
    }
    if (msg.id === 3) {
        console.log("CLICK EVALUATED:", msg.result);
    }
});
