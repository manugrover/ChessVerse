const WS_URL = "ws://localhost:8081";
import { useState, useEffect } from "react";
import { INIT_GAME } from "../messages";
export  const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(()=>{
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setSocket(ws);
            ws?.send(JSON.stringify({
                type: INIT_GAME
            }))
        }

        ws.onclose = () => {
            setSocket(null);
        }

        return () => {
            ws.close();
        }
    }, []);

    return socket;
}