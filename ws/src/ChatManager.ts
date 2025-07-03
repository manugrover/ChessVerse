// messages.ts - Add these new message types to your existing messages file

// ChatManager.ts - New chat manager class
import { User, socketManager } from './SocketManager';
import db from './db';
import { 
    CHAT_MESSAGE,
} from './messages';

interface ChatMessage {
    id: string;
    gameId: string;
    userId: string;
    message: string;
    timestamp: Date;
}

interface CallSession {
    gameId: string;
    callerId: string;
    receiverId: string;
    callType: 'voice' | 'video';
    status: 'pending' | 'active' | 'ended';
    startTime: Date;
}

export class ChatManager {
    private activeCalls: Map<string, CallSession> = new Map();
    
    async handleChatMessage(user: User, payload: { gameId: string, messageText: string, whoSent: string }) {
        try {
            // Save message to database
            const chatMessage = await db.chatMessage.create({
                data: {
                    gameId: payload.gameId,
                    userId: user.userId,
                    message: payload.messageText,
                    timestamp: new Date(),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            // Broadcast message to all users in the game
            socketManager.broadcast(
                payload.gameId,
                JSON.stringify({
                    type: CHAT_MESSAGE,
                    payload: {
                        id: chatMessage.id,
                        gameId: chatMessage.gameId,
                        userId: chatMessage.userId,
                        messageText: chatMessage.message,
                        timestamp: chatMessage.timestamp,
                        whoSent: payload.whoSent,
                    }
                })
            );
        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    }

}