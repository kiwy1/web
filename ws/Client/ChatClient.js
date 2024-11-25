const crypto = require('crypto');
const { WebSocket } = require("ws");

function encrypt(text, key) {
    if (key.length !== 32) {
        key = crypto.createHash('sha256').update(key).digest();
    }

    const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16, 0));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

function decrypt(encryptedText, key) {
    if (key.length !== 32) {
        key = crypto.createHash('sha256').update(key).digest();
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.alloc(16, 0));
    let decrypted = decipher.update(Buffer.from(encryptedText, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

class ChatClient {
    constructor(options) {
        this.ws = new WebSocket(options.url);
        this.sessionId = options.sessionId || null;
        this.username = options.username;
        this.encryptionKey = options.key;
    }

    init() {
        this.ws.on("open", () => this.onOpen());
        this.ws.on("message", (data) => this.onMessage(data));
        this.ws.on("error", console.error);
    }

    onOpen() {
        console.log("Connected");
        this.ws.send(JSON.stringify({
            type: "options",
            sessionId: this.sessionId,
            data: {
                username: this.username
            }
        }));
    }

    onMessage(data) {
        const parsedData = JSON.parse(data.toString());

        switch (parsedData.type) {
            case "message":
                const { message, sender } = parsedData.data;
                const decryptedMessage = decrypt(message.message, this.encryptionKey);
                console.log(sender + " >>: " + decryptedMessage);
                break;
            case "options":
                this.setOptions(parsedData);
                break;
            default:
                console.log("Unknown message type");
        }
    }

    setOptions(msgObject) {
        this.sessionId = msgObject.sessionId;
        console.log("Your sessionId: ", this.sessionId);
    }

    send(data) {
        const encryptedData = encrypt(data, this.encryptionKey);
        const msgObject = {
            type: "message",
            sessionId: this.sessionId,
            data: {
                message: encryptedData,
                sender: this.username
            }
        };

        this.ws.send(JSON.stringify(msgObject));
    }
}

module.exports = { ChatClient };