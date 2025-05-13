import { useEffect, useRef, useState } from 'react';

interface Coordinates {
  x: number;
  y: number;
}

const WebcamStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize webcam and WebSocket
  useEffect(() => {
    // Set up WebSocket connection
    const setupWebSocket = () => {
      // Use the TypeScript backend WebSocket server
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setError(null);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.x !== undefined && data.y !== undefined) {
            setCoordinates(data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        // Try to reconnect after a delay
        setTimeout(setupWebSocket, 3000);
      };
      
      wsRef.current = ws;
    };

    // Initialize webcam
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Could not access webcam');
      }
    };

    setupWebcam();
    setupWebSocket();

    // Cleanup function
    return () => {
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Stop webcam stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Set up frame capture and sending
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || !isConnected) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setError('Could not get canvas context');
      return;
    }

    // Frame capture interval (30fps = approx. 33ms)
    const intervalId = setInterval(() => {
      // Only proceed if the video is playing and WebSocket is connected
      if (video.readyState === video.HAVE_ENOUGH_DATA && wsRef.current?.readyState === WebSocket.OPEN) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current video frame on the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob and send via WebSocket
        canvas.toBlob((blob) => {
          if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(blob);
          }
        }, 'image/jpeg', 0.7); // Adjust quality as needed
      }
    }, 33); // ~30fps

    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected]);

  return (
    <div className="webcam-container">
      <h2>Webcam Stream (30 FPS)</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="video-container">
        <video
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      <div className="status-container">
        <p>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        {coordinates && (
          <div className="coordinates">
            <p>Received Coordinates: X: {coordinates.x}, Y: {coordinates.y}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamStream; 