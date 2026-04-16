const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:9224/devtools/page/454CE6A461DAD4242A707E42FAC9B6C8');

ws.on('open', () => {
    ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
            expression: 'import("./out/vs/workbench/browser/parts/devoraLoginOverlay.js").then(m => window.__m = m); "imported"'
        }
    }));
});

ws.on('message', m => {
    const data = JSON.parse(m.toString());
    console.log(data);
    
    if(data.id === 1) {
        setTimeout(() => {
            ws.send(JSON.stringify({
                id: 2,
                method: 'Runtime.evaluate',
                params: {
                    expression: 'try { window.__m.showDevoraLoginOverlay(); "success" } catch(e) { e.message + " " + e.stack }'
                }
            }));
        }, 100);
    }
    
    if(data.id === 2) {
        process.exit();
    }
});
