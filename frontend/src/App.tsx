import VirtualPainter from './components/VirtualPainter';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">AI Virtual Painter</h1>
      <VirtualPainter />
    </div>
  );
}

export default App;
