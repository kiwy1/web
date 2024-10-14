const { WebSocket } = require("ws");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const wsClientFactory = (sessionId = null, name) => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.on("open", function open() {
        console.log(`Connected to server as ${name}`);

        ws.send(JSON.stringify({
            type: "session_init",
            sessionId: sessionId,
            name: name
        }));

        rl.on("line", (input) => {
            ws.send(JSON.stringify({
                type: "message",
                name: name,
                message: input
            }));
        });
    });

    ws.on("message", function message(data) {
        const parsedData = JSON.parse(data);
        if (parsedData.type === "session_confirm") {
            console.log(`Session confirmed. Your session ID: ${parsedData.sessionId}`);
        } else if (parsedData.type === "message") {
            console.log(`${parsedData.from} says: ${parsedData.message}`);
        }
    });

    ws.on("error", console.error);
    ws.on("close", () => {
        console.log(`Disconnected from server`);
    });
}

const sessionId = null;
const name = "User";
wsClientFactory(sessionId, name);
