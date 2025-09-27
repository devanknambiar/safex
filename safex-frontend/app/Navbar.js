export default function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
      <div className="mx-4 p-2.5 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center font-bold text-slate-900">
              W
            </div>
            <span className="font-semibold text-white">Wearable Monitor</span>
          </div>
          <a href="/login" className="bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 text-white font-medium py-1.5 px-4 rounded-full text-sm transition-colors duration-300 cursor-pointer">
            Login
          </a>
        </div>
      </div>
    </nav>
  );
}