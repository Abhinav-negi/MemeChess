'use client';
import { useState, useEffect } from 'react';
import GameContainer from './GameContainer';
import LobbyScreen from './multiplayer/LobbyScreen';
// import CreateGameScreen from './components/multiplayer/CreateGameScreen';
import CreateGameScreen from './multiplayer/CreateGameScreen';
import JoinGameScreen from './multiplayer/JoinGameScreen';
import MultiplayerGame from './multiplayer/MultiplayerGame';
import { createGame } from '../lib/socket';
// import { createGame } from './lib/socket';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
// import { AuthProvider } from '../contexts/AuthContext';
import AuthScreen from './auth/AuthScreen';
import BotSelectionScreen from './bot/BotSelectionScreen';

// ============================================
// INNER COMPONENT - The actual game logic
// This component can use useAuth() hook
// ============================================
export default  function AppContent() {
  // Get user info from auth context
  const { user, loading } = useAuth();
  
  // Game mode state
  const [gameMode, setGameMode] = useState('menu');
  const [roomId, setRoomId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);

  // Auto-create game when entering create mode
  useEffect(() => {
    if (gameMode === 'create' && !roomId) {
      createGame((newRoomId) => {
        setRoomId(newRoomId);
      });
    }
  }, [gameMode, roomId]);

  // Reset to main menu
  const handleBackToMenu = () => {
    setGameMode('menu');
    setRoomId(null);
    setPlayerColor(null);
  };

  // Handle game ready (both players joined)
// Handle game ready (both players joined)
const handleGameReady = (color, room_id = null) => {
  console.log('🚀 handleGameReady called:', { color, room_id });
  
  // Save to localStorage
  localStorage.setItem('currentGame', JSON.stringify({
    roomId: room_id,
    playerColor: color
  }));
  
  // ✅ REDIRECT TO DEDICATED GAME PAGE
  window.location.href = `/game/${room_id}`;
};

  // ============================================
  // LOADING STATE
  // Show while checking if user is logged in
  // ============================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // ============================================
  // NOT LOGGED IN
  // Show login/signup screen
  // ============================================
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <AuthScreen />
      </div>
    );
  }

  // ============================================
  // LOGGED IN
  // Show the actual game
  // ============================================
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      {/* Main Menu - Choose game mode */}
      {gameMode === 'menu' && (
        <LobbyScreen 
          onPlayWithFriend={() => setGameMode('lobby')}
          onPlayWithBot={() => setGameMode('single-player')}
        />
      )}

      {/* Lobby - Create or Join */}
      {gameMode === 'lobby' && (
        <div className="w-full max-w-md px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <button
              onClick={handleBackToMenu}
              className="text-gray-400 hover:text-white transition-colors mb-4"
            >
              ← Back to Menu
            </button>
            
            <h2 className="text-3xl font-bold text-white text-center mb-6">
              Play with Friend
            </h2>

            <button
              onClick={() => setGameMode('create')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Create Game
            </button>

            <button
              onClick={() => setGameMode('join')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Join Game
            </button>
          </div>
        </div>
      )}

      {/* Single Player Mode */}
      {gameMode === 'single-player' && (
  <BotSelectionScreen 
    onBack={handleBackToMenu}
  />
)}

      {/* Waiting for opponent to join */}
      {gameMode === 'create' && (
        <CreateGameScreen 
          roomId={roomId}
          onGameReady={handleGameReady}
          onBack={handleBackToMenu}
        />
      )}

      {/* Join existing game */}
      {gameMode === 'join' && (
        <JoinGameScreen 
          onGameReady={handleGameReady}
          onBack={() => setGameMode('lobby')}
        />
      )}

      {/* Multiplayer game in progress */}
      {gameMode === 'playing' && (
        <MultiplayerGame 
          roomId={roomId}
          playerColor={playerColor}
          onBack={handleBackToMenu}
        />
      )}
    </div>
  );
}