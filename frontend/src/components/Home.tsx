import { useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface HomeProps {
  onStartRoom: () => void;
}

interface ScrollAnimationWrapperProps {
  children: ReactNode;
  animation: 'fade-in-up' | 'fade-in-left' | 'fade-in-right' | 'scale-in' | 'slide-up';
  delay?: string;
  threshold?: number;
  className?: string;
}

const ScrollAnimationWrapper = ({ children, animation, delay, threshold = 0.1, className = '' }: ScrollAnimationWrapperProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold });
  
  const animationClass = isVisible ? `animate-${animation}` : 'opacity-0';
  const delayClass = delay ? `delay-${delay}` : '';
  
  return (
    <div 
      // @ts-ignore - Tailwind dynamic classes
      className={`${animationClass} ${delayClass} ${className}`} 
      style={{ animationDelay: delay }} 
      ref={ref as React.RefObject<HTMLDivElement>}
    >
      {children}
    </div>
  );
};

const Home = ({ onStartRoom }: HomeProps) => {
  const [animate, setAnimate] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get auth context to check user authentication status
  const { isAuthenticated } = useAuth();
  
  // Animation frames reference
  const animationFrameRef = useRef<number | null>(null);
  
  // Track scroll position for animation effects
  const [scrollY, setScrollY] = useState(0);
  
  // Scroll handler to update position
  const handleScroll = () => {
    setScrollY(window.scrollY);
  };

  useEffect(() => {
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Start animations after component mounts
    setAnimate(true);
    
    // Setup matrix rain effect with scroll-based intensity
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
      // Clean up animation frame on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Remove scroll event listener
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect for matrix rain animation intensity based on scroll
  useEffect(() => {
    // Adjust matrix effect intensity based on scroll position
    const canvas = canvasRef.current;
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // The further down the page, the more transparent the matrix effect becomes
        const opacity = Math.max(0.05, 0.3 - (scrollY / 3000));
        ctx.globalAlpha = opacity;
      }
    }
  }, [scrollY]);

  // Function to scroll to demo section
  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center w-full relative overflow-x-hidden bg-black">
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
      <div className={`z-40 flex flex-col items-center justify-center text-center w-full max-w-5xl px-4 sm:px-6 md:px-8 min-h-screen transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} transition-all duration-1000 ease-out mx-auto`}>
        
        {/* Main title with 3D effect */}
        <div className={`relative ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} transition-all duration-1000 ease-out animation-delay-300 w-full flex justify-center`}>
          <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] font-bold mb-2 text-white transform-gpu animate-float-slow" style={{ textShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}>
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-purple-300 to-indigo-300 text-transparent bg-clip-text animate-gradient-x">DrawWave</span>
              <span className="absolute -left-1 -top-1 text-[#a855f7]/10 blur-sm">DrawWave</span>
              <span className="absolute -left-0.5 -top-0.5 text-[#8b5cf6]/20 blur-sm">DrawWave</span>
            </span>
          </h1>
        </div>
        
        {/* Subtitle */}
        <p className={`text-[#a855f7]/80 text-lg sm:text-xl md:text-2xl mb-8 ${animate ? 'opacity-100' : 'opacity-0'} transition-all duration-1000 ease-out animation-delay-400 animate-pulse-subtle`}>
          Introducing Collaborative Drawing
        </p>
        
        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 mt-8 mb-12 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-1000 ease-out animation-delay-500 w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto justify-center`}>
          {/* Start Session Button */}
          <button
            onClick={isAuthenticated ? onStartRoom : () => setShowAuthModal(true)}
            className="group relative px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-medium text-white bg-[#a855f7] hover:bg-[#9046d1] rounded-md transition-all duration-300 shadow-lg shadow-[#a855f7]/20 flex items-center justify-center min-w-[180px] sm:min-w-[200px] w-full sm:w-auto transform hover:scale-105 hover:-translate-y-1 active:translate-y-0 active:scale-95 animate-fade-in-up"
          >
            <span className="relative z-10 flex items-center">
              Start Session
            </span>
            {/* Button glow effect */}
            <span className="absolute inset-0 rounded-md overflow-hidden">
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine"></span>
              </span>
            </span>
          </button>

          {/* View Demo button */}
          <button
            onClick={scrollToDemo}
            className="group relative px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-medium text-white bg-transparent border border-[#a855f7]/50 hover:border-[#a855f7] rounded-md transition-all duration-300 flex items-center justify-center min-w-[180px] sm:min-w-[200px] w-full sm:w-auto transform hover:scale-105 hover:-translate-y-1 active:translate-y-0 active:scale-95 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <span className="relative z-10 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse-slow" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              View Demo
            </span>
            {/* Button hover glow */}
            <span className="absolute inset-0 rounded-md -z-10 transform bg-[#a855f7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </div>
        
        {/* Feature icons row with hover effects */}
        <div className={`flex justify-center gap-10 sm:gap-16 md:gap-24 mt-12 w-full ${animate ? 'opacity-100' : 'opacity-0'} transition-all duration-1000 ease-out animation-delay-700`}>
          {['Draw', 'Collab', 'Platform'].map((label, index) => (
            <div 
              key={label} 
              className="flex flex-col items-center group"
              style={{ animationDelay: `${400 + (index * 150)}ms` }}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border border-[#a855f7]/30 rounded-md flex items-center justify-center mb-2 sm:mb-3 transform transition-all duration-300 group-hover:border-[#a855f7]/60 group-hover:scale-110 group-hover:shadow-glow animate-fade-in-up`}
                   style={{ animationDelay: `${500 + (index * 200)}ms` }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                     className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-[#a855f7]/70 group-hover:text-[#a855f7] transition-all duration-300 ${animate ? 'animate-pulse-slow' : ''}`}
                     style={{ animationDelay: `${index * 0.5}s` }}>
                  {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />}
                  {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />}
                  {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" />}
                </svg>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-white/70 group-hover:text-white transition-colors duration-300 animate-fade-in-up"
                 style={{ animationDelay: `${600 + (index * 200)}ms` }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Hero Section End */}

      {/* How It Works Section */}
      <section id="how-it-works" className="min-h-screen w-full flex items-center justify-center py-16 sm:py-20 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimationWrapper animation="fade-in-up" className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 text-transparent bg-clip-text mb-4">How DrawWave Works</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#a855f7] to-[#7e22ce] mx-auto"></div>
            <p className="text-[#a855f7]/80 mt-4 max-w-2xl mx-auto">From start to finish, create stunning collaborative art in three simple steps</p>
          </ScrollAnimationWrapper>
          
          <div className="relative mt-20">
            {/* Connection Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/30 to-indigo-500/30 transform -translate-x-1/2 hidden md:block"></div>
            
            {/* Step 1 */}
            <div className="md:grid md:grid-cols-2 md:gap-8 mb-24 relative">
              <ScrollAnimationWrapper animation="fade-in-left" threshold={0.2} delay="200ms" className="md:text-right md:pr-8">
                <div className="bg-[#180028]/40 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-indigo-200 text-transparent bg-clip-text mb-3">1. Create a Session</h3>
                  <p className="text-white/70">Start your creative journey by creating a new drawing room. Get a unique session ID to share with your team.</p>
                </div>
              </ScrollAnimationWrapper>
              
              <div className="hidden md:flex items-center justify-start">
                <ScrollAnimationWrapper animation="scale-in" delay="400ms">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20 relative">
                    <span>1</span>
                    <div className="absolute -inset-1 rounded-full border-2 border-purple-400/30 animate-pulse-slow"></div>
                  </div>
                </ScrollAnimationWrapper>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="md:grid md:grid-cols-2 md:gap-8 mb-24 relative">
              <div className="hidden md:flex items-center justify-end">
                <ScrollAnimationWrapper animation="scale-in" delay="400ms">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20 relative">
                    <span>2</span>
                    <div className="absolute -inset-1 rounded-full border-2 border-purple-400/30 animate-pulse-slow"></div>
                  </div>
                </ScrollAnimationWrapper>
              </div>
              
              <ScrollAnimationWrapper animation="fade-in-right" threshold={0.2} delay="200ms" className="md:pl-8">
                <div className="bg-[#180028]/40 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-indigo-200 text-transparent bg-clip-text mb-3">2. Invite Collaborators</h3>
                  <p className="text-white/70">Share your session ID with teammates. They'll instantly connect to your drawing room in real-time.</p>
                </div>
              </ScrollAnimationWrapper>
            </div>
            
            {/* Step 3 */}
            <div className="md:grid md:grid-cols-2 md:gap-8 relative">
              <ScrollAnimationWrapper animation="fade-in-left" threshold={0.2} delay="200ms" className="md:text-right md:pr-8">
                <div className="bg-[#180028]/40 backdrop-blur-sm border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-indigo-200 text-transparent bg-clip-text mb-3">3. Create Together</h3>
                  <p className="text-white/70">Draw, sketch, and create together in perfect sync. Every stroke appears instantly for all participants.</p>
                </div>
              </ScrollAnimationWrapper>
              
              <div className="hidden md:flex items-center justify-start">
                <ScrollAnimationWrapper animation="scale-in" delay="400ms">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20 relative">
                    <span>3</span>
                    <div className="absolute -inset-1 rounded-full border-2 border-purple-400/30 animate-pulse-slow"></div>
                  </div>
                </ScrollAnimationWrapper>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section - full width section with ID for scrolling */}
      <section id="demo-section" className="min-h-screen w-full flex flex-col items-center justify-center py-16 sm:py-20 md:py-24">
        <ScrollAnimationWrapper animation="fade-in-up" className="w-full max-w-4xl px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 text-transparent bg-clip-text mb-2">See DrawWave in Action</h2>
            <div className="h-0.5 w-20 bg-gradient-to-r from-[#a855f7] to-[#7e22ce] mx-auto"></div>
            <p className="text-sm text-[#a855f7]/80 mt-3 mb-8">Watch how collaborative drawing brings teams together</p>
          </div>
        </ScrollAnimationWrapper>
        
        <ScrollAnimationWrapper animation="scale-in" delay="200ms" className="w-full max-w-4xl px-4 mb-8">
          {/* Video Player Container with Fancy Border */}
          <div className="relative rounded-lg overflow-hidden group perspective-500 transform hover:scale-[1.01] transition-all duration-500">
            {/* Animated Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#a855f7] via-[#7e22ce] to-[#a855f7] rounded-lg opacity-75 animate-gradient-x blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Video Container */}
            <div className="relative bg-[#0a001a] rounded-lg aspect-video overflow-hidden z-10">
              {/* Video UI - Placeholder for actual video */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Simulated Video Frame */}
                <div className="absolute inset-0 bg-[#0a001a] z-10 opacity-90">
                  {/* Simulated Drawing Canvas */}
                  <div className="absolute inset-4 rounded-md border border-purple-900/40 bg-gradient-to-br from-[#1a002a]/70 to-[#120020]/70 flex items-center justify-center">
                    {/* Drawing Elements */}
                    <div className="absolute top-1/4 left-1/3 w-20 h-20 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-sm animate-pulse-slow"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-32 h-16 rounded-full bg-gradient-to-r from-green-400/20 to-teal-400/20 blur-sm animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
                    <div className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-gradient-to-r from-pink-400/20 to-red-400/20 blur-sm animate-pulse-slow" style={{ animationDelay: '0.7s' }}></div>
                    
                    {/* Drawing Lines Animations */}
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M100,100 Q200,50 300,150 T500,120" 
                        fill="none" 
                        stroke="rgba(168, 85, 247, 0.4)" 
                        strokeWidth="2"
                        strokeDasharray="300"
                        strokeDashoffset="300"
                        className="animate-dash"
                      />
                      <path 
                        d="M150,200 C150,150 350,250 350,200 S500,100 600,200" 
                        fill="none" 
                        stroke="rgba(124, 58, 237, 0.4)" 
                        strokeWidth="2"
                        strokeDasharray="400"
                        strokeDashoffset="400"
                        className="animate-dash"
                        style={{ animationDelay: '1s' }}
                      />
                      <path 
                        d="M200,300 Q300,350 400,300 T600,350" 
                        fill="none" 
                        stroke="rgba(236, 72, 153, 0.4)" 
                        strokeWidth="2"
                        strokeDasharray="300"
                        strokeDashoffset="300"
                        className="animate-dash"
                        style={{ animationDelay: '2s' }}
                      />
                    </svg>
                    
                    {/* Cursors */}
                    <div className="absolute left-1/4 top-1/3 flex items-center animate-cursor-move-1">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-400 bg-transparent"></div>
                      <span className="ml-2 text-xs text-blue-400">User 1</span>
                    </div>
                    <div className="absolute right-1/3 bottom-1/4 flex items-center animate-cursor-move-2">
                      <div className="w-4 h-4 rounded-full border-2 border-green-400 bg-transparent"></div>
                      <span className="ml-2 text-xs text-green-400">User 2</span>
                    </div>
                  </div>
                  
                  {/* Control Bar */}
                  <div className="absolute bottom-0 inset-x-0 h-12 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center space-x-6">
                      <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="w-40 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-progress"></div>
                      </div>
                      <div className="text-xs text-white/70">1:23 / 3:45</div>
                    </div>
                  </div>
                </div>
                
                {/* Play Button Overlay */}
                <button className="w-16 h-16 rounded-full bg-gradient-to-r from-[#a855f7] to-[#7e22ce] flex items-center justify-center z-20 transform transition-transform duration-300 hover:scale-110 group-hover:scale-110 animate-float">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Label for Demo */}
                <div className="absolute top-4 right-4 bg-[#a855f7] px-2 py-0.5 rounded text-xs font-medium text-white z-20 animate-pulse-slow">LIVE DEMO</div>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>
        
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-4xl px-4">
          {[
            {
              title: 'Real-time Collaboration',
              description: 'Draw together with your team in real-time, no matter where they are.',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                </svg>
              ),
              animation: 'fade-in-left',
              delay: '400ms'
            },
            {
              title: 'Interactive Drawing Tools',
              description: 'Access brushes, shapes, and colors to bring your ideas to life.',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              ),
              animation: 'fade-in-up',
              delay: '600ms'
            },
            {
              title: 'Secure Sessions',
              description: 'Create private drawing rooms with unique session IDs for your team.',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              ),
              animation: 'fade-in-right',
              delay: '800ms'
            }
          ].map((feature) => (
            <ScrollAnimationWrapper
              key={feature.title}
              animation={feature.animation as any}
              delay={feature.delay}
              threshold={0.2}
            >
              <div className="bg-[#1a002a]/50 backdrop-blur-sm border border-purple-900/30 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-[#a855f7]/20 rounded-md mr-4">
                    <div className="text-[#a855f7]">{feature.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                    <p className="text-white/60 text-xs mt-1">{feature.description}</p>
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <p className={`absolute bottom-4 text-xs text-white/30 ${animate ? 'opacity-100' : 'opacity-0'} transition-all duration-1000 ease-out animation-delay-800`}>
        
      </p>
    </div>
  );
};


export default Home;
