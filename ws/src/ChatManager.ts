// messages.ts - Add these new message types to your existing messages file

// ChatManager.ts - New chat manager class
import { User, socketManager } from './SocketManager';
import db from './db';
import { 
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

    async handleVoiceCallOffer(user: User, payload: { gameId: string, offer: any }) {
        const callId = `${payload.gameId}_voice_${Date.now()}`;
        
        // Create call session
        const callSession: CallSession = {
            gameId: payload.gameId,
            callerId: user.userId,
            receiverId: '', // Will be set when answered
            callType: 'voice',
            status: 'pending',
            startTime: new Date()
        };
        
        this.activeCalls.set(callId, callSession);

        // Forward offer to other user in the game
        socketManager.broadcast(
            payload.gameId,
            JSON.stringify({
                type: VOICE_CALL_OFFER,
                payload: {
                    callId,
                    callerId: user.userId,
                    offer: payload.offer
                }
            })
        );
    }

    async handleVoiceCallAnswer(user: User, payload: { callId: string, answer: any }) {
        const callSession = this.activeCalls.get(payload.callId);
        if (!callSession) {
            return;
        }

        callSession.receiverId = user.userId;
        callSession.status = 'active';

        // Forward answer to caller
        socketManager.broadcast(
            callSession.gameId,
            JSON.stringify({
                type: VOICE_CALL_ANSWER,
                payload: {
                    callId: payload.callId,
                    answer: payload.answer
                }
            })
        );

        // Notify both users that call is active
        socketManager.broadcast(
            callSession.gameId,
            JSON.stringify({
                type: CALL_ACCEPTED,
                payload: {
                    callId: payload.callId,
                    callType: 'voice'
                }
            })
        );
    }

    async handleVideoCallOffer(user: User, payload: { gameId: string, offer: any }) {
        const callId = `${payload.gameId}_video_${Date.now()}`;
        
        const callSession: CallSession = {
            gameId: payload.gameId,
            callerId: user.userId,
            receiverId: '',
            callType: 'video',
            status: 'pending',
            startTime: new Date()
        };
        
        this.activeCalls.set(callId, callSession);

        socketManager.broadcast(
            payload.gameId,
            JSON.stringify({
                type: VIDEO_CALL_OFFER,
                payload: {
                    callId,
                    callerId: user.userId,
                    offer: payload.offer
                }
            })
        );
    }

    async handleVideoCallAnswer(user: User, payload: { callId: string, answer: any }) {
        const callSession = this.activeCalls.get(payload.callId);
        if (!callSession) {
            return;
        }

        callSession.receiverId = user.userId;
        callSession.status = 'active';

        socketManager.broadcast(
            callSession.gameId,
            JSON.stringify({
                type: VIDEO_CALL_ANSWER,
                payload: {
                    callId: payload.callId,
                    answer: payload.answer
                }
            })
        );

        socketManager.broadcast(
            callSession.gameId,
            JSON.stringify({
                type: CALL_ACCEPTED,
                payload: {
                    callId: payload.callId,
                    callType: 'video'
                }
            })
        );
    }

    async handleCallEnd(user: User, payload: { callId: string }) {
        const callSession = this.activeCalls.get(payload.callId);
        if (!callSession) {
            return;
        }

        callSession.status = 'ended';

        // Notify both users that call ended
        socketManager.broadcast(
            callSession.gameId,
            JSON.stringify({
                type: callSession.callType === 'voice' ? VOICE_CALL_END : VIDEO_CALL_END,
                payload: {
                    callId: payload.callId,
                    endedBy: user.userId
                }
            })
        );

        // Remove call session
        this.activeCalls.delete(payload.callId);
    }

    async handleCallDecline(user: User, payload: { callId: string }) {
        const callSession = this.activeCalls.get(payload.callId);
        if (!callSession) {
            return;
        }

        // Notify caller that call was declined
        socketManager.broadcast(
            callSession.gameId,
            JSON.stringify({
                type: CALL_DECLINED,
                payload: {
                    callId: payload.callId,
                    declinedBy: user.userId
                }
            })
        );

        this.activeCalls.delete(payload.callId);
    }

    async handleIceCandidate(user: User, payload: { callId: string, candidate: any }) {
        const callSession = this.activeCalls.get(payload.callId);
        if (!callSession) {
            return;
        }

        // Forward ICE candidate to the other peer
        socketManager.broadcast(
            callSession.gameId,
            JSON.stringify({
                type: ICE_CANDIDATE,
                payload: {
                    callId: payload.callId,
                    candidate: payload.candidate,
                    fromUserId: user.userId
                }
            })
        );
    }

    async getChatHistory(gameId: string): Promise<ChatMessage[]> {
        try {
            const messages = await db.chatMessage.findMany({
                where: {
                    gameId: gameId
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });

            return messages.map(msg => ({
                id: msg.id,
                gameId: msg.gameId,
                userId: msg.userId,
                message: msg.message,
                timestamp: msg.timestamp
            }));
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
    }

    cleanupUserCalls(userId: string) {
        // End all active calls for this user
        for (const [callId, callSession] of this.activeCalls.entries()) {
            if (callSession.callerId === userId || callSession.receiverId === userId) {
                socketManager.broadcast(
                    callSession.gameId,
                    JSON.stringify({
                        type: callSession.callType === 'voice' ? VOICE_CALL_END : VIDEO_CALL_END,
                        payload: {
                            callId,
                            endedBy: userId,
                            reason: 'user_disconnected'
                        }
                    })
                );
                this.activeCalls.delete(callId);
            }
        }
    }
}

// Update your GameManager.ts to include chat functionality
// Add these imports at the top of your GameManager.ts:
// import { ChatManager } from './ChatManager';

// Add this to your GameManager class:
/*
export class GameManager {
    private games: Game[];
    private pendingGameId: string | null;
    private users: User[];
    private chatManager: ChatManager; // Add this line

    constructor(){
        this.games = [];
        this.pendingGameId = null;
        this.users = [];
        this.chatManager = new ChatManager(); // Add this line
    }

    // Add these methods to your existing GameManager class:
    
    // In your addHandler method, add these new message type handlers:
    private addHandler(user: User){
        user.socket.on('message', async (data) => {
            const message = JSON.parse(data.toString());

            // ... your existing handlers ...

            // Add these new handlers:
            if(message.type === CHAT_MESSAGE){
                await this.chatManager.handleChatMessage(user, message.payload);
            }

            if(message.type === VOICE_CALL_OFFER){
                await this.chatManager.handleVoiceCallOffer(user, message.payload);
            }

            if(message.type === VOICE_CALL_ANSWER){
                await this.chatManager.handleVoiceCallAnswer(user, message.payload);
            }

            if(message.type === VIDEO_CALL_OFFER){
                await this.chatManager.handleVideoCallOffer(user, message.payload);
            }

            if(message.type === VIDEO_CALL_ANSWER){
                await this.chatManager.handleVideoCallAnswer(user, message.payload);
            }

            if(message.type === VOICE_CALL_END || message.type === VIDEO_CALL_END){
                await this.chatManager.handleCallEnd(user, message.payload);
            }

            if(message.type === CALL_DECLINED){
                await this.chatManager.handleCallDecline(user, message.payload);
            }

            if(message.type === ICE_CANDIDATE){
                await this.chatManager.handleIceCandidate(user, message.payload);
            }
        })
    }

    // Update your removeUser method to cleanup calls:
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
}
*/

// Database Schema Updates (Add these to your Prisma schema):
/*
model ChatMessage {
  id        String   @id @default(uuid())
  gameId    String
  userId    String
  message   String
  timestamp DateTime @default(now())
  
  game      Game     @relation(fields: [gameId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("chat_messages")
}

// Also update your existing Game model to include:
model Game {
  // ... your existing fields ...
  chatMessages  ChatMessage[]
}

// And update your User model to include:
model User {
  // ... your existing fields ...
  chatMessages  ChatMessage[]
}
*/