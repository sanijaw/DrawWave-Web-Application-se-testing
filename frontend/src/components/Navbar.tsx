import { useState } from 'react';

interface NavbarProps {
  inSession: boolean;
  sessionId?: string;
  onLeaveRoom: () => void;
}

const Navbar = ({ inSession, sessionId, onLeaveRoom }: NavbarProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleLeaveRoom = () => {
    setShowConfirmation(false);
    onLeaveRoom();
    console.log('Leave room action confirmed');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 shadow-md relative">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">DrawWave</h1>
        </div>

        {/* Session ID and buttons - only visible when in session */}
        {inSession && (
          <div className="flex items-center gap-2">
            {/* Session ID display and copy button */}
            {sessionId && (
              <div className="flex items-center bg-indigo-800 rounded-md px-2 py-1">
                <div className="flex flex-col mr-2">
                  <span className="text-white text-xs font-medium">Session ID:</span>
                  <span className="text-indigo-200 text-sm font-semibold">{sessionId}</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(sessionId);
                    alert('Session ID copied to clipboard!');
                  }}
                  className="h-6 w-6 bg-indigo-700 hover:bg-indigo-600 rounded-full flex items-center justify-center" 
                  title="Copy Session ID"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              </div>
            )}
            
            {/* Leave Room button */}
            <button
              onClick={() => onLeaveRoom()}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm transition-colors duration-200 text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Leave Room
            </button>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal for Exit Session - simplified but kept for functionality */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Confirm Exit</h3>
            <p className="text-gray-600 mb-5">Are you sure you want to leave this drawing session?</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLeaveRoom}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
