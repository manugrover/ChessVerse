// import { WebSocket } from "ws";
// import { INIT_GAME, MOVE } from "./message";
// import { Game } from "./Games";

// export class Gamemanager{
//     private games: Game[];
//     private pendingGameId: WebSocket | null;
//     private users: User[];

//     constructor(){
//         this.games = [];
//         this.pendingGameId= null;
//         this.users = [];
//     }

//     addUser(socket: WebSocket){
//         this.users.push(user);
//         this.addHandler(socket);    
//     }

//     removeUser(user: User){
//         const user = this.users.find((user) => user.socket === socket);
//         if(!user){
//             console.log("User not found");
//             return;
//         }
//         this.users = this.users.filter ((user) => user.socket !== socket);

//         socketManager.removeUser(user);
//     }

//     removeGame(gameId: string){
//         this.games = this.games.filter((g) => g.gameId !== gameId)
//     }

//     private addHandler(socket: WebSocket){
//         user.on("message", async (data) => {
//             const message = await JSON.parse(data.toString());

//             console.log(`message is ${message}`);
//             if(message.type === INIT_GAME){
//                 const game = this.games.find((g) => g.gameId == this.pendingGameId);

//                 if(!game){
//                     console.log("Pending game not found !!");
//                     return;
//                 }

//                 if(this.userId === game.player1UserId){

//                 }
//                 else{
//                     const game = new Game(this.users.userId, null);
//                     this.games.push(game);
//                     this.pendingGameId = game.gameId;
                    
//                 }
//             }
//             if(message.type ===  MOVE){
//                 const gameId = message.payload.gameId;
//                 const game = this.games.find((game) => game.gameId === gameId);

//                 if(game){
//                     game.makeMove(this.users, message.payload.move);
//                     if(game.result){
//                         this.removeGame(game.gameId)
//                     }
//                 }
//             }

//             if(message.type == EXIT_GAME){
//                 const gameId = message.payload.gameId;
//                 const game = this.games.find((game) => game.gameId === gameId);

//                 if (game) {
//                 game.exitGame(user);
//                 this.removeGame(game.gameId)
//                 }
//             }

            
//         })
//     }
// }

import {WebSocket} from 'ws';
import {Game} from './Games';
import db from './db';
import { Square } from 'chess.js';
import {GameStatus} from '@prisma/client'
import { User, socketManager } from './SocketManager';
import { SocketAddress } from 'net';
import { ChatManager } from './ChatManager';
import {
    ANSWER, 
    OFFER,
    GAME_OVER,
    INIT_GAME,
    JOIN_GAME,
    MOVE,
    OPPONENT_DISCONNECTED,
    JOIN_ROOM,
    GAME_JOINED,
    GAME_NOT_FOUND,
    GAME_ALERT,
    GAME_ADDED,
    GAME_ENDED,
    EXIT_GAME,
    CHAT_MESSAGE,
    VOICE_CALL_OFFER,
    VOICE_CALL_ANSWER,
    VOICE_CALL_END,
    VIDEO_CALL_OFFER,
    VIDEO_CALL_ANSWER,
    VIDEO_CALL_END,
    ICE_CANDIDATE,
    CALL_DECLINED,
    CALL_ACCEPTED
} from './messages';
import { getUniqPayload } from 'recharts/types/util/payload/getUniqPayload';

export class GameManager {
    private games: Game[];
    private pendingGameId: string | null;
    private pendingUser: User | null = null;
    private users: User[];
    private chatManager: ChatManager;

    constructor(){
        this.games = [];
        this.pendingGameId = null;
        this.users = [];
        this.chatManager = new ChatManager();
    }

    addUser(user: User){
        console.log(`user pushed is userId is ${user.userId}`);
        this.users.push(user);
        this.addHandler(user);
        
    }

    removeGame(gameId: string){
        this.games = this.games.filter((g) => g.gameId !== gameId);
    }

    removeUser(socket: WebSocket){
        const user = this.users.find((user) => user.socket === socket);
        if(!user){
            console.error('User not Found ? ');
            return;
        }
        
        // Cleanup user's active calls
        this.chatManager.cleanupUserCalls(user.userId);
        
        this.users = this.users.filter((user) => user.socket !== socket);
        socketManager.removeUser(user);
    }

    private addHandler(user: User){
        user.socket.on('message', async (data) => {
            
            const message = JSON.parse(data.toString());

            console.log('Received message inside addHandler: ', message);
            if(message.type === INIT_GAME){
                if(this.pendingGameId){
                    const game = this.games.find((x) => x.gameId === this.pendingGameId);

                    if(!game){
                        console.error('Pending game not found');
                        return;
                    }
                    
                    console.log(`pending Game id is ${game.gameId}`);
                    if(user.userId === game.player1UserId){
                        socketManager.broadcast(
                            game.gameId,
                            JSON.stringify({
                                type: GAME_ALERT,
                                payload: {
                                    message: 'Trying to Connect with youself?',
                                }
                            })
                        );
                        return;
                    }
                    
                    socketManager.addUser(game.gameId, this.pendingUser, user);
                    await game?.updateSecondPlayer(user.userId);
                    this.pendingGameId = null;

                    console.log("initited successfully");
                }
                else{
                    const game = new Game(user.userId, null);
                    this.games.push(game);
                    this.pendingGameId = game.gameId;
                    this.pendingUser = user;

                    console.log(`game id created is ${game.gameId}`);
                    
                    socketManager.broadcast(
                        game.gameId,
                        JSON.stringify({
                            type: GAME_ADDED,
                            payload:{
                                gameId: game.gameId,
                                color: 'w',
                            }
                        }),
                    );

                    console.log("completed");
                }
            }

            if(message.type === MOVE){
                const gameId = message.payload.gameId;
                const game = this.games.find((game) => game.gameId === gameId);

                if(game){
                    game.makeMove(user, message.payload.move);
                    if(game.result){
                        this.removeGame(game.gameId);
                    }
                }
            }

            if(message.type === EXIT_GAME){
                const gameId = message.payload.gameId;
                const game = this.games.find((game) => game.gameId === gameId);

                if(game){
                    game.exitGame(user);
                    this.removeGame(game.gameId);
                }
            }

            if(message.type === CHAT_MESSAGE){
                await this.chatManager.handleChatMessage(user, message.payload);
            }
            if(message.type === OFFER || message.type === ANSWER){
                const gameId = message.payload.gameId;
                const game = this.games.find((game) => game.gameId === gameId);
                socketManager.sendToOpponent(game?.gameId ?? 'empty', user.socket, JSON.stringify(message));
            }
        })
    }
}

