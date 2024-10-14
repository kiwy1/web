const { WebSocketServer, WebSocket } = require("ws");
const { v4: uuidv4 } = require("uuid");

const clients = new Map();

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
    let clientId = null;

    ws.on("message", function message(data) {
        const parsedData = JSON.parse(data);

        if (parsedData.type === "session_init") {
            clientId = parsedData.sessionId || uuidv4();
            clients.set(clientId, ws);
            console.log(`Client connected: ${parsedData.name}, sessionId: ${clientId}`);

            ws.send(JSON.stringify({
                type: "session_confirm",
                sessionId: clientId
            }));
        } else if (parsedData.type === "message") {
            console.log(`Received message from ${clientId}: ${parsedData.message}`);

            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "message",
                        from: parsedData.name,
                        message: parsedData.message
                    }));
                }
            });
        }
    });

    ws.on("error", console.error);
    ws.on("close", function() {
        if (clientId) {
            clients.delete(clientId);
        }
        console.log(`Client ${clientId} disconnected`);
    });
});
