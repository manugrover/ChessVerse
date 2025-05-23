import { WebSocket } from "ws"
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./message";
export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: Chess;
    private startTime: Date;
    private moveCount = 0;

    constructor(player1: WebSocket, player2: WebSocket){
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess();
        this.startTime = new Date();
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "white"
            }
        }));

        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "black"
            }
        }));
    }

    makeMove(socket: WebSocket, move: {
        from: string,
        to: string
    }){
        console.log(this.moveCount);
        if(this.moveCount%2 === 0 && socket !== this.player1){
            return;
        }
        if(this.moveCount%2 === 1 && socket !== this.player2){
            return;
        }

        console.log("did not early return");
        try {
            this.board.move(move)
            this.moveCount++;
        }catch(e){
            console.log(e);
            return;
        }

        console.log("move succeeded");
        if(this.board.isGameOver()){
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload:{
                    winner: this.board.turn() === 'w' ? "black" : "white"
                }
            }))
            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload:{
                    winner: this.board.turn() === 'w' ? "black" : "white"
                }
            }))
            return;
        }

        console.log(this.moveCount)
        if(this.moveCount%2 == 1){
            console.log("sent2");
            this.player2.send(JSON.stringify({
                type: MOVE,
                move: move
            }))
        }
        else{
            console.log("sent1");
            this.player1.send(JSON.stringify({
                type: MOVE,
                move: move
            }))
        }
      
    }
}