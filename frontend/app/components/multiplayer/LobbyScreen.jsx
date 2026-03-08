'use client';

export default function LobbyScreen({ onPlayWithFriend, onPlayWithBot }) {
  return (
    <div className="w-full max-w-2xl px-4">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700">
        
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Meme Chess
          </h1>
          <p className="text-gray-400 text-lg">
            Choose your game mode
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Play with Friend */}
          <button
            onClick={onPlayWithFriend}
            className="group relative bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-2xl hover:from-blue-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Play with Friend
            </h3>
            <p className="text-blue-100 text-sm">
              Challenge a friend online
            </p>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Play with Bot */}
          <button
            onClick={onPlayWithBot}
            className="group relative bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Play with Bot
            </h3>
            <p className="text-green-100 text-sm">
              Practice against Stockfish
            </p>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-2">🎬</div>
            <p className="text-gray-400 text-xs">Meme Reactions</p>
          </div>
          <div>
            <div className="text-3xl mb-2">📊</div>
            <p className="text-gray-400 text-xs">Live Analysis</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎵</div>
            <p className="text-gray-400 text-xs">Background Music</p>
          </div>
        </div>
      </div>
    </div>
  );
}