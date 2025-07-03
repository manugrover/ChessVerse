import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/GameChat.module.css';
import { CHAT_MESSAGE, OFFER, ANSWER, ADDICECANDIDATE, CALL_REQUEST, CALL_RESPONSE, END_CALL } from '../messages';
import videoIcon from '../assets/videoIcon.png';
import voiceIcon from '../assets/voiceIcon.png';

const GameChat = ({ socket, messages, setMessages, inputMessage, setInputMessage, gameId, currentPlayer }) => {
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState(''); // 'calling', 'connected', 'ended'

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
          whoSent: currentPlayer,
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

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.send(JSON.stringify({
          type: ADDICECANDIDATE,
          payload: {
            candidate: event.candidate,
            gameId: gameId,
          }
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const startCall = async (isVideo) => {
    try {
      setCallStatus('calling');
      setIsVideoCall(isVideo);
      
      // Request permission and get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Send call request to opponent
      socket?.send(JSON.stringify({
        type: CALL_REQUEST,
        payload: {
          gameId: gameId,
          isVideo: isVideo,
          from: currentPlayer
        }
      }));

    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('error');
    }
  };

  const acceptCall = async () => {
    try {
      setIsCallActive(true);
      setCallStatus('connected');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.isVideo,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = createPeerConnection();
      pcRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Send acceptance response
      socket?.send(JSON.stringify({
        type: CALL_RESPONSE,
        payload: {
          gameId: gameId,
          accepted: true,
          from: currentPlayer
        }
      }));

      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      declineCall();
    }
  };

  const declineCall = () => {
    socket?.send(JSON.stringify({
      type: CALL_RESPONSE,
      payload: {
        gameId: gameId,
        accepted: false,
        from: currentPlayer
      }
    }));
    setIncomingCall(null);
  };

  const endCall = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Send end call message
    socket?.send(JSON.stringify({
      type: END_CALL,
      payload: {
        gameId: gameId,
        from: currentPlayer
      }
    }));

    setIsCallActive(false);
    setCallStatus('');
    setIsVideoCall(false);
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = async (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case CALL_REQUEST:
          setIncomingCall({
            isVideo: message.payload.isVideo,
            from: message.payload.from
          });
          break;

        case CALL_RESPONSE:
          if (message.payload.accepted) {
            setIsCallActive(true);
            setCallStatus('connected');
            
            // Create peer connection and make offer
            const pc = createPeerConnection();
            pcRef.current = pc;

            // Add local stream
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
              });
            }

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            socket?.send(JSON.stringify({
              type: OFFER,
              payload: {
                gameId: gameId,
                sdp: offer,
              }
            }));
          } else {
            setCallStatus('declined');
            // Stop local stream if call was declined
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => track.stop());
              localStreamRef.current = null;
            }
          }
          break;

        case OFFER:
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(message.payload.sdp);
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            
            socket?.send(JSON.stringify({
              type: ANSWER,
              payload: {
                gameId: gameId,
                sdp: answer,
              }
            }));
          }
          break;

        case ANSWER:
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(message.payload.sdp);
          }
          break;

        case ADDICECANDIDATE:
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(message.payload.candidate);
          }
          break;

        case END_CALL:
          endCall();
          break;
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, gameId, currentPlayer]);

  return (
    <div className={styles.chatContainer}>
      {/* Video Call UI */}
      {isCallActive && (
        <div className={styles.videoContainer}>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={styles.remoteVideo}
          />
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={styles.localVideo}
          />
          <div className={styles.callControls}>
            <button onClick={endCall} className={styles.endCallButton}>
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className={styles.incomingCallModal}>
          <div className={styles.modalContent}>
            <h3>Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call</h3>
            <p>from {incomingCall.from}</p>
            <div className={styles.callModalButtons}>
              <button onClick={acceptCall} className={styles.acceptButton}>
                Accept
              </button>
              <button onClick={declineCall} className={styles.declineButton}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <h3>Game Chat</h3>
        <div className={styles.callButtons}>
          <button 
            onClick={() => startCall(false)} 
            disabled={isCallActive}
            className={styles.callButtonContainer}
          >
            <img src={voiceIcon} className={styles.callButton} alt="Voice Call" />
          </button>
          <button 
            onClick={() => startCall(true)} 
            disabled={isCallActive}
            className={styles.callButtonContainer}
          >
            <img src={videoIcon} className={styles.callButton} alt="Video Call" />
          </button>
        </div>
      </div>

      {/* Call Status */}
      {callStatus && (
        <div className={styles.callStatus}>
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'connected' && 'Connected'}
          {callStatus === 'declined' && 'Call Declined'}
          {callStatus === 'error' && 'Call Failed'}
        </div>
      )}

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
                  <div>{message.text}</div>
                  <div className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            )}
            {message.isOwn && (
              <div className={styles.messageBubbleOwn}>
                <div>{message.text}</div>
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