import { useState, useEffect, useRef } from 'react';

interface HomeProps {
  onStartRoom: () => void;
}

const Home = ({ onStartRoom }: HomeProps) => {
  const [animate, setAnimate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation frames reference
  const animationFrameRef = useRef<number | null>(null);
  
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
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-black">
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
      <div className={`z-40 flex flex-col items-center justify-center text-center max-w-3xl px-6 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} transition-all duration-1000 ease-out`}>

        
        {/* Main title with 3D effect */}
        <div className={`relative ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} transition-all duration-1000 ease-out animation-delay-300`}>
          <h1 className="text-[3.5rem] sm:text-[5rem] font-bold mb-2 text-white transform-gpu" style={{ textShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}>
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-purple-300 to-indigo-300 text-transparent bg-clip-text">DrawWave</span>
              <span className="absolute -left-1 -top-1 text-[#a855f7]/10 blur-sm">DrawWave</span>
              <span className="absolute -left-0.5 -top-0.5 text-[#8b5cf6]/20 blur-sm">DrawWave</span>
            </span> 
            <span className="bg-gradient-to-r from-[#a855f7] to-[#c084fc] text-transparent bg-clip-text relative inline-block">
            </span>
          </h1>
        </div>
        
        {/* Subtitle line with typing animation */}
        <div className="h-5 mb-6">
          <p className={`text-sm text-[#a855f7] tracking-wider overflow-hidden whitespace-nowrap ${animate ? 'animate-typing border-r-2 border-[#a855f7]' : 'w-0'}`} style={{ animationDelay: '1s', maxWidth: '35ch' }}>
            Introducing Collaborative Drawing
          </p>
        </div>
        
        {/* Button with 3D effect */}
        <div className={`mt-12 mb-24 perspective-500 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-1000 ease-out animation-delay-600`}>
          <button 
            onClick={onStartRoom}
            className="group relative px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:from-[#9f67fc] hover:to-[#c084fc] rounded-md transition-transform duration-300 shadow-lg shadow-[#a855f7]/20 flex items-center justify-center w-40 transform hover:scale-105 hover:-translate-y-1 active:translate-y-0 active:scale-95"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <span className="relative z-10">Start Session</span>
            {/* Button glow effect */}
            <span className="absolute inset-0 rounded-md overflow-hidden">
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine"></span>
              </span>
            </span>
            {/* 3D button effect */}
            <span className="absolute inset-0 rounded-md -z-10 transform translate-z-[-4px] bg-gradient-to-r from-[#7d4ed7] to-[#954bd7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </div>
        
        {/* Bottom icons row with hover effects */}
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
        
        {/* Footer */}
        <p className={`absolute bottom-4 text-xs text-white/30 ${animate ? 'opacity-100' : 'opacity-0'} transition-all duration-1000 ease-out animation-delay-800`}>
          
        </p>
      </div>
    </div>
  );
};

export default Home;
