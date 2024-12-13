let ws;
let sessionId = null;
let encryptionKey;

document.getElementById('connectBtn').addEventListener('click', async () => {
    const keyStr = document.getElementById('keyInput').value.trim();
    const username = document.getElementById('nameInput').value.trim();

    if (!keyStr || !username) {
        alert('Введите имя и ключ!');
        return;
    }

    encryptionKey = await generateKeyFromString(keyStr);

    ws = new WebSocket("ws://localhost:8080");

    ws.addEventListener('open', () => {
        console.log("Connected");
        ws.send(JSON.stringify({
            type: "options",
            sessionId: null,
            data: {
                username: username
            }
        }));
    });

    ws.addEventListener('message', async (event) => {
        const parsedData = JSON.parse(event.data);
        switch (parsedData.type) {
            case "message":
                const decrypted = await decryptMessage(parsedData.data.message, encryptionKey);
                addMessage(`${parsedData.data.sender} >>: ${decrypted}`);
                break;
            case "options":
                sessionId = parsedData.sessionId;
                console.log("Your sessionId: ", sessionId);
                document.getElementById('chatWindow').style.display = 'block';
                break;
            default:
                console.log("Unknown message type", parsedData);
        }
    });

    ws.addEventListener('error', console.error);
});

document.getElementById('sendBtn').addEventListener('click', async () => {
    const msgInput = document.getElementById('messageInput');
    const text = msgInput.value.trim();
    if (!text) return;

    const encryptedData = await encryptMessage(text, encryptionKey);
    const msgObject = {
        type: "message",
        sessionId: sessionId,
        data: encryptedData
    };
    ws.send(JSON.stringify(msgObject));
    msgInput.value = '';
    addMessage(`Вы >>: ${text}`);
});

function addMessage(text) {
    const msgDiv = document.getElementById('messages');
    const p = document.createElement('p');
    p.textContent = text;
    msgDiv.appendChild(p);
    msgDiv.scrollTop = msgDiv.scrollHeight;
}

async function generateKeyFromString(str) {
    const enc = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptMessage(text, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
    );

    return {
        iv: bufferToHex(iv),
        encryptedData: bufferToHex(new Uint8Array(encrypted))
    };
}

async function decryptMessage(encryptedObject, key) {
    const iv = hexToBuffer(encryptedObject.iv);
    const encryptedData = hexToBuffer(encryptedObject.encryptedData);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
    );

    return new TextDecoder().decode(decrypted);
}

function bufferToHex(buffer) {
    return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBuffer(hexString) {
    const length = hexString.length / 2;
    const byteArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        byteArray[i] = parseInt(hexString.substr(i*2, 2), 16);
    }
    return byteArray;
}
