import { useEffect, useRef, useState } from 'react';

const VirtualPainter = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const requestRef = useRef<number | null>(null);
  const [frameRate, setFrameRate] = useState(5); // frames per second
  
  // Session state
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionInput, setSessionInput] = useState<string>('');
  const [participants, setParticipants] = useState<number>(0);
  const [inSession, setInSession] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);

  // Initialize websocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://192.168.1.3:8765');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      setError(null);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
      setError('Connection to server lost. Please refresh the page.');
      setInSession(false);
      setSessionId('');
    };
    
    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to the server. Is the Python backend running?');
      setConnected(false);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        let canvasImage: HTMLImageElement;
        let ctx: CanvasRenderingContext2D | null;
        
        switch (data.type) {
          case 'canvas_update':
            canvasImage = new Image();
            canvasImage.onload = () => {
              ctx = canvasRef.current?.getContext('2d') ?? null;
              if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(canvasImage, 0, 0);
              }
            };
            canvasImage.src = data.canvas;
            break;
            
          case 'session_created':
            setSessionId(data.session_id);
            setInSession(true);
            setParticipants(1); // Creator is the first participant
            setError(null);
            break;
            
          case 'session_joined':
            setSessionId(data.session_id);
            setInSession(true);
            setParticipants(data.participants);
            // Set initial canvas state
            canvasImage = new Image();
            canvasImage.onload = () => {
              ctx = canvasRef.current?.getContext('2d') ?? null;
              if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(canvasImage, 0, 0);
              }
            };
            canvasImage.src = data.canvas;
            setError(null);
            break;
            
          case 'participant_joined':
            setParticipants(data.participants);
            break;
            
          case 'participant_left':
            setParticipants(data.participants);
            break;
            
          case 'color_changed':
            // Optionally handle color changes from other participants
            break;
            
          case 'error':
            console.error('Server error:', data.message);
            setError(`Server error: ${data.message}`);
            break;
            
          default:
            break;
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };
    
    setWsConnection(ws);
    
    return () => {
      console.log('Closing WebSocket connection');
      ws.close();
    };
  }, []);

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
          
          wsConnection.send(JSON.stringify({
            type: 'frame',
            frame
          }));
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
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [wsConnection, connected, frameRate, inSession]);

  // Session management functions
  const handleCreateSession = () => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'create_session'
      }));
    }
  };
  
  const handleJoinSession = () => {
    if (!sessionInput.trim()) {
      setError('Please enter a valid session ID');
      return;
    }
    
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'join_session',
        session_id: sessionInput.trim()
      }));
    }
  };
  
  const handleClearCanvas = () => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && inSession) {
      wsConnection.send(JSON.stringify({
        type: 'clear_canvas'
      }));
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
  
  // Show session setup UI instead of canvas if not in a session
  const renderSessionControls = () => {
    if (inSession) {
      return (
        <div className="session-info bg-indigo-50 p-4 rounded-md mb-4 flex items-center justify-between">
          <div className="text-black">
            <span className="font-medium text-black">Session ID:</span> <span className="bg-white px-2 py-1 rounded text-black">{sessionId}</span>
            <span className="ml-4 font-medium text-black">Participants:</span> <span className="bg-white px-2 py-1 rounded text-black">{participants}</span>
          </div>
          <div className="text-sm text-black">
            Share this ID with others to let them join your drawing session
          </div>
        </div>
      );
    }
    
    return (
      <div className="session-setup bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Collaborative Drawing</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 p-4 border border-indigo-200 rounded-md">
            <h3 className="text-lg font-medium mb-2">Create a New Session</h3>
            <p className="text-sm text-gray-600 mb-4">Start a new collaborative drawing session and share the ID with others</p>
            <button 
              onClick={handleCreateSession}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
              disabled={!connected}
            >
              Create Session
            </button>
          </div>
          
          <div className="flex-1 p-4 border border-indigo-200 rounded-md">
            <h3 className="text-lg font-medium mb-2">Join Existing Session</h3>
            <p className="text-sm text-gray-600 mb-2">Enter a session ID to join an existing drawing session</p>
            <div className="flex">
              <input
                type="text"
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="Enter session ID"
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleJoinSession}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-r-md"
                disabled={!connected || !sessionInput.trim()}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Session controls */}
      {renderSessionControls()}
      
      {/* Only show main content when in a session */}
      {inSession && (
        <div>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="relative rounded-lg overflow-hidden shadow-lg bg-white">
              <video 
                ref={videoRef}
                className="w-full h-auto max-w-lg"
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
            
            <div className="relative rounded-lg overflow-hidden shadow-lg bg-white">
              <canvas 
                ref={canvasRef}
                width={640}
                height={480}
                className="w-full h-auto max-w-lg"
              ></canvas>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center space-x-4">
            <button 
              onClick={handleClearCanvas}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
            >
              Clear Canvas
            </button>
            
            <div className="flex items-center">
              <label htmlFor="colorPicker" className="mr-2">Color:</label>
              <input 
                id="colorPicker"
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="w-10 h-10 rounded cursor-pointer"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="frameRate" className="text-gray-700">FPS:</label>
              <select
                id="frameRate"
                value={frameRate}
                onChange={(e) => setFrameRate(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8 bg-blue-50 p-4 rounded-lg shadow-inner">
            <h2 className="text-xl font-semibold text-indigo-700 mb-2">Gesture Guide:</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
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