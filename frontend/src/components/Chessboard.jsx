// import type { Color, PieceSymbol, Square } from 'chess.js';
// import React, {useState} from 'react'
// import { MOVE } from '../screens/Game';
// import { Chess } from 'chess.js';
// const Chessboard = ({setBoard, chess, board, socket}: {
//     setBoard: any, 
//     chess: any,
//     board: ({
//         square: Square;
//         type: PieceSymbol;
//         color: Color;
//     } | null)[][],
//     socket: WebSocket
// })  => {

//     const [from, setFrom] = useState<null| string>(null);
//     return (
//         <div className='text-white-200'>
//             {
//                 board.map((row, i) => {
//                     return <div key={i} className="flex">
//                         {row.map( (square, j) => {
//                             const squareRepresentation = String.fromCharCode(97+(j%8)) + "" + (8-i) as Square;
//                             return <div key={j} className={
//                                 `w-16 h-16 ${(i+j)%2 === 0 ? 'bg-green-500': 'bg-white'}`}
//                                 onClick = {() => {
//                                     if(!from){
//                                         setFrom(squareRepresentation);
//                                     }
//                                     else{
//                                         socket.send(JSON.stringify({
//                                             type: MOVE,
//                                             move:{
//                                                 from,
//                                                 to: squareRepresentation
//                                             }
//                                         }))
//                                         setFrom(null);
//                                         try {
//                                             chess.move({
//                                             from,
//                                             to:squareRepresentation
//                                             })
//                                             setBoard(chess.board());
//                                         }
//                                         catch(err){
//                                             console.log(err)
//                                         }

                                        
//                                     }
//                                     console.log(`square is ${squareRepresentation}`);
//                                     console.log(`From is ${from}`);
                                   
//                                 }}
//                             >
//                                 <div className="w-full justify-center flex h-full">
//                                     <div className="h-full justify-center flex flex-col">
//                                         {square? square.type: ""}
//                                     </div>
//                                 </div>
//                             </div>
//                         }

//                         )}
//                     </div>
//                 })
//             }
//         </div>
//     )
// }

// export default Chessboard

import React, { useState, useEffect } from 'react';
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
import {MOVE, INIT_GAME, GAME_OVER} from '../messages'
import styles from '../styles/Chessboard.module.css';


const Chessboard = ({chess, board, socket, setBoard, selectedSquare, setSelectedSquare}) => {
    

    return (
        <div></div>
    );
};

export default Chessboard;