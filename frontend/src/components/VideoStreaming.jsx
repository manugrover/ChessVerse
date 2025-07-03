import React, { useEffect } from 'react'
import { useSocket } from '../hooks/useSocket'

const VideoStreaming = () => {
    const socket = useSocket;
    const [sendingPc, setSendingPc] = useState(null);
    const [receivingPc, setReceivingPc] = useState(null);

    useEffect(()=>{
        if(socket) return;
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            switch(message.type) {
                case OFFER: 
                    console.log("Received offer");
                    const pc = new RTCPeerConnection();
                    pc.setRemoteDescription(message.payload.sdp);

                    const sdp = await pc.createAnswer();
                    pc.localDescription(sdp);

                    const stream = new MediaStream();

                    pc.onicecandidate = async (e) => {
                        if(!e.candidate){
                            return;
                        }

                        if(e.candidate){
                            socket.send(JSON.stringify({
                                type: ADDICECANDIDATE, 
                                payload: {
                                    candidate: e.candidate,
                                    type: "receiver",
                                    roomId: gameId,
                                }
                            }))
                        }
                    }

                    socket.send(JSON.stringify({
                        type: ANSWER,
                        payload: {
                            roomId: gameId, 
                            sdp,
                        }
                    }))


                    break;
                case ANSWER:
                    setSendingPc ( pc => {
                        pc?.setRemoteDescription(message.payload.sdp);
                        return pc;
                    })
                    break;

                case ADDICECANDIDATE:
                    
            }
        }
    }, [socket]);


    return (
        <div>

        </div>
    )
}

export default VideoStreaming