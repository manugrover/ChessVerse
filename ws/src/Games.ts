// import { WebSocket } from "ws"
// import { Chess } from "chess.js";
// import { GAME_OVER, INIT_GAME, MOVE } from "./message";
// import {randomUUID} from 'crypto';

// export class Game {
//     public gameId: string;
//     public player1UserId: string;
//     public player2UserId: string | null;
//     public board: Chess;
//     private moveCount = 0;
//     private timer: NodeJS.Timeout | null = null;
//     private moveTimer: NodeJS.Timeout | null = null;
//     public result: GAME_RESULT | null = null;
//     private player1TimeConsumed = 0;
//     private player2TimeConsumed = 0;
//     private startTime = new Date(Date.now());
//     private lastMoveTime = new Date(Date.now());

//     constructor(player1UserId: string, player2UserId: string|null, gameId?: string, startTime?: Date){
//         this.player1UserId = player1UserId;
//         this.player2UserId = player2UserId;
//         this.board = new Chess();
//         this.gameId = gameId ?? randomUUID();
//         if(startTime){
//             this.startTime = startTime;
//             this.lastMoveTime = startTime;
//         }

//     }

//     seedMoves( moves: {
//         id: string;
//         gameId: string;
//         moveNumber: number;
//         from: string;
//         to: string;
//         comments: string | null;
//         timeTaken: number | null;
//         createdAt: Date;
//     }[]){
//         console.log(moves);
//         moves.forEach((move) => {
            
//         })
//     }
//     makeMove(socket: WebSocket, move: {
//         from: string,
//         to: string
//     }){
//         console.log(this.moveCount);
//         if(this.moveCount%2 === 0 && socket !== this.player1){
//             return;
//         }
//         if(this.moveCount%2 === 1 && socket !== this.player2){
//             return;
//         }

//         console.log("did not early return");
//         try {
//             this.board.move(move)
//             this.moveCount++;
//         }catch(e){
//             console.log(e);
//             return;
//         }

//         console.log("move succeeded");
//         if(this.board.isGameOver()){
//             this.player1.send(JSON.stringify({
//                 type: GAME_OVER,
//                 payload:{
//                     winner: this.board.turn() === 'w' ? "black" : "white"
//                 }
//             }))
//             this.player2.send(JSON.stringify({
//                 type: GAME_OVER,
//                 payload:{
//                     winner: this.board.turn() === 'w' ? "black" : "white"
//                 }
//             }))
//             return;
//         }

//         console.log(this.moveCount)
//         if(this.moveCount%2 == 1){
//             console.log("sent2");
//             this.player2.send(JSON.stringify({
//                 type: MOVE,
//                 move: move
//             }))
//         }
//         else{
//             console.log("sent1");
//             this.player1.send(JSON.stringify({
//                 type: MOVE,
//                 move: move
//             }))
//         }
//     }
// }

import {Chess, Move, Square} from 'chess.js';
import { WebSocket } from "ws"
import {User, socketManager} from './SocketManager'
import { randomUUID } from 'crypto';
import db  from  './db';
import { 
    GAME_ENDED,
    INIT_GAME,
    INVALID_MOVE,
    MOVE,
} from './messages';
type GAME_STATUS = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'PLAYER_EXIT';
type GAME_RESULT = "WHITE_WINS" | "BLACK_WINS" | 'DRAW';

export class Game {
    public gameId: string;
    public player1UserId: string;
    public player2UserId: string | null;
    public board: Chess;
    public result: GAME_RESULT | null = null;
    public moveNumber = 0;

    constructor(player1UserId: string, player2UserId: string|null){
        this.player1UserId = player1UserId;
        this.player2UserId = player2UserId;
        this.gameId = randomUUID();
        this.board = new Chess();
    }

    async updateSecondPlayer(player2UserId: string){
        this.player2UserId = player2UserId;
        console.log("in update second Player");

        console.log(`player 2 user id is ${player2UserId}`);

        const users = await db.user.findMany({
            where: {
                id: {
                    in: [this.player1UserId, this.player2UserId ?? ''],
                },
            },
        });

        console.log(`users are ${users}`);

        try {
            await this.createGameInDb();
        }
        catch(e){
            console.error(e);
            return;
        }

        console.log('game created in db');

        const WhitePlayer = users.find((user) => user.id === this.player1UserId);
        const BlackPlayer = users.find((user) => user.id === this.player2UserId);

        socketManager.broadcast(
            this.gameId,
            JSON.stringify({
                type: INIT_GAME,
                payload: {
                    gameId: this.gameId,
                    WhitePlayer:{
                        id: this.player1UserId,
                    },
                    BlackPlayer:{
                        id: this.player2UserId,
                    },
                    fen: this.board.fen(),
                },
            }),
        );
    }

    async createGameInDb(){
        const game = await db.game.create({
            data: {
                id: this.gameId,
                status: 'IN_PROGRESS',
                currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                whitePlayer: {
                    connect: {
                        id: this.player1UserId,
                    },
                },
                blackPlayer: {
                    connect: {
                        id: this.player2UserId ?? '',
                    },
                }
            },
            include: {
                whitePlayer: true,
                blackPlayer: true,
            },
        });
        this.gameId = game.id;
    }
    async addMoveToDb(move: Move){
        await db.$transaction([
            db.move.create({
                data: {
                    gameId: this.gameId,
                    moveNumber: this.moveNumber + 1,
                    from: move.from,
                    to: move.to
                }
            }),

            db.game.update({
                data: {
                    currentFen: move.after,
                },
                where: {
                    id: this.gameId,
                }
            })
        ])
    }
    async makeMove(
        user: User,
        move: Move
    ) {
        if (this.board.turn() === 'w' && user.userId !== this.player1UserId) {
            user.socket.send(JSON.stringify({
                type: INVALID_MOVE,
                payload:{
                    error: "Not Your Turn",
                }
            }))
            return;
        }

        if (this.board.turn() === 'b' && user.userId !== this.player2UserId) {
            user.socket.send(JSON.stringify({
                type: INVALID_MOVE,
                payload:{
                    error: "Not Your Turn",
                }
            }))
            return;
        }

        if(this.result){
            console.error('User is make a move post game completion');
            return;
        }
        try {
            this.board.move({
                from: move.from,
                to: move.to
            });
        }
        catch(e){
            user.socket.send(JSON.stringify({
                type: INVALID_MOVE,
                payload: {
                    error:e,
                }
            }))
            console.error(`Error while making move ${e}`);
            return;
        }

        await this.addMoveToDb(move);

        console.log("Move added to db");
        socketManager.broadcast(
            this.gameId, 
            JSON.stringify({
                type: MOVE,
                payload: {
                    move
                }
            })
        )

        if(this.board.isGameOver()){
            const result = this.board.isDraw() ? "DRAW" : (this.board.turn() === 'b' ? "WHITE_WINS" : "BLACK_WINS");
            this.endGame("COMPLETED", result);
        }
        
        this.moveNumber++;
    }

    async endGame(status: GAME_STATUS, result: GAME_RESULT){
        const updatedGame = await db.game.update({
            data: {
                status, 
                result,
            },
            where: {
                id: this.gameId,
            },
            include: {
                moves: {
                    orderBy:{
                        moveNumber: 'asc',
                    },
                },
                blackPlayer: true,
                whitePlayer: true,
            }
        });

        socketManager.broadcast(
            this.gameId,
            JSON.stringify({
                type: GAME_ENDED,
                payload: {
                    result,
                    status,
                    moves: updatedGame.moves,
                    blackPlayer: {
                        id: updatedGame.blackPlayer.id,
                    },
                    whitePlayer: {
                        id: updatedGame.whitePlayer.id,
                    }
                },
            }),
        );
    }

    async exitGame(user : User) {
        this.endGame('PLAYER_EXIT', user.userId === this.player2UserId ? 'WHITE_WINS' : 'BLACK_WINS');
    }
}
