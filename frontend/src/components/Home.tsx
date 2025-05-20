import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HomeProps {
  onStartRoom: () => void;
}

const Home = ({ onStartRoom }: HomeProps) => {
  const [animate, setAnimate] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [autoplayVideo, setAutoplayVideo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoSectionRef = useRef<HTMLDivElement>(null);
  
  // Get auth context to check user authentication status and user information
  const { user, isAuthenticated, login } = useAuth();
  
  // Animation frames reference
  const animationFrameRef = useRef<number | null>(null);
  
  // Function to scroll to demo section and autoplay video
  const scrollToDemo = () => {
    // Set autoplay to true when View Demo is clicked
    setAutoplayVideo(true);
    
    // Scroll to the demo section
    if (demoSectionRef.current) {
      demoSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    }
  };
  
  useEffect(() => {
    // Start animations after component mounts
    setAnimate(true);
    
    // Setup matrix rain effect
    const setupMatrixEffect = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Make canvas full screen
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Characters to display
      const chars = '01';
      const fontSize = 12;
      const columns = Math.floor(canvas.width / fontSize);
      
      // Array for storing the current y position of each column
      const drops: number[] = [];
      
      // Initialize drops array
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
      }
      
      const draw = () => {
        // Set a semi-transparent black to create fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#a855f712'; // Very faint purple
        ctx.font = `${fontSize}px monospace`;
        
        // For each column
        for (let i = 0; i < drops.length; i++) {
          // Random character
          const text = chars[Math.floor(Math.random() * chars.length)];
          
          // Draw the character
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          
          // Increment y coordinate and reset if it's at the bottom
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
            drops[i] = 0;
          }
          
          // Move it down randomly
          drops[i] += Math.random() * 0.3;
        }
        
        // Call the animation recursively
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      
      // Start animation
      draw();
    };
    
    // Initialize animations
    setupMatrixEffect();
    
    // Handle window resize for canvas
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup animations and event listeners
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-black" style={{ pointerEvents: 'auto' }}>
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1a002a] border border-purple-500 rounded-lg shadow-lg p-6 max-w-md w-full transform transition-all animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-4">Authentication Required</h3>
            <p className="text-gray-300 mb-6">You need to sign in with Google before creating or joining a room.</p>
            <div className="flex justify-center">
              <div className="animate-pulse">
                <div className="h-10 w-10 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-center text-gray-400 mt-4 text-sm">Redirecting to Google login...</p>
          </div>
        </div>
      )}
      {/* Canvas for matrix rain effect */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0"
      />
      
      {/* Backdrop with grid lines and glow effects */}
      <div className="absolute inset-0 bg-[#0a001a] z-10 overflow-hidden opacity-70">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a002a] via-[#150025] to-[#0a001a] opacity-80"></div>
        
        {/* Horizontal grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to bottom, transparent 49px, rgba(168, 85, 247, 0.05) 50px, transparent 51px),
            radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)
          `,
          backgroundSize: '100% 50px, 100% 100%',
        }}></div>
        
        {/* Vertical grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, transparent 49px, rgba(168, 85, 247, 0.05) 50px, transparent 51px)',
          backgroundSize: '50px 100%',
        }}></div>
      </div>
      
      {/* Center glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vh] z-20 rounded-full bg-gradient-to-r from-[#a855f7]/10 to-[#8b5cf6]/10 blur-3xl transform ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} transition-all duration-2000 ease-in-out animate-pulse-slow`}></div>
      
      {/* Camera icons around edges */}
      <div className="absolute top-8 left-8 z-30">
        <div className="w-6 h-6 border border-[#a855f7]/30 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-[#a855f7]/50 rounded-full animate-ping-slow"></div>
        </div>
      </div>
      <div className="absolute top-8 right-8 z-30">
        <div className="w-6 h-6 border border-[#a855f7]/30 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-[#a855f7]/50 rounded-full animate-ping-slow animation-delay-300"></div>
        </div>
      </div>
      <div className="absolute bottom-8 left-8 z-30">
        <div className="w-6 h-6 border border-[#a855f7]/30 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-[#a855f7]/50 rounded-full animate-ping-slow animation-delay-600"></div>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 z-30">
        <div className="w-6 h-6 border border-[#a855f7]/30 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-[#a855f7]/50 rounded-full animate-ping-slow animation-delay-900"></div>
        </div>
      </div>
      
      {/* Content Container */}
      <div className="z-40 flex flex-col items-center justify-center text-center w-full px-4 sm:px-6 md:px-8 min-h-[100vh] transform translate-y-0 opacity-100 transition-all duration-1000 ease-out perspective-[1000px]">
        <div className="relative w-full max-w-4xl mx-auto scale-100 opacity-100 transition-all duration-1000 ease-out animation-delay-300 transform-gpu hover:rotate-y-3 hover:scale-105 transition-transform">
          <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] font-bold mb-4 text-white transform-gpu" style={{ textShadow: 'rgba(168, 85, 247, 0.4) 0px 0px 30px' }}>
            <span className="relative inline-block animate-float">
              <span className="relative z-10 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 text-transparent bg-clip-text">DrawWave</span>
              <span className="absolute -left-1 -top-1 text-[#a855f7]/10 blur-sm">DrawWave</span>
              <span className="absolute -left-0.5 -top-0.5 text-[#8b5cf6]/20 blur-sm">DrawWave</span>
              <span className="absolute left-0.5 top-0.5 text-[#d946ef]/10 blur-sm animate-pulse-slow">DrawWave</span>
            </span>
          </h1>
        </div>
        <p className="text-[#a855f7]/80 text-xl sm:text-2xl mb-6 opacity-100 transition-all duration-1000 ease-out animation-delay-400 transform-gpu hover:scale-105 transition-transform">Introducing Collaborative Drawing</p>
        
        {/* User Info Display - Show when authenticated */}
        {isAuthenticated && user && (
          <div className="mb-8 opacity-100 transition-all duration-700 ease-out animation-delay-450 transform-gpu">
            <div className="flex items-center justify-center gap-3 bg-[#1a002a]/60 backdrop-blur-md px-5 py-3 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
              <img 
                src={user.picture} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border-2 border-purple-500/50"
              />
              <div className="text-white text-sm font-medium">Signed in as <span className="text-purple-300">{user.name}</span></div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-6 mt-6 mb-12 opacity-100 translate-y-0 transition-all duration-1000 ease-out animation-delay-500 w-full max-w-xl mx-auto">
          <button 
            onClick={() => {
              if (isAuthenticated) {
                onStartRoom && onStartRoom();
              } else {
                setShowAuthModal(true);
                setTimeout(() => {
                  login();
                }, 2000);
              }
            }}
            className="group relative px-8 py-4 text-base font-medium text-white bg-[#a855f7] hover:bg-[#9046d1] rounded-md transition-all duration-300 shadow-lg shadow-[#a855f7]/30 flex items-center justify-center min-w-[180px] transform hover:scale-110 hover:translate-z-10 sm:flex-1"
          >
            <span className="relative z-10 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Start Session
            </span>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] rounded-md blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          </button>

          <button 
            onClick={() => scrollToDemo()}
            className="group relative px-8 py-4 text-base font-medium text-white bg-transparent border border-[#a855f7]/50 hover:border-[#a855f7] rounded-md transition-all duration-300 flex items-center justify-center min-w-[180px] transform hover:scale-110 hover:translate-z-10 sm:flex-1"
          >
            <span className="relative z-10 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              View Demo
            </span>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#a855f7]/20 to-[#8b5cf6]/20 rounded-md blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
          </button>
        </div>
        

        
        {/* Bottom icons row with hover effects */}
        <div className="flex flex-col items-center gap-8">
          <div className={`flex gap-12 mt-2 ${animate ? 'opacity-100' : 'opacity-0'} transition-all duration-1000 ease-out animation-delay-700`}>
            {['Draw', 'Collab', 'Platform'].map((label, index) => (
              <div key={label} className="flex flex-col items-center group">
                <div className={`w-10 h-10 border border-[#a855f7]/30 rounded-md flex items-center justify-center mb-2 transform transition-all duration-300 group-hover:scale-110 group-hover:border-[#a855f7]/60 group-hover:shadow-md group-hover:shadow-[#a855f7]/20 animation-delay-${index * 300}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                       className={`w-4 h-4 text-[#a855f7]/70 group-hover:text-[#a855f7] transition-all duration-300 ${animate ? 'animate-float' : ''}`}
                       style={{ animationDelay: `${index * 0.3}s` }}>
                    {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />}
                    {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />}
                    {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />}
                  </svg>
                </div>
                <p className="text-xs text-white/70 group-hover:text-white transition-colors duration-300">{label}</p>
              </div>
            ))}
          </div>
          
          {/* Download Buttons */}
          <div className={`flex items-center gap-4 mt-4 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-1000 ease-out animation-delay-800`}>
            <a
              href="/downloads/DrawWave-Setup.exe"
              download
              className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/30"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Desktop App
            </a>
            <a
              href="/desktop"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-purple-500/50 text-white font-medium hover:bg-purple-500/10 transition-all duration-300"
            >
              Learn More
            </a>
          </div>
        </div>
        
      </div>

      {/* How DrawWave Works Section - full width section with 3D perspective effects */}
      <section ref={demoSectionRef} id="demo-section" className="min-h-screen w-full flex flex-col items-center py-20 overflow-hidden perspective-[1200px]">
        <div className={`w-full max-w-5xl px-4 md:px-8 ${animate ? 'opacity-100 translate-y-0 rotate-x-0' : 'opacity-0 translate-y-10 rotate-x-2'} transition-all duration-1000 ease-out delay-1000 transform-gpu`}>
          <div className="text-center mb-16 transform-gpu hover:rotate-y-1 transition-all duration-500 hover:scale-105">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 text-transparent bg-clip-text">How DrawWave Works</span>
              <span className="absolute -left-1 -top-1 text-[#a855f7]/10 blur-md">How DrawWave Works</span>
              <span className="absolute left-0.5 top-0.5 text-[#d946ef]/10 blur-sm animate-pulse-slow">How DrawWave Works</span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-[#a855f7] to-[#7e22ce] mx-auto mt-4 rounded-full shadow-lg shadow-purple-500/20 animate-pulse-slow"></div>
            <p className="text-base sm:text-lg text-white mt-5 mb-10 max-w-2xl mx-auto font-medium">Easy collaboration in three simple steps</p>
          </div>
          
          {/* Steps Timeline with 3D effects */}
          <div className="relative mt-16 pb-16 perspective-[1000px]">
            {/* Timeline line */}
            <div className="absolute h-full w-1 bg-gradient-to-b from-[#a855f7]/60 via-[#7e22ce]/60 to-transparent left-1/2 transform -translate-x-1/2 z-0 rounded-full shadow-glow animate-pulse-slow"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center mb-28 relative group">
              <div className={`w-full md:w-1/2 pr-0 md:pr-16 text-center md:text-right transition-all duration-700 transform-gpu ${animate ? 'translate-x-0 opacity-100 rotate-y-0' : '-translate-x-10 opacity-0 rotate-y-10'} hover:translate-z-10 hover:scale-105`} style={{ transitionDelay: '300ms' }}>
                <div className="bg-[#1a002a]/60 backdrop-blur-md border border-purple-900/30 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20">
                  <h3 className="text-white font-medium text-xl sm:text-2xl mb-3 bg-gradient-to-r from-pink-200 to-purple-100 text-transparent bg-clip-text" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>1. Create a Session</h3>
                  <p className="text-white text-sm sm:text-base font-medium">Start your creative journey by creating a new drawing room. Get a unique session ID to share with your team.</p>
                </div>
              </div>
              
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10 scale-100 group-hover:scale-125 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#a855f7] to-[#7e22ce] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 animate-float">
                  <span className="relative z-10 text-xl">1</span>
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-sm animate-ping opacity-75"></div>
                </div>
              </div>
              
              <div className="w-full md:w-1/2 pl-0 md:pl-16 mt-6 md:mt-0 text-center md:text-left opacity-0">
                {/* Empty space for layout */}
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center mb-28 relative group">
              <div className="w-full md:w-1/2 pr-0 md:pr-16 text-center md:text-right opacity-0">
                {/* Empty space for layout */}
              </div>
              
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10 scale-100 group-hover:scale-125 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#a855f7] to-[#7e22ce] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 animate-float" style={{ animationDelay: '0.5s' }}>
                  <span className="relative z-10 text-xl">2</span>
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-sm animate-ping opacity-75" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              
              <div className={`w-full md:w-1/2 pl-0 md:pl-16 text-center md:text-left transition-all duration-700 transform-gpu ${animate ? 'translate-x-0 opacity-100 rotate-y-0' : 'translate-x-10 opacity-0 rotate-y-10'} hover:translate-z-10 hover:scale-105`} style={{ transitionDelay: '900ms' }}>
                <div className="bg-[#1a002a]/60 backdrop-blur-md border border-purple-900/30 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20">
                  <h3 className="text-white font-medium text-xl sm:text-2xl mb-3 bg-gradient-to-r from-pink-200 to-purple-100 text-transparent bg-clip-text" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>2. Invite Collaborators</h3>
                  <p className="text-white text-sm sm:text-base font-medium">Share your session ID with teammates. They'll instantly connect to your drawing room in real-time.</p>
                </div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center relative group">
              <div className={`w-full md:w-1/2 pr-0 md:pr-16 text-center md:text-right transition-all duration-700 transform-gpu ${animate ? 'translate-x-0 opacity-100 rotate-y-0' : '-translate-x-10 opacity-0 rotate-y-10'} hover:translate-z-10 hover:scale-105`} style={{ transitionDelay: '1100ms' }}>
                <div className="bg-[#1a002a]/60 backdrop-blur-md border border-purple-900/30 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20">
                  <h3 className="text-white font-medium text-xl sm:text-2xl mb-3 bg-gradient-to-r from-pink-200 to-purple-100 text-transparent bg-clip-text" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>3. Create Together</h3>
                  <p className="text-white text-sm sm:text-base font-medium">Draw, sketch, and create together in perfect sync. Every stroke appears instantly for all participants.</p>
                </div>
              </div>
              
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10 scale-100 group-hover:scale-125 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#a855f7] to-[#7e22ce] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 animate-float" style={{ animationDelay: '1s' }}>
                  <span className="relative z-10 text-xl">3</span>
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-sm animate-ping opacity-75" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              
              <div className="w-full md:w-1/2 pl-0 md:pl-16 mt-6 md:mt-0 text-center md:text-left opacity-0">
                {/* Empty space for layout */}
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
            {[
              {
                title: 'Real-time Collaboration',
                description: 'Draw together with your team in real-time, no matter where they are.',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                  </svg>
                ),
                delay: 0
              },
              {
                title: 'Interactive Drawing Tools',
                description: 'Access brushes, shapes, and colors to bring your ideas to life.',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                ),
                delay: 200
              },
              {
                title: 'Secure Sessions',
                description: 'Create private drawing rooms with unique session IDs for your team.',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ),
                delay: 400
              }
            ].map((feature) => (
              <div 
                key={feature.title} 
                className={`bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-5 hover:border-purple-500/70 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/30 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${1400 + feature.delay}ms` }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-[#a855f7]/20 rounded-md mr-4">
                    <div className="text-[#a855f7]">{feature.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-base">{feature.title}</h3>
                    <p className="text-white text-xs mt-1 font-medium">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Version Section */}
          <div className="mt-32 mb-16 text-center">
            <div className={`transform-gpu ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000 ease-out delay-1500`}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 text-transparent bg-clip-text">
                  Try DrawWave Desktop
                </span>
                <span className="absolute -left-1 -top-1 text-[#a855f7]/10 blur-md">Try DrawWave Desktop</span>
              </h2>
              <p className="text-white text-base sm:text-lg max-w-2xl mx-auto font-medium mb-8">
                Experience enhanced performance and additional features with our desktop application
              </p>
              
              {/* Desktop Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8 px-4">
                <div className="bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-6 hover:border-purple-500/70 transition-all duration-300">
                  <h3 className="text-white text-lg font-semibold mb-2">Better Performance</h3>
                  <p className="text-white/80 text-sm">Experience smoother drawing and faster response times with native desktop performance</p>
                </div>
                <div className="bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-6 hover:border-purple-500/70 transition-all duration-300">
                  <h3 className="text-white text-lg font-semibold mb-2">Offline Support</h3>
                  <p className="text-white/80 text-sm">Continue drawing even without an internet connection and sync when back online</p>
                </div>
                <div className="bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-6 hover:border-purple-500/70 transition-all duration-300">
                  <h3 className="text-white text-lg font-semibold mb-2">Advanced Tools</h3>
                  <p className="text-white/80 text-sm">Access additional drawing tools and customization options exclusive to the desktop version</p>
                </div>
              </div>
              
              {/* Download Button */}
              <div className="flex justify-center space-x-4">
                <a
                  href="/downloads/DrawWave-Setup.exe"
                  download
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/30"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download for Windows
                </a>
                <a
                  href="#"
                  onClick={() => window.location.href = '/desktop'}
                  className="inline-flex items-center px-6 py-3 rounded-lg border border-purple-500/50 text-white font-medium hover:bg-purple-500/10 transition-all duration-300"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
          
          {/* Demo Video Section */}
          <div className="mt-32 mb-16">
            <div className={`text-center mb-8 transform-gpu ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000 ease-out delay-1500`}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 text-transparent bg-clip-text">
                  See DrawWave in Action
                </span>
                <span className="absolute -left-1 -top-1 text-[#a855f7]/10 blur-md">See DrawWave in Action</span>
              </h2>
              <p className="text-white text-base sm:text-lg max-w-2xl mx-auto font-medium">Watch our demo to see how easy it is to collaborate in real-time</p>
            </div>
            
            {/* Video container using direct iframe without any overlays */}
            <div className={`w-full max-w-4xl mx-auto transform-gpu ${animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'} transition-all duration-1000 ease-out delay-1600`}
                 style={{ aspectRatio: '16/9', marginBottom: '20px' }}>
                 
              {/* YouTube video - positioned as the only element */}
              <iframe 
                className="w-full h-full rounded-lg" 
                src={`https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0${autoplayVideo ? '&autoplay=1&mute=0' : ''}`} 
                title="DrawWave Demo" 
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
            
            {/* Decorative elements positioned separately */}
            <div className="relative max-w-4xl mx-auto w-full h-8 mt-4">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur-xl opacity-70 animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -right-8 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-70 animate-float"></div>
            </div>
            
            <div className={`flex justify-center mt-8 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-1000 ease-out delay-1800`} style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}>
              
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <p className={`absolute bottom-4 text-xs text-white/30 ${animate ? 'opacity-100' : 'opacity-0'} transition-all duration-1000 ease-out animation-delay-800`}>
        © {new Date().getFullYear()} DrawWave. All rights reserved.
      </p>
    </div>
  );
};

export default Home;
