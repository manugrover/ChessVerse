export const INIT_GAME = 'init_game';
export const MOVE = 'move';
export const GAME_OVER = 'game_over';
export const GAME_ADDED = 'game_added';
export const INVALID_MOVE = 'invalid_move';

// messages.ts - Add these constants to your existing file

export const CHAT_MESSAGE = "CHAT_MESSAGE";
export const OFFER = "OFFER";
export const ANSWER = "ANSWER";
export const ADDICECANDIDATE = "ADDICECANDIDATE";
export const CALL_REQUEST = "CALL_REQUEST";
export const CALL_RESPONSE = "CALL_RESPONSE";
export const END_CALL = "END_CALL";

// Message payload interfaces for TypeScript (optional but recommended)
export interface ChatMessagePayload {
    gameId: string;
    messageText: string;
    whoSent: string;
}

export interface WebRTCPayload {
    gameId: string;
    sdp?: RTCSessionDescription;
    candidate?: RTCIceCandidate;
}

export interface CallRequestPayload {
    gameId: string;
    isVideo: boolean;
    from: string;
}

export interface CallResponsePayload {
    gameId: string;
    accepted: boolean;
    from: string;
}

export interface EndCallPayload {
    gameId: string;
    from: string;
}

export interface WebSocketMessage {
    type: string;
    payload: any;
}