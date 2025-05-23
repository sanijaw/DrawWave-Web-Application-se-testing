# Webcam to WebSocket Application

This application captures webcam video at 30fps, sends it to a WebSocket server, and receives x,y coordinate data back.

## Project Structure

- `/src` - Frontend React application
  - `/components/WebcamStream.tsx` - Webcam capture and WebSocket client
- `server.js` - WebSocket server
- `server-package.json` - Server dependencies

## Setup & Installation

### Backend Server

1. First, copy the server package.json:
```bash
cp server-package.json server/package.json
cp server.js server/server.js
cd server
npm install
```

2. Run the server:
```bash
npm start
```

The WebSocket server will start on port 8080.

### Frontend Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The React application will start on http://localhost:5173 (or another port if 5173 is in use).

## How It Works

1. The React application accesses the user's webcam
2. Video frames are captured at 30fps
3. Each frame is converted to JPEG and sent to the WebSocket server
4. The server processes the frames and returns x,y coordinates
5. The coordinates are displayed in the UI

## Requirements

- Modern browser with WebRTC support
- Node.js and npm

## Browser Permissions

You'll need to grant camera access permissions when prompted by the browser.

## Notes

- For production, you may want to implement secure WebSocket (wss://) connections
- The server currently returns random coordinates; you'll need to implement actual image processing
- Frame rate and image quality can be adjusted in the WebcamStream component
