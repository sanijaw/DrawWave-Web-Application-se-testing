/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      perspective: {
        '500': '500px',
        '1000': '1000px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
      translate: {
        'z-4': '4px',
        'z-8': '8px',
        'z-[-4px]': '-4px',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.6s ease-out forwards',
        'fade-in-right': 'fadeInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.7s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'shimmer-slow': 'shimmer 3s linear infinite', 
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'gradient-x': 'gradient-x 5s ease infinite',
        'shine': 'shine 1.5s ease-in-out infinite',
        'typing': 'typing 3.5s steps(35, end)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'shine': {
          '0%': { transform: 'translateX(-100%)' },
          '50%, 100%': { transform: 'translateX(100%)' }
        },
        'typing': {
          'from': { width: '0' },
          'to': { width: '100%' }
        },
      },
      backgroundImage: {
        'shimmer': 'linear-gradient(to right, transparent 0%, rgba(99, 102, 241, 0.1) 20%, rgba(168, 85, 247, 0.2) 40%, rgba(99, 102, 241, 0.1) 60%, transparent 80%)',
      },
      dropShadow: {
        'glow-purple': '0 0 8px rgba(168, 85, 247, 0.5)',
        'glow-indigo': '0 0 8px rgba(99, 102, 241, 0.5)',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(168, 85, 247, 0.5)',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
    },
  },
  plugins: [],
  // Add classes for animation delays
  safelist: [
    'animation-delay-300',
    'animation-delay-600',
    'animation-delay-900',
  ],
}