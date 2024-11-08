const { ChatServer } = require("./Server/ChatServer");

const server = new ChatServer({ port: 8080 });
server.init();