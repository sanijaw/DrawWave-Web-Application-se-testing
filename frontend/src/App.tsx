import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VirtualPainter from './components/VirtualPainter';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Desktop from './components/Desktop';
import Preloader from './components/Preloader';
import AuthCallback from './components/AuthCallback';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [inSession, setInSession] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [showHome, setShowHome] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a ref to store the download function from VirtualPainter
  const downloadCanvasRef = useRef<(() => void) | null>(null);

  // Check local storage on mount to determine if we should show home or VirtualPainter
  useEffect(() => {
    const storedInSession = localStorage.getItem('drawwave_inSession') === 'true';
    if (storedInSession) {
      setShowHome(false);
      setInSession(true);
    }
    
    // Preload assets or perform other initialization if needed
    const preloadAssets = async () => {
      // This could preload images or other resources
      // For now we're just simulating the preloading time with the Preloader component
    };
    
    preloadAssets();
  }, []);

  // Function to handle room events from VirtualPainter
  const handleSessionUpdate = (isInSession: boolean, currentSessionId: string, _hostStatus: boolean) => {
    setInSession(isInSession);
    setSessionId(currentSessionId);
  };

  // Function to handle starting a room from the homepage
  const handleStartRoom = () => {
    setShowHome(false);
  };

  // Function to handle going back to home when leaving session
  const handleLeaveRoom = () => {
    // This will be handled by the VirtualPainter component
    // We'll dispatch a custom event that VirtualPainter will listen for
    const leaveEvent = new CustomEvent('leaveRoom');
    window.dispatchEvent(leaveEvent);
    
    // After leaving the room, check if we should go back to home
    setTimeout(() => {
      const isStillInSession = localStorage.getItem('drawwave_inSession') === 'true';
      if (!isStillInSession) {
        setShowHome(true);
      }
    }, 500);
  };

  // Handler for preloader completion
  const handlePreloaderFinished = () => {
    setIsLoading(false);
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen w-full p-0 overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {/* Preloader */}
            {isLoading && <Preloader onFinished={handlePreloaderFinished} />}
            
            {/* Main App Content (rendered but initially hidden by preloader) */}
            <div className={`min-h-screen w-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
              {/* Routes */}
              <Routes>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/desktop" element={<Desktop />} />
                <Route path="*" element={null} /> {/* Catch-all route that renders nothing, letting the conditional content below handle rendering */}
              </Routes>

              {/* Regular app flow with conditional rendering, just like before */}
              {!showHome && (
                <Navbar 
                  inSession={inSession}
                  sessionId={sessionId}
                  onLeaveRoom={handleLeaveRoom}
                  onDownloadCanvas={downloadCanvasRef.current || undefined}
                />
              )}
              
              {showHome ? (
                <Home onStartRoom={handleStartRoom} />
              ) : (
                <>
                  <div className="pt-4 sm:pt-6 animate-fadeIn">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text py-4 sm:py-6 animate-shimmer-slow drop-shadow-glow-indigo">
                    </h1>
                    <div className="w-48 h-1 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-gradient-x"></div>
                  </div>
                  <VirtualPainter 
                    onSessionUpdate={handleSessionUpdate} 
                    downloadRef={downloadCanvasRef}
                  />
                </>
              )}
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
