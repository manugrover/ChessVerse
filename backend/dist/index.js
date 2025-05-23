"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const Gamemanager_js_1 = require("./Gamemanager.js");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const gameManager = new Gamemanager_js_1.Gamemanager();
wss.on('connection', function connection(ws) {
    gameManager.addUser(ws);
    ws.on("disconnect", () => gameManager.removeUser(ws));
});
