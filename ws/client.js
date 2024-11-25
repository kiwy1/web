const readline = require("node:readline");

const { ChatClient } = require("./Client/ChatClient");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Whats your encrypt key? ", val => {
    rl.question("Whats your name? ", name => {
        rl.close();
        init(name, val);
    })
})

const init = (name, key) => {
    const client = new ChatClient({ url: "ws://localhost:8080", username: name, key: key });
    
    client.init();

    const chatInput = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    chatInput.on("line", (input) => {
        if (input.trim().toLowerCase() === "exit") {
            chatInput.close();
        } else {
            client.send(input);
        }
    });
};