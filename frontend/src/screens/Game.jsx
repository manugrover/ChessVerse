// import React from 'react'
// import Chessboard from '../components/Chessboard'
// import { useSocket } from '../hooks/useSocket';
// import { useEffect, useState } from 'react';
// export const INIT_GAME = "init_game";
// export const MOVE = "move";
// export const GAME_OVER = "game_over";
// import { Chess } from 'chess.js';
// import Button from '../components/Button';

// const Game = () => {
//     const socket = useSocket();
//     const [chess, setChess] = useState(new Chess());
//     const [board, setBoard] = useState(chess.board());

//     useEffect(() => {
//         if(!socket){
//             return;
//         }
//         console.log("inside useEffect");
//         socket.onmessage = (event) => {
//             const message = JSON.parse(event.data);
//             console.log(message);
//             console.log(`message is ${message}`)
//             switch (message.type){
//                 case INIT_GAME :
//                     setBoard(chess.board());
//                     console.log("Game inittialized")
//                     break;
//                 case MOVE:
//                     const move = message.move;
//                     console.log("move is ");
//                     console.log(move);
//                     chess.move(move);
//                     setBoard(chess.board());
//                     console.log("Move made");
//                     break;
//                 case GAME_OVER:
//                     console.log("Game over");
//                     break;
//             }
//         }
//     }, [socket])

//     if(!socket) return <div>Connecting....</div>
//     return (
//         <div className="justify-center flex">
//             <div className='pt-8 max-w-screen-lg w-full'>
//                 <div className='grid grid-cols-6 gap-4 w-full'>
//                     <div className="col-span-4 bg-red-200 w-full">
//                         <Chessboard setBoard={setBoard} chess = {chess} board = {board} socket = {socket}/>
//                     </div>
//                     <div className="col-span-2 bg-green-200 w-full">
//                         <Button
//                             onClick={() => 
//                                 socket.send(JSON.stringify({
//                                     type: INIT_GAME
//                                 }))
//                             }
//                         >
//                             Play online
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default Game

import Bw from '../assets/Bw.png';
import Rw from '../assets/Rw.png';
import Nw from '../assets/Nw.png';
import Kw from '../assets/Kw.png';
import Qw from '../assets/Qw.png';
import Pw from '../assets/Pw.png';
import bb from '../assets/bb.png';
import rb from '../assets/rb.png';
import nb from '../assets/nb.png';
import kb from '../assets/kb.png';
import qb from '../assets/qb.png';
import pb from '../assets/pb.png';

import Chessboard from '../components/Chessboard';
import styles from '../styles/Game.module.css';
import React, {useState, useEffect} from 'react';

import PlayerInfo from '../components/PlayerInfo';
import MovesTable from '../components/MovesTable';
import GameChat from '../components/GameChat';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import {MOVE, INIT_GAME, GAME_OVER, GAME_ADDED, INVALID_MOVE, CHAT_MESSAGE} from '../messages'

const WS_URL = "ws://localhost:8080"; 
import { useLocation } from 'react-router-dom';
import {useSocket} from '../hooks/useSocket'

const files = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

// Map piece types to their corresponding image imports
const pieceImages = {
    'bw': Bw,
    'rw': Rw,
    'nw': Nw,
    'kw': Kw,
    'qw': Qw,
    'pw': Pw,
    'bb': bb,
    'rb': rb,
    'nb': nb,
    'kb': kb,
    'qb': qb,
    'pb': pb
};

let currentPlayer = "";
const ChessPage = () => {
    const [chess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [from, setFrom] = useState(null);
    const [added, setAdded] = useState(false);
    const [started, setStarted] = useState(false);
    const [result, setResult] = useState(null);
    const [gameId, setGameId] = useState("");
    const [prevColor, setPrevColor] = useState("");

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const socket = useSocket();

    useEffect(() => {
      if(!socket){
          return;
      }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);
            console.log(`message recieved at frontend is ${message.type} ${message.payload}`);
            // console.log(``)
            switch (message.type){
                case GAME_ADDED:
                    setAdded(true);
                    setGameId(message.payload.gameId);
                    currentPlayer = "b";
                    console.log(`current player set - ${currentPlayer}`);
                    break;

                case INIT_GAME :
                    setBoard(chess.board());
                    setStarted(true);
                    setGameId(message.payload.gameId);
                    if(currentPlayer === ""){
                        currentPlayer = "w";
                        console.log(`current player set - ${currentPlayer}`);
                    }
                    console.log("Game inittialized")
                    break;

                case MOVE:
                    console.log(`move by ${currentPlayer}`);

                    const move = message.payload.move;
                    console.log("move is ");
                    console.log(move);
                    chess.move(move);
                    setBoard(chess.board());
                    console.log("Move made");
                    break;

                case GAME_OVER:
                    console.log("Game over");
                    break;
                case INVALID_MOVE:
                    alert(message.payload.error);
                    break;
                
                case CHAT_MESSAGE: 
                    setMessages(prev => [
                        ...prev,
                        {
                            text: message.payload.messageText,
                            timestamp: message.payload.timestamp,
                            isOwn: (message.payload.whoSent === currentPlayer?true:false),
                        }
                    ]);
                    break;
                default:
                    alert(message.payload.message);
                    break;
            }
      }
  }, [socket])

  
  const makeMove = async (cellPosition) => {
      console.log(`${from} - ${cellPosition}`);
      if(from==null) {
        console.log("from is null");
      }
      try {
          socket.send( JSON.stringify({
              type: MOVE,
              payload: {
                gameId,
                move:{
                    from,
                    to: cellPosition
                },
              }
          }));
      } catch (e) {
          console.error('Invalid move', e);
      }
      setFrom(null);
      setSelectedSquare(null);
      setPrevColor("");
  };



  const playerData = {
    opponent: {
      username: 'RandomPlayer123',
      rating: 1250,
      status: 'Playing',
      timeLeft: '09:45'
    },
    user: {
      username: 'GoogleUser',
      rating: 1200,
      status: 'seen turn',
      timeLeft: '10:00'
    }
  };

  const handleSquareClick = async (rowIndex, colIndex, type, color) => {
    let flag = type!==null;
    let cellPosition = String.fromCharCode(97+colIndex)+(8 - rowIndex);
    console.log(`rowIndex is ${8 - rowIndex} and colIndex is ${String.fromCharCode(97+colIndex)}`);
    if(type){ //if piyanda on cell
        if(selectedSquare){ // previous something selected
            if(selectedSquare.row == rowIndex && selectedSquare.col == colIndex){ //same cell as previous cell
                setFrom(null);
                setSelectedSquare(null);
                setPrevColor("");
            }
            else{
                if(color!==prevColor){
                  await makeMove(cellPosition);
                }
                else{
                  setSelectedSquare({ row: rowIndex, col: colIndex });
                  setFrom(cellPosition);
                  setPrevColor(color);
                }
            }
        }
        else{
            setPrevColor(color);
            setSelectedSquare({ row: rowIndex, col: colIndex });
            setFrom(cellPosition);
        }
    }
    // no piyada now 
    else if (selectedSquare) { // previous selected has piyada
        
        await makeMove(cellPosition);
    }
    else if(selectedSquare){ // // previous selected has no piyada
        
    }
  };
  const moves = [
    { number: 1, whiteFrom: 'd7', whiteTo: 'f6', blackFrom: '', blackTo: '' },
    { number: 2, whiteFrom: 'e7', whiteTo: 'd6', blackFrom: '', blackTo: '' },
    { number: 3, whiteFrom: 'd7', whiteTo: 'd3', blackFrom: '', blackTo: '' },
    { number: 4, whiteFrom: 'e3', whiteTo: 'e3', blackFrom: '', blackTo: '' },
    { number: 5, whiteFrom: 'd7', whiteTo: 'f6', blackFrom: '', blackTo: '' },
    { number: 6, whiteFrom: 'e7', whiteTo: 'd6', blackFrom: '', blackTo: '' },
    { number: 7, whiteFrom: 'd7', whiteTo: 'd3', blackFrom: '', blackTo: '' },
    { number: 8, whiteFrom: 'e3', whiteTo: 'e3', blackFrom: '', blackTo: '' },
    { number: 9, whiteFrom: 'd7', whiteTo: 'f6', blackFrom: '', blackTo: '' },
    { number: 10, whiteFrom: 'e7', whiteTo: 'd6', blackFrom: '', blackTo: '' },
    { number: 11, whiteFrom: 'd7', whiteTo: 'f6', blackFrom: '', blackTo: '' },
    { number: 12, whiteFrom: 'e7', whiteTo: 'd6', blackFrom: '', blackTo: '' },
  ];

  const chatMessages = [
    { sender: 'Opponent', message: 'Good luck and have fun!', time: '04:52 PM' }
  ];


  // if(!started){
  //   return <div>........conneccting </div>
  // }
  return (
    <div className={styles.chessPage}>
      <div className={styles.left}>
        <MovesTable moves={moves}/>
        <PlayerInfo player={playerData.opponent} isOpponent={true} />
        <PlayerInfo player={playerData.user} isOpponent={false} />
      </div>

      <div className = {styles.middle}>
        <div className={styles.container}>
            <div className={styles.boardwithlabels}>
                <div className={styles.top}>
                    <div className={styles.rankLabels}>
                        {ranks.map(rank => (
                        <div key={rank} className={styles.rankLabel}>{rank}</div>
                        ))}
                    </div>
                    <div className={styles.board}>
                        {board.map((row, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                                {row.map((square, colIndex) => {
                                    const isSelected = selectedSquare && 
                                                    selectedSquare.row === rowIndex && 
                                                    selectedSquare.col === colIndex;
                                    return (
                                        <div
                                            key={`${rowIndex}-${colIndex}`}
                                            className={`${styles.cell} ${
                                                (rowIndex + colIndex) % 2 ? styles.dark : styles.light
                                            } ${isSelected ? styles.selected : ''}`}
                                            onClick={() => handleSquareClick(rowIndex, colIndex, (square?.type ?  square.type : ""), square?.color)}
                                        >
                                            {square && (
                                                <img
                                                    src={pieceImages[`${square.type}${square.color[0]}`]}
                                                    className={styles.pieceImg}
                                                    alt={`${square.color} ${square.type}`}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className={styles.bottom}>
                    {files.map(file => (
                        <div key={file} className={styles.fileLabel}>{file}</div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className={styles.right}>
        <GameChat messages={messages} setMessages={setMessages} inputMessage={inputMessage}setInputMessage={setInputMessage} socket = {socket} gameId={gameId} currentPLayer={currentPlayer}/>
      </div>
    </div>
  );
};

export default ChessPage;