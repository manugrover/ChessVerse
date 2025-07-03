import { WebSocketServer } from "ws";
import { GameManager} from "./Gamemanager";
import { User } from "./SocketManager";

const wss = new WebSocketServer({port: 8081});

const gameManager = new GameManager();
const users = ['1', '2'];
let count = 0; 
wss.on('connection', function connection(ws, req) {

    const user = new User(ws, users[count]);
    count = 1 - count;
    gameManager.addUser(user);

    ws.on('close', () => {
        gameManager.removeUser(ws);
    })
})