'use client';
import MultiplayerGameContainer from './MultiplayerGameContainer';

export default function MultiplayerGame({ roomId, playerColor, onBack }) {
  return (
    <div className="w-full relative">
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={onBack}
          className="bg-gray-800/90 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
        >
          ← Leave Game
        </button>
      </div>

      <MultiplayerGameContainer 
        roomId={roomId} 
        playerColor={playerColor} 
      />
    </div>
  );
}