import { useState } from 'react';
import VirtualPainter from './components/VirtualPainter';
import Navbar from './components/Navbar';

function App() {
  const [inSession, setInSession] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Function to handle room events from VirtualPainter
  const handleSessionUpdate = (isInSession: boolean, currentSessionId: string, hostStatus: boolean) => {
    setInSession(isInSession);
    setSessionId(currentSessionId);
  };

  return (
    <div className="min-h-screen w-full dark-premium-bg p-0 overflow-x-hidden">
      <Navbar 
        inSession={inSession}
        sessionId={sessionId}
        onLeaveRoom={() => {
          // This will be handled by the VirtualPainter component
          // We'll dispatch a custom event that VirtualPainter will listen for
          const leaveEvent = new CustomEvent('leaveRoom');
          window.dispatchEvent(leaveEvent);
        }} 
      />
      <div className="pt-4 sm:pt-6 animate-fadeIn">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text py-4 sm:py-6 animate-shimmer-slow drop-shadow-glow-indigo">
        </h1>
        <div className="w-48 h-1 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-gradient-x"></div>
      </div>
      <VirtualPainter onSessionUpdate={handleSessionUpdate} />
    </div>
  );
}

export default App;
