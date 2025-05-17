import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReconnectionHandler from './ReconnectionHandler';

const VirtualPainter = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const requestRef = useRef<number | null>(null);
  const [frameRate, setFrameRate] = useState(5); // frames per second - increased default
  
  // Session management states
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('drawwave_sessionId') || '';
  }); // Current session ID when connected
  const [roomId, setRoomId] = useState(() => {
    return localStorage.getItem('drawwave_roomId') || '';
  }); // Room ID associated with the session
  
  // Connection status for user feedback
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [reconnectStatus, setReconnectStatus] = useState<string>('');
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const maxReconnectAttempts = 3; // Maximum number of reconnection attempts
  const reconnectTimeoutsRef = useRef<number[]>([]);
  

  const [createRoomInput, setCreateRoomInput] = useState<string>('');
  const [joinSessionInput, setJoinSessionInput] = useState<string>('');
  const [participants, setParticipants] = useState<number>(0);
  const [inSession, setInSession] = useState<boolean>(() => {
    return localStorage.getItem('drawwave_inSession') === 'true';
  });
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('drawwave_userName') || '';
  });

  // Mouse drawing state
  const [isMouseDrawing, setIsMouseDrawing] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [prevPoint, setPrevPoint] = useState<{x: number, y: number} | null>(null);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // We'll define the handleReconnect function after connectWebSocket is defined
  
  // Mouse drawing functions  
  const toggleMouseDrawing = () => {
    const newValue = !isMouseDrawing;
    setIsMouseDrawing(newValue);
    
    // If mouse drawing is turned on, pause the video processing to stop gesture drawing
    if (newValue && videoRef.current) {
      const videoStream = videoRef.current.srcObject as MediaStream;
      if (videoStream) {
        // Pause or resume video tracks based on mouse drawing state
        videoStream.getVideoTracks().forEach(track => {
          track.enabled = !newValue; // Disable tracks when mouse drawing is enabled
        });
      }
    } else if (videoRef.current) {
      // Resume video if mouse drawing is turned off
      const videoStream = videoRef.current.srcObject as MediaStream;
      if (videoStream) {
        videoStream.getVideoTracks().forEach(track => {
          track.enabled = true;
        });
      }
    }
  };
  
  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    setPrevPoint({ x, y });
  };
  
  // Throttle function to limit the frequency of function calls
  const throttle = (callback: Function, delay: number) => {
    let lastCall = 0;
    return function(...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback(...args);
      }
    };
  };

  // Throttled function for sending complete canvas updates
  const sendDrawingUpdate = useRef(
    throttle((canvas: HTMLCanvasElement) => {
      if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) return;
      
      const drawingDataURL = canvas.toDataURL('image/png');
      wsConnection.send(JSON.stringify({
        type: 'drawing_update',
        drawing: drawingDataURL
      }));
    }, 500) // Throttle to one update every 500ms
  ).current;

  const draw = (x: number, y: number) => {
    if (!isDrawing || !prevPoint) return;
    
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Send only line segment data to server for immediate sync
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'mouse_draw',
        start: { x: prevPoint.x, y: prevPoint.y },
        end: { x, y },
        color: selectedColor
      }));
      
      // Throttled full canvas update
      if (drawingCanvasRef.current) {
        sendDrawingUpdate(drawingCanvasRef.current);
      }
    }
    
    setPrevPoint({ x, y });
  };
  
  const stopDrawing = () => {
    if (isDrawing && drawingCanvasRef.current && wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      // Force send a final drawing update when stopping
      const drawingDataURL = drawingCanvasRef.current.toDataURL('image/png');
      wsConnection.send(JSON.stringify({
        type: 'drawing_update',
        drawing: drawingDataURL
      }));
    }
    
    setIsDrawing(false);
    setPrevPoint(null);
  };
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    startDrawing(x, y);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDrawing || !isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    draw(x, y);
  };
  
  const handleMouseUp = () => {
    if (!isMouseDrawing) return;
    stopDrawing();
  };
  
  const handleMouseLeave = () => {
    if (!isMouseDrawing) return;
    stopDrawing();
  };

  // Function to clear session data from localStorage
  const clearSessionFromLocalStorage = () => {
    localStorage.removeItem('drawwave_sessionId');
    localStorage.removeItem('drawwave_roomId');
    localStorage.removeItem('drawwave_inSession');
    // We keep userName for convenience
    console.log('Session data cleared from localStorage');
  };

  // Function to connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    // Clear any existing reconnection timeouts
    reconnectTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    reconnectTimeoutsRef.current = [];
    
    // Get host from current location or use default
    const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    const WS_URL = `ws://${host}:8765`;
    
    console.log('Connecting to WebSocket server at:', WS_URL);
    
    // Create a new WebSocket connection
    const ws = new WebSocket(WS_URL);
    setWsConnection(ws);
    
    // Setup WebSocket event handlers
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      setReconnecting(false);
      setError(null);
      setReconnectAttempts(0);
      
      // If we're in a session, attempt to reconnect using join_session
      if (inSession && sessionId) {
        console.log('Attempting to reconnect to existing session:', sessionId);
        ws.send(JSON.stringify({
          type: 'join_session',
          session_id: sessionId,
          user_name: userName
        }));
      }
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code}`);
      setConnected(false);
      
      // Only show error if we were already in a session
      if (inSession) {
        setError('Connection to drawing server lost');
      }
    };
    
    ws.onerror = () => {
      console.error('WebSocket connection error');
      setConnected(false);
      
      // Only show error if we were already in a session
      if (inSession) {
        setError('WebSocket connection error');
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data.type);
        
        // Handle different message types
        switch(data.type) {
          case 'error':
            console.error('Connection error:', data.message);
            setError(`Error: ${data.message}`);
            
            // If the error is session not found, clear session data
            if (data.errorCode === 'session_not_found' || data.errorCode === 'no_active_session') {
              setInSession(false);
              clearSessionFromLocalStorage();
            }
            break;
            
          // Handle other message types
          case 'session_created':
            setSessionId(data.session_id);
            setRoomId(data.room_id);
            setInSession(true);
            setParticipants(1);
            
            // Save session data to localStorage
            localStorage.setItem('drawwave_sessionId', data.session_id);
            localStorage.setItem('drawwave_roomId', data.room_id);
            localStorage.setItem('drawwave_inSession', 'true');
            localStorage.setItem('drawwave_userName', userName);
            break;
            
          case 'session_joined':
            console.log('Successfully joined/reconnected to session:', data.session_id);
            setSessionId(data.session_id);
            setRoomId(data.room_id);
            setInSession(true);
            setParticipants(data.participants || 1);
            
            // Clear any reconnection states
            setReconnecting(false);
            setReconnectAttempts(0);
            
            // Show success message if we were reconnecting
            if (reconnecting) {
              setReconnectStatus('Successfully reconnected to session!');
              // Clear reconnection status after a delay
              setTimeout(() => {
                setReconnectStatus('');
              }, 3000);
            }
            
            // Save session data to localStorage
            localStorage.setItem('drawwave_sessionId', data.session_id);
            localStorage.setItem('drawwave_roomId', data.room_id);
            localStorage.setItem('drawwave_inSession', 'true');
            localStorage.setItem('drawwave_userName', userName);
            
            // Apply canvas and drawing data if available
            if (data.canvas) {
              console.log('Restoring canvas state from server');
              const canvasImg = new Image();
              canvasImg.onload = () => {
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.drawImage(canvasImg, 0, 0);
                  }
                }
              };
              canvasImg.src = data.canvas;
            }
            
            if (data.drawing) {
              console.log('Restoring drawing layer from server');
              const drawingImg = new Image();
              drawingImg.onload = () => {
                if (drawingCanvasRef.current) {
                  const ctx = drawingCanvasRef.current.getContext('2d');
                  if (ctx) {
                    ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
                    ctx.drawImage(drawingImg, 0, 0);
                  }
                }
              };
              drawingImg.src = data.drawing;
            }
            
            // Clear any error messages when successfully joined
            setError(null);
            break;
            
          case 'canvas_update':
            if (data.canvas) {
              const img = new Image();
              img.onload = () => {
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  if (ctx) ctx.drawImage(img, 0, 0);
                }
              };
              img.src = data.canvas;
            }
            break;
            
          case 'drawing_update':
            if (data.drawing) {
              const img = new Image();
              img.onload = () => {
                if (drawingCanvasRef.current) {
                  const ctx = drawingCanvasRef.current.getContext('2d');
                  if (ctx) ctx.drawImage(img, 0, 0);
                }
              };
              img.src = data.drawing;
            }
            break;
            
          case 'participant_joined':
          case 'participant_left':
            setParticipants(data.participants);
            break;
            
          case 'clear_canvas':
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            if (drawingCanvasRef.current) {
              const ctx = drawingCanvasRef.current.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
            }
            break;
            
          default:
            console.log('Unhandled message type:', data.type);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return ws;
  }, [inSession, sessionId, userName]);
  
  // Function to handle manual reconnection from the ReconnectionHandler component
  const handleReconnect = useCallback(() => {
    console.log('Manual reconnection requested');
    setReconnectAttempts(0); // Reset attempt counter for manual reconnection
    
    // If we have session data in localStorage, try to reconnect
    const storedSessionId = localStorage.getItem('drawwave_sessionId');
    const storedUserName = localStorage.getItem('drawwave_userName');
    
    if (storedSessionId && storedUserName && wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      // Send a join_session message to reconnect
      wsConnection.send(JSON.stringify({
        type: 'join_session',
        session_id: storedSessionId,
        user_name: storedUserName
      }));
      console.log('Reconnection attempt sent with session ID:', storedSessionId);
    } else {
      // If WebSocket is not connected, reconnect it first
      connectWebSocket();
      console.log('WebSocket not connected, reconnecting first');
    }
  }, [connectWebSocket, wsConnection]);

  // Function to attempt reconnection with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
      setError('Failed to connect after several attempts. Please refresh the page.');
      return;
    }
    
    setReconnectAttempts(prev => prev + 1);
    const attemptNumber = reconnectAttempts + 1;
    const delay = Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000); // Exponential backoff capped at 10s
    
    console.log(`Attempting to reconnect in ${delay/1000} seconds (attempt ${attemptNumber})`);
    setReconnectStatus(`Reconnecting to server... (attempt ${attemptNumber}/${maxReconnectAttempts})`);
    setReconnecting(true);
    
    const timeoutId = window.setTimeout(() => {
      connectWebSocket();
    }, delay);
    
    reconnectTimeoutsRef.current.push(timeoutId);
  }, [reconnectAttempts, maxReconnectAttempts, connectWebSocket]);

  useEffect(() => {
    return () => {
      if (wsConnection) {
        wsConnection.onopen = null;
        wsConnection.onclose = null;
        wsConnection.onerror = null;
        wsConnection.onmessage = null;
        wsConnection.close();
      }
      
      // Clear any reconnection timeouts
      reconnectTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      reconnectTimeoutsRef.current = [];
    };
  }, [inSession, sessionId, userName]);

  // Initialize WebSocket connection and handle reconnection
  useEffect(() => {
    connectWebSocket();
    
    // Setup automatic reconnection when connection is lost
    if (!connected && inSession) {
      attemptReconnect();
    }
  }, [inSession, connected, connectWebSocket, attemptReconnect]);

  // Initialize webcam
  useEffect(() => {
    // Only initialize camera if in a session
    if (!inSession) return;
    
    console.log('Initializing webcam...');
    const startCamera = async () => {
      try {
        console.log('Requesting camera permissions...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' 
          } 
        });
        
        console.log('Camera access granted, setting up video element');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, playing video');
            videoRef.current?.play()
              .then(() => {
                console.log('Video playback started successfully');
                setCameraReady(true);
              })
              .catch(err => {
                console.error('Video playback failed:', err);
              });
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Could not access webcam. Please ensure camera permissions are enabled in your browser settings.');
      }
    };
    
    startCamera();
    
    return () => {
      // Capture the ref value in a variable to avoid the warning
      const videoElement = videoRef.current;
      const stream = videoElement?.srcObject as MediaStream;
      if (stream) {
        console.log('Cleaning up webcam stream');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [inSession]); // Re-initialize camera when inSession changes

  // Send frames to WebSocket server
  useEffect(() => {
    if (!wsConnection || !connected || !inSession) return;
    
    console.log('Setting up frame sending...');
    
    const sendFrame = () => {
      // Skip frame sending if mouse drawing is enabled
      if (isMouseDrawing) {
        // Still keep the loop going, just don't send frames
        const frameInterval = 1000 / frameRate;
        requestRef.current = requestAnimationFrame(() => {
          setTimeout(sendFrame, frameInterval);
        });
        return;
      }
      
      if (videoRef.current && wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        // Only proceed if video has dimensions and is playing
        if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
          console.log("Video not ready yet, waiting...");
          requestRef.current = requestAnimationFrame(() => {
            setTimeout(sendFrame, 100);
          });
          return;
        }
        
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error("Failed to get canvas context");
            return;
          }
          
          // Mirror the image horizontally
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          // Reset transform
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          
          // Reduce quality to improve performance and reduce bandwidth
          const frame = canvas.toDataURL('image/jpeg', 0.6);
          
          // Validate frame data
          if (!frame || !frame.startsWith('data:image/jpeg;base64,')) {
            console.error("Invalid frame data generated");
            return;
          }
          
          // Only send frame to server if:  
          // 1. We're not in mouse drawing mode
          // 2. We have a valid WebSocket connection
          // 3. We're actually in a session
          // 4. We have a valid session ID
          if (wsConnection && 
              wsConnection.readyState === WebSocket.OPEN && 
              inSession && 
              sessionId) {
            wsConnection.send(JSON.stringify({
              type: 'frame',
              frame
            }));
          } else if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            // If we're not in a session but trying to send frames, that's an issue
            // Log it once rather than repeatedly using a local variable to avoid spamming console
            const warningKey = 'drawwave_logged_session_warning';
            const hasLoggedWarning = sessionStorage.getItem(warningKey) === 'true';
            
            if (!hasLoggedWarning) {
              console.warn('Not sending frames - no active session');
              sessionStorage.setItem(warningKey, 'true');
              
              // Reset this flag after a delay so we don't spam the console but will log again if the issue persists
              setTimeout(() => {
                sessionStorage.removeItem(warningKey);
              }, 5000);
            }
          }
        } catch (err) {
          console.error('Error capturing frame:', err);
        }
      }
      
      // Calculate frame interval based on frameRate
      const frameInterval = 1000 / frameRate;
      requestRef.current = requestAnimationFrame(() => {
        setTimeout(sendFrame, frameInterval);
      });
    };
    
    sendFrame();
    
    // Set up drawing canvas to match size of main canvas
    if (canvasRef.current && drawingCanvasRef.current) {
      drawingCanvasRef.current.width = canvasRef.current.width;
      drawingCanvasRef.current.height = canvasRef.current.height;
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [wsConnection, connected, frameRate, inSession, isMouseDrawing]);

  // Session management functions
  // Modified handleCreateSession
  const handleCreateSession = async () => {
    // Validate that the user has entered a username
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    // Validate that a room code has been generated
    if (!createRoomInput.trim()) {
      setError('Please generate a room code first');
      return;
    }
    
    // Save username in localStorage as soon as they attempt to create
    localStorage.setItem('drawwave_userName', userName);
    
    try {
      // Generate a unique session ID (different from room ID)
      const generatedSessionId = createRoomInput.trim() + '-' + Math.random().toString(36).substring(2, 7);
      
      // Get host from current location or use default for API
      const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
      const API_URL = `http://${host}:5000/api/sessions/create`;
      console.log('Creating session with backend at:', API_URL);
      
      // Save session to MongoDB with both sessionId and roomId
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: generatedSessionId,
          roomId: createRoomInput.trim(),
          userName: userName.trim()
        }),
      });
      
      console.log('Session creation response status:', response.status);
      const data = await response.json();
      console.log('Session creation response:', data);
      
      if (!data.success) {
        setError(data.message);
        return;
      }
      
      // If MongoDB save is successful, connect via WebSocket
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        console.log('Sending create session request to WebSocket server');
        wsConnection.send(JSON.stringify({
          type: 'create_session',
          session_id: generatedSessionId,
          room_id: createRoomInput.trim(),
          user_name: userName
        }));
      } else {
        console.error('WebSocket connection not open');
        setError('WebSocket connection not available. Please refresh the page.');
      }
    } catch (error) {
      setError('Failed to create session. Please try again.');
      console.error('Create session error:', error);
    }
  };
  
  const generateRoomId = () => {
    // Generate a random 6-character alphanumeric room ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCreateRoomInput(result);
    setError(null); // Clear any previous errors
  };
  
  const copyRoomId = () => {
    if (!createRoomInput.trim()) return;
    
    navigator.clipboard.writeText(createRoomInput).then(() => {
      // Provide user feedback
      setError('Room code copied to clipboard!');
      // Clear the success message after 2 seconds
      setTimeout(() => {
        setError(null);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy room code:', err);
      setError('Failed to copy room code. Please try again.');
    });
  };
  
  const handleJoinSession = async () => {
    if (!joinSessionInput.trim()) {
      setError('Please enter a valid session ID');
      return;
    }
    
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    // Save username in localStorage as soon as they attempt to join
    localStorage.setItem('drawwave_userName', userName);
    
    try {
      // Get host from current location or use default for API
      const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
      const API_URL = `http://${host}:5000/api/sessions/validate`;
      console.log('Validating session with backend at:', API_URL);
      
      // Validate session in MongoDB
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: joinSessionInput.trim(),
          userName: userName.trim()
        }),
      });
      
      console.log('Session validation response status:', response.status);
      const data = await response.json();
      console.log('Session validation response:', data);
      
      if (!data.success) {
        setError(data.message || 'Invalid session ID');
        return;
      }
      
      // If validation is successful, connect via WebSocket
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        console.log('Sending join request to WebSocket server');
        wsConnection.send(JSON.stringify({
          type: 'join_session',
          session_id: joinSessionInput.trim(),
          user_name: userName
        }));
      } else {
        console.error('WebSocket connection not open');
        setError('WebSocket connection not available. Please refresh the page.');
      }
    } catch (error) {
      setError('Failed to join session. Please try again.');
      console.error('Join session error:', error);
    }
  };
  
  const handleClearCanvas = () => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && inSession) {
      // Clear the drawing canvas locally first
      if (drawingCanvasRef.current) {
        const drawingCtx = drawingCanvasRef.current.getContext('2d');
        if (drawingCtx) {
          drawingCtx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }
      }
      
      // Then send clear canvas command to server for all clients
      wsConnection.send(JSON.stringify({
        type: 'clear_canvas'
      }));
      
      // Also send empty drawing update to ensure drawing layer is cleared on all clients
      if (drawingCanvasRef.current) {
        const emptyDrawing = drawingCanvasRef.current.toDataURL('image/png');
        wsConnection.send(JSON.stringify({
          type: 'drawing_update',
          drawing: emptyDrawing
        }));
      }
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const colorHex = e.target.value;
    setSelectedColor(colorHex);
    
    // Convert HEX to RGB and send to server
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);
    
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && inSession) {
      wsConnection.send(JSON.stringify({
        type: 'change_color',
        color: [r, g, b]
      }));
    }
  };
  
  // Toggle fullscreen mode for canvas
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Show session setup UI instead of canvas if not in a session
  const renderSessionControls = () => {
    if (inSession) {
      return (
        <div className="session-info bg-indigo-50 p-3 sm:p-4 rounded-md mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 max-w-7xl mx-auto">
          <div className="text-black flex flex-wrap gap-2 items-center">
            <span className="font-medium text-black">Session ID:</span> <span className="bg-white px-2 py-1 rounded text-black">{sessionId}</span>
            <span className="font-medium text-black ml-0 sm:ml-4">Participants:</span> <span className="bg-white px-2 py-1 rounded text-black">{participants}</span>
            <button 
              onClick={() => {
                // Clear session data
                clearSessionFromLocalStorage();
                setInSession(false);
                setSessionId('');
                setRoomId('');
                window.location.reload(); // Force a refresh to ensure clean state
              }}
              className="ml-0 sm:ml-4 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
            >
              Leave Room
            </button>
          </div>
          <div className="text-sm text-black">
            Share this ID with others to let them join your drawing session
          </div>
        </div>
      );
    }
    
    return (
      <div className="session-setup bg-white p-4 rounded-lg shadow-md mx-auto my-4 flex flex-col w-full max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between w-full gap-4">
          {/* Create Room Section */}
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Create Room</h2>
            
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full mb-4 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base bg-gray-50"
            />
            
            <div className="w-full mb-4 flex">
              <input
                type="text"
                value={createRoomInput}
                onChange={(e) => setCreateRoomInput(e.target.value)}
                placeholder="Room ID"
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base bg-gray-50"
                readOnly
              />
              <button
                onClick={generateRoomId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 text-sm"
              >
                Generate
              </button>
              <button
                onClick={copyRoomId}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-r-md text-sm"
                disabled={!createRoomInput.trim()}
              >
                Copy
              </button>
            </div>
            
            <button 
              onClick={handleCreateSession}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-base"
              disabled={!connected || !userName.trim() || !createRoomInput.trim()}
            >
              Create Room
            </button>
            {!userName.trim() && <p className="text-xs text-gray-500 mt-2 text-center">Please enter your name</p>}
            {!createRoomInput.trim() && <p className="text-xs text-gray-500 mt-2 text-center">Please generate a room code</p>}
          </div>
          
          {/* OR Divider */}
          <div className="flex items-center justify-center">
            <span className="text-lg font-medium text-gray-500 px-4">OR</span>
          </div>
          
          {/* Join Room Section */}
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Join Room</h2>
            
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full mb-4 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base bg-gray-50"
            />
            
            <input
              type="text"
              placeholder="Enter Session ID"
              value={joinSessionInput}
              onChange={(e) => setJoinSessionInput(e.target.value)}
              className="w-full mb-4 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-base bg-gray-50"
            />
            
            <button
              onClick={handleJoinSession}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-base"
              disabled={!connected || !userName.trim() || !joinSessionInput.trim()}
            >
              Join Room
            </button>
            {!userName.trim() && <p className="text-xs text-gray-500 mt-2 text-center">Please enter your name</p>}
            {!joinSessionInput.trim() && <p className="text-xs text-gray-500 mt-2 text-center">Please enter a session ID</p>}
          </div>
        </div>
      </div>
    );
  };

  // The handleReconnect function is defined above near the connectWebSocket function

  return (
    <div className="max-w-full w-full mx-auto px-0 sm:px-1">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 text-sm sm:text-base max-w-7xl mx-auto">
          {error}
        </div>
      )}
      
      {reconnecting && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 text-sm sm:text-base max-w-7xl mx-auto flex items-center">
          <span className="inline-block mr-2 animate-spin">⟳</span>
          <span>{reconnectStatus || 'Reconnecting to previous session...'}</span>
        </div>
      )}
      
      {!reconnecting && reconnectStatus && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 text-sm sm:text-base max-w-7xl mx-auto">
          {reconnectStatus}
        </div>
      )}
      
      {/* ReconnectionHandler component */}
      <ReconnectionHandler
        isConnected={connected}
        inSession={inSession}
        sessionId={sessionId}
        userName={userName}
        onReconnect={handleReconnect}
      />
      
      {/* Session controls */}
      {renderSessionControls()}
      
      {/* Only show main content when in a session */}
      {inSession && (
        <div>
          {/* Session Information Panel */}
          <div className="bg-indigo-50 p-3 sm:p-4 rounded-md mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center">
                <span className="font-medium text-black">Session ID:</span>
                <span className="bg-white px-2 py-1 rounded ml-2 text-black">{sessionId}</span>
              </div>
              
              <div className="flex items-center ml-0 sm:ml-4">
                <span className="font-medium text-black">Room ID:</span>
                <span className="bg-white px-2 py-1 rounded ml-2 text-black">{roomId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    setError('Room ID copied to clipboard!');
                    setTimeout(() => setError(null), 2000);
                  }}
                  className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded text-xs"
                  title="Copy Room ID"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="text-sm">
              <span className="bg-green-100 px-2 py-1 rounded text-green-800">{participants} participant{participants !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className={`flex flex-col ${isFullscreen ? '' : 'xl:flex-row'} gap-4 justify-center items-center w-full max-w-7xl mx-auto`}>
            <div className={`relative rounded-lg overflow-hidden shadow-lg bg-white w-full max-w-full md:max-w-2xl xl:max-w-3xl ${isFullscreen ? 'hidden' : ''}`}>
              <video 
                ref={videoRef}
                className="w-full h-auto" 
                muted
                playsInline
              ></video>
              {!connected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                  Connecting to server...
                </div>
              )}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
                  <div className="text-center">
                    <p className="mb-2">Camera not detected</p>
                    <button 
                      onClick={() => {
                        setCameraReady(false); // Reset status while trying
                        navigator.mediaDevices.getUserMedia({ 
                          video: { width: 640, height: 480, facingMode: 'user' } 
                        })
                        .then(stream => {
                          if (videoRef.current) {
                            // Stop any existing tracks
                            const oldStream = videoRef.current.srcObject as MediaStream;
                            if (oldStream) {
                              oldStream.getTracks().forEach(track => track.stop());
                            }
                            
                            // Set new stream
                            videoRef.current.srcObject = stream;
                            videoRef.current.play()
                              .then(() => setCameraReady(true))
                              .catch(playErr => {
                                console.error('Play failed:', playErr);
                                setError('Failed to play video: ' + playErr.message);
                              });
                          }
                        })
                        .catch(err => {
                          console.error('Camera access error:', err);
                          setError('Camera access denied. Please check your browser settings.');
                        });
                      }}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Enable Camera
                    </button>
                  </div>
                </div>
              )}
              <div className="absolute top-0 right-0 p-2 bg-black bg-opacity-50 text-white text-xs">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${cameraReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{cameraReady ? 'Camera connected' : 'Camera disconnected'}</span>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-lg overflow-hidden shadow-lg bg-white w-full max-w-full md:max-w-2xl xl:max-w-3xl" style={{position: 'relative', ...(isFullscreen ? {width: '100%', maxWidth: '90vw', height: isFullscreen ? '75vh' : 'auto'} : {})}}>
              <div className="absolute top-2 right-2 z-20">
                <button
                  onClick={toggleFullscreen}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full flex items-center justify-center shadow-md transition-all"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
                >
                  {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  )}
                </button>
              </div>
              <div style={{position: 'relative', width: '100%', height: 'auto'}}>
                <canvas 
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="w-full h-auto"
                  style={{position: 'absolute', top: 0, left: 0, zIndex: 0}}
                ></canvas>
                <canvas 
                  ref={drawingCanvasRef}
                  width={640}
                  height={480}
                  className="w-full h-auto"
                  style={{position: 'absolute', top: 0, left: 0, zIndex: 10, backgroundColor: 'transparent'}}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                ></canvas>
                <div style={{position: 'relative', width: '100%', paddingTop: '75%'}}></div>
              </div>
            </div>
          </div>
          
          <div className={`mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-4 ${isFullscreen ? 'max-w-5xl mx-auto' : ''}`}>
            <button 
              onClick={handleClearCanvas}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 sm:px-4 rounded text-sm sm:text-base transition-colors duration-200"
            >
              Clear Canvas
            </button>
            <button 
              onClick={toggleMouseDrawing}
              className={`${isMouseDrawing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white font-medium py-2 px-3 sm:px-4 rounded text-sm sm:text-base transition-colors duration-200`}
            >
              {isMouseDrawing ? 'Mouse Drawing: ON' : 'Mouse Drawing: OFF'}
            </button>
            <button 
              onClick={() => {
                if (wsConnection) {
                  console.log('Testing reconnection by closing the WebSocket');
                  wsConnection.close();
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 sm:px-4 rounded text-sm sm:text-base transition-colors duration-200"
            >
              Test Reconnection
            </button>
            
            <div className="flex items-center">
              <label htmlFor="colorPicker" className="mr-2 text-sm sm:text-base">Color:</label>
              <input 
                id="colorPicker"
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded cursor-pointer"
              />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <label htmlFor="frameRate" className="text-gray-700 text-sm sm:text-base">FPS:</label>
              <select
                id="frameRate"
                value={frameRate}
                onChange={(e) => setFrameRate(Number(e.target.value))}
                className="border rounded px-1 sm:px-2 py-1 text-sm sm:text-base"
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 bg-blue-50 p-3 sm:p-4 rounded-lg shadow-inner max-w-3xl mx-auto w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-2">Gesture Guide:</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm sm:text-base">
              <li>✏️ <strong>Draw:</strong> Extend index finger only</li>
              <li>🧽 <strong>Erase:</strong> Extend index and middle fingers</li>
              <li>✋ <strong>Stop Drawing:</strong> Show all five fingers</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualPainter; 