const express = require('express');
const path = require('path');
const { ChatServer } = require("./Server/ChatServer");

const app = express();
const port = 3000;
const wsPort = 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Web server started on http://localhost:${port}`);
});

const server = new ChatServer({ port: wsPort });
server.init();
