import React from 'react'
import Chessboard from '../components/Chessboard'
import { useSocket } from '../hooks/useSocket';
import { useEffect, useState } from 'react';
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
import { Chess } from 'chess.js';
import Button from '../components/Button';

const Game = () => {
    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());

    useEffect(() => {
        if(!socket){
            return;
        }
        console.log("inside useEffect");
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);
            console.log(`message is ${message}`)
            switch (message.type){
                case INIT_GAME :
                    setBoard(chess.board());
                    console.log("Game inittialized")
                    break;
                case MOVE:
                    const move = message.move;
                    console.log("move is ");
                    console.log(move);
                    chess.move(move);
                    setBoard(chess.board());
                    console.log("Move made");
                    break;
                case GAME_OVER:
                    console.log("Game over");
                    break;
            }
        }
    }, [socket])

    if(!socket) return <div>Connecting....</div>
    return (
        <div className="justify-center flex">
            <div className='pt-8 max-w-screen-lg w-full'>
                <div className='grid grid-cols-6 gap-4 w-full'>
                    <div className="col-span-4 bg-red-200 w-full">
                        <Chessboard setBoard={setBoard} chess = {chess} board = {board} socket = {socket}/>
                    </div>
                    <div className="col-span-2 bg-green-200 w-full">
                        <Button
                            onClick={() => 
                                socket.send(JSON.stringify({
                                    type: INIT_GAME
                                }))
                            }
                        >
                            Play online
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Game