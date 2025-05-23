import { WebSocket } from "ws";
import { INIT_GAME, MOVE } from "./message";
import { Game } from "./Games";

export class Gamemanager{
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocket[];
    constructor(){
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }

    addUser(socket: WebSocket){
        this.users.push(socket);
        this.addHandler(socket);
        
    }

    removeUser(socket: WebSocket){
        this.users = this.users.filter( user => user!==socket);
        // stop the game here because the user left
    }

    private addHandler(socket: WebSocket){
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());

            console.log("message is ");
            console.log(message);
            if(message.type === INIT_GAME){
                console.log("game init called");
                if(this.pendingUser){
                    const game = new Game(this.pendingUser, socket);

                    this.games.push(game);
                    this.pendingUser = null;
                }
                else{
                    this.pendingUser = socket;
                }
            }
            if(message.type ===  MOVE){

                console.log("inside move");
                const game = this.games.find(game => game.player1 === socket || game.player2 === socket);

                if(game){
                    console.log("move request sent");
                    game.makeMove(socket, message.move);
                }
            }
        })
    }
}