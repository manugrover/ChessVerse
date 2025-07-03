import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/GameChat.module.css';
import { CHAT_MESSAGE } from '../messages';
import videoIcon from '../assets/videoIcon.png';
import voiceIcon from '../assets/voiceIcon.png';
const GameChat = ({ socket, messages, setMessages, inputMessage, setInputMessage, gameId, currentPLayer }) => {
  
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      socket.send(JSON.stringify({
        type: CHAT_MESSAGE,
        payload: {
          gameId: gameId,
          messageText: inputMessage,
          whoSent: currentPLayer,
        }
      }));
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  useEffect(()=>{
      if(socket) return;

      socket.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          let pc = new RTCPeerConnection();
          switch(message.type) {
              case OFFER: 
                  console.log("Received offer");
                  pc.setRemoteDescription(message.payload.sdp);

                  const sdp = await pc.createAnswer();
                  await pc.setLocalDescription(sdp);

                  // const stream = new MediaStream();

                  pc.onicecandidate = async (e) => {
                      if(e.candidate){
                          socket.send(JSON.stringify({
                              type: ADDICECANDIDATE, 
                              payload: {
                                  candidate: e.candidate,
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

                  pc.ontrack = (event) => {
                      console.log(event);
                      if(videoRef.current){
                        videoRef.current.srcObject = new MediaStream([event.track]);
                        video.play();
                      }
                  }


                  break;
              case ANSWER:
                  pc?.setRemoteDescription(message.payload.sdp);
                  break;

              case ADDICECANDIDATE:
                  pc.addIceCandidate(message.payload.candidate);
                  break;
          }
      }
  }, [socket]);

  const startVideoCall = async () => {
      // creating an offer
      const pc = new RTCPeerConnection();

      // whenever sdp ( session description protocol ) changes, we need to re-negotiate..

      // this neggotiation will happen only when some video or audio we need to send
      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.send(JSON.stringify({
            type: OFFER,
            payload: {
              gameId, 
              sdp,
            }
        }))
      }

      // Ice candidates are slowly trickling in .. so we need to keep sending it to other side to let it know
      pc.onicecandidate = (event) => {
          if(event.candidate){
            socket?.send(JSON.stringify({
                type: ADDICECANDIDATE,
                payload:{
                  candidate: event.candidate,
                  roomId: gameId,
                },
            }))
          }
      }

      const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      pc.addTrack(stream.getVideoTracks()[0]);
      pc.addTrack(stream.addAudioTracks()[0]);
  }

  return (
    <div className={styles.chatContainer}>
      {/* Chat Header */}
      <video ref={videoRef}></video>
      <div className={styles.chatHeader}>
        <h3>Game Chat</h3>
        <div className={styles.callButtons}>
          <button onClick= {startVideoCall}>
              <img src = {voiceIcon} className={styles.callButton}/>
          </button>
          <button onClick = {startVoiceCall}>
              <img src = {videoIcon} className={styles.callButton}/>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.messageContainer} ${message.isOwn ? styles.ownMessage : ''}`}
          >
            {!message.isOwn && (
              <div className={styles.opponentMessageBox}>
                <div className={styles.senderName}>Opponent</div>
                <div className={styles.messageBubbleOpponent}>
                  <div> {message.text}</div>
                  <div className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            )}
            {message.isOwn && (
              <div className={styles.messageBubbleOwn} >
                  <div> {message.text}</div>
                  <div className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyUp={handleKeyPress}
          placeholder="Type a message..."
          className={styles.messageInput}
        />
        <button 
          onClick={handleSendMessage}
          className={styles.sendButton}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default GameChat;