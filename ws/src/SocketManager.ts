import { WebSocket } from "ws";
import { randomUUID } from "crypto";
export class User{
    public socket: WebSocket;
    public id: string;
    public userId: string;

    constructor(socket: WebSocket, id: string){
        this.socket = socket;
        this.id = randomUUID();
        this.userId = id;
    }
}
interface Room {
    user1: User,
    user2: User,
}
class SocketManager {
    private static instance: SocketManager;
    private rooms: Map<string, Room>;
    private userRoomMapping: Map<string, string>;

    constructor(){
        this.rooms = new Map<string, Room>();
        this.userRoomMapping = new Map<string, string>();
    }

    static getInstance(){
        if(SocketManager.instance){
            return SocketManager.instance;
        }

        SocketManager.instance = new SocketManager();
        return SocketManager.instance;
    }
    addUser(roomId: string, user1: User | null, user2: User | null){
        if(!user1) return;
        if(!user2) return;
        console.log(`Adding user ${user1.userId} and ${user2.userId} to room ${roomId}`);
        this.rooms.set(roomId, {
            user1, 
            user2,
        });
        console.log("-------------After adding------------");
        this.userRoomMapping.set(user1.userId, roomId);
        this.userRoomMapping.set(user2.userId, roomId);

    }
    sendToOpponent(roomId: string, socket: WebSocket, message: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`Room ${roomId} not found`);
            return;
        }
        
        // Fix the logic to get the correct opponent socket
        const opponentSocket = room.user1.socket === socket ? room.user2.socket : room.user1.socket;
        
        if (opponentSocket && opponentSocket.readyState === WebSocket.OPEN) {
            opponentSocket.send(message);
        } else {
            console.log('Opponent socket not available or closed');
        }
    }

    
    broadcast(roomId: string, message: string){
        const room = this.rooms.get(roomId);
        if(!room){
            return;
        }
        room.user1.socket.send(message);
        room.user2.socket.send(message);
    }
    
    removeUser(user: User) {
        const roomId = this.userRoomMapping.get(user.userId);
        if (!roomId) {
            console.error('User was not in any room');
            return;
        }

        const room = this.rooms.get(roomId);
        if (room) {
            this.userRoomMapping.delete(room.user1.userId);
            this.userRoomMapping.delete(room.user2.userId);
            // Removing the entire room
            this.rooms.delete(roomId);
        } else {
            // Cleanup dangling user mapping if room doesn't exist
            this.userRoomMapping.delete(user.userId);
            console.error(`Room ${roomId} not found for user ${user.userId}`);
        }
}
}

export const socketManager = SocketManager.getInstance();