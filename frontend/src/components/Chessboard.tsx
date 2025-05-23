import type { Color, PieceSymbol, Square } from 'chess.js';
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MOVE } from '../screens/Game';
import { Chess } from 'chess.js';

// Add type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

const Chessboard = ({setBoard, chess, board, socket}: {
    setBoard: any, 
    chess: Chess, // More specific typing
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][],
    socket: WebSocket
})  => {
    const [from, setFrom] = useState<null | string>(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const [lastCommand, setLastCommand] = useState<string>('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Memoize the voice move handler to prevent recreation on every render
    const handleVoiceMove = useCallback((fromSquare: string, toSquare: string) => {
        console.log(`Attempting voice move: ${fromSquare} to ${toSquare}`);
        
        try {
            // Validate the move first with chess.js
            const move = chess.move({
                from: fromSquare as Square,
                to: toSquare as Square
            });

            if (move) {
                // Move is valid, send to server
                socket.send(JSON.stringify({
                    type: MOVE,
                    move: {
                        from: fromSquare,
                        to: toSquare
                    }
                }));
                
                // Update local board state
                setBoard(chess.board());
                setVoiceError(null);
                setLastCommand(`Moved ${fromSquare} to ${toSquare}`);
            }
        } catch (err) {
            console.error('Invalid voice move:', err);
            setVoiceError(`Invalid move: ${fromSquare} to ${toSquare}`);
            // Reset the move since it was invalid
            chess.undo();
        }
    }, [chess, socket, setBoard]);

    // Enhanced voice command parsing
    const parseVoiceCommand = useCallback((transcript: string) => {
        const cleaned = transcript.toLowerCase().trim();
        
        // Multiple patterns for flexibility
        const patterns = [
            // "e2 to e4", "a1 to h8"
            /([a-h][1-8])\s*(?:to|move to|goes to)\s*([a-h][1-8])/,
            // "move e2 e4", "e2 e4"
            /(?:move\s+)?([a-h][1-8])\s+([a-h][1-8])/,
            // "from e2 to e4"
            /from\s+([a-h][1-8])\s+to\s+([a-h][1-8])/
        ];

        for (const pattern of patterns) {
            const match = cleaned.match(pattern);
            if (match) {
                return { from: match[1], to: match[2] };
            }
        }

        return null;
    }, []);

    useEffect(() => {
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.log('Speech recognition not supported in this browser');
            return;
        }

        if (isListening) {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                // Only process final results to avoid multiple triggers
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        const transcript = event.results[i][0].transcript;
                        console.log('Voice command:', transcript);

                        const move = parseVoiceCommand(transcript);
                        if (move) {
                            handleVoiceMove(move.from, move.to);
                        } else {
                            console.log('Could not parse voice command:', transcript);
                            setVoiceError(`Could not understand: "${transcript}"`);
                        }
                    }
                }
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                setVoiceError(`Speech error: ${event.error}`);
                
                // Don't automatically restart on certain errors
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                // Restart recognition if we're still supposed to be listening
                if (isListening) {
                    try {
                        recognition.start();
                    } catch (err) {
                        console.error('Could not restart speech recognition:', err);
                        setIsListening(false);
                    }
                }
            };

            try {
                recognition.start();
                setVoiceError(null);
            } catch (err) {
                console.error('Could not start speech recognition:', err);
                setVoiceError('Could not start voice recognition');
                setIsListening(false);
            }
        }

        // Cleanup function
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [isListening, handleVoiceMove, parseVoiceCommand]);

    const toggleVoiceCommands = () => {
        if (isListening) {
            // Stop listening
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            setVoiceError(null);
        } else {
            // Start listening
            setIsListening(true);
        }
    };

    return (
        <div className='text-white-200'>
            <div className="mb-4 space-y-2">
                <button 
                    onClick={toggleVoiceCommands}
                    className={`px-4 py-2 rounded font-medium ${
                        isListening 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white transition-colors`}
                >
                    {isListening ? '🎤 Stop Voice Commands' : '🎤 Start Voice Commands'}
                </button>
                
                {isListening && (
                    <div className="text-sm text-green-300">
                        🟢 Voice commands active. Say moves like:
                        <ul className="list-disc list-inside ml-4 mt-1">
                            <li>"e2 to e4"</li>
                            <li>"move knight f3"</li>
                            <li>"a1 h8"</li>
                        </ul>
                    </div>
                )}

                {voiceError && (
                    <div className="text-sm text-red-300 bg-red-900/20 p-2 rounded">
                        ❌ {voiceError}
                    </div>
                )}

                {lastCommand && !voiceError && (
                    <div className="text-sm text-green-300 bg-green-900/20 p-2 rounded">
                        ✅ {lastCommand}
                    </div>
                )}
            </div>

            {board.map((row, i) => {
                return <div key={i} className="flex">
                    {row.map((square, j) => {
                        const squareRepresentation = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
                        return <div key={j} className={
                            `w-16 h-16 ${(i + j) % 2 === 0 ? 'bg-green-500' : 'bg-white'} ${
                                from === squareRepresentation ? 'ring-4 ring-blue-400' : ''
                            }`}
                            onClick={() => {
                                if (!from) {
                                    setFrom(squareRepresentation);
                                } else {
                                    socket.send(JSON.stringify({
                                        type: MOVE,
                                        move: {
                                            from,
                                            to: squareRepresentation
                                        }
                                    }));
                                    setFrom(null);
                                    try {
                                        chess.move({
                                            from,
                                            to: squareRepresentation
                                        });
                                        setBoard(chess.board());
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                                console.log(`square is ${squareRepresentation}`);
                                console.log(`From is ${from}`);
                            }}
                        >
                            <div className="w-full justify-center flex h-full">
                                <div className="h-full justify-center flex flex-col">
                                    {square ? square.type : ""}
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            })}
        </div>
    )
}

export default Chessboard