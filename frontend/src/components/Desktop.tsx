// No React import needed with modern JSX transform
import { useNavigate } from 'react-router-dom';

const Desktop = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-[#1a002a]/70 backdrop-blur-md border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="text-white font-bold text-xl flex items-center"
            >
              <span className="text-purple-500">Draw</span>
              <span>Wave</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8">
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 text-transparent bg-clip-text">
              DrawWave Desktop
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Experience the full power of DrawWave with our native desktop application.
            Unlock advanced features, better performance, and offline capabilities.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Enhanced Performance</h3>
            <ul className="space-y-3 text-gray-300">
              <li>• Native hardware acceleration</li>
              <li>• Reduced latency in drawing</li>
              <li>• Optimized memory usage</li>
              <li>• Faster startup times</li>
            </ul>
          </div>

          <div className="bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Offline Support</h3>
            <ul className="space-y-3 text-gray-300">
              <li>• Work without internet connection</li>
              <li>• Automatic sync when online</li>
              <li>• Local file saving</li>
              <li>• Backup and restore features</li>
            </ul>
          </div>

          <div className="bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Advanced Tools</h3>
            <ul className="space-y-3 text-gray-300">
              <li>• Additional brush types</li>
              <li>• Custom canvas sizes</li>
              <li>• Layer support</li>
              <li>• Export in multiple formats</li>
            </ul>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-[#1a002a]/70 backdrop-blur-md border border-purple-900/50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">System Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Minimum Requirements</h3>
              <ul className="space-y-3 text-gray-300">
                <li>• Windows 10 64-bit</li>
                <li>• 4GB RAM</li>
                <li>• 2GHz Dual Core Processor</li>
                <li>• 500MB Free Disk Space</li>
                <li>• DirectX 11 Compatible Graphics</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Recommended</h3>
              <ul className="space-y-3 text-gray-300">
                <li>• Windows 10/11 64-bit</li>
                <li>• 8GB RAM</li>
                <li>• 2.5GHz Quad Core Processor</li>
                <li>• 1GB Free Disk Space</li>
                <li>• Dedicated Graphics Card</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-6">
              Download DrawWave Desktop now and experience drawing like never before.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
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
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-3 rounded-lg border border-purple-500/50 text-white font-medium hover:bg-purple-500/10 transition-all duration-300"
              >
                Back to Web Version
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a002a]/70 backdrop-blur-md border-t border-purple-900/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-400">
            © {new Date().getFullYear()} DrawWave. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Desktop;
