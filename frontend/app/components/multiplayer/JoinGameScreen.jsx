'use client';
import { useState, useEffect } from 'react';
import { getSocket } from '@/app/lib/socket';

export default function JoinGameScreen({ onGameReady, onBack }) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

useEffect(() => {
  const socket = getSocket();

  console.log('🎧 JoinGameScreen: Setting up listeners');

  const handleGameReady = (data) => {
    console.log('🎉 JoinGameScreen: game_ready received:', data);
    
    // Save to localStorage
    localStorage.setItem('currentGame', JSON.stringify({
      roomId: data.roomId,
      playerColor: data.yourColor
    }));
    
    // ✅ REDIRECT TO GAME PAGE
    window.location.href = `/game/${data.roomId}`;
  };

  const handleError = (message) => {
    console.error('❌ JoinGameScreen: Error:', message);
    setError(message);
    setIsJoining(false);
  };

  socket.on('game_ready', handleGameReady);
  socket.on('error', handleError);

  // Check URL for join code
  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get('join');
  if (joinCode) {
    console.log('📎 Auto-filling code from URL:', joinCode);
    setRoomCode(joinCode);
  }

  return () => {
    socket.off('game_ready', handleGameReady);
    socket.off('error', handleError);
  };
}, []);

  const handleJoin = () => {
    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    console.log('📤 JoinGameScreen: Emitting join_game:', roomCode);
    setError('');
    setIsJoining(true);
    
    const socket = getSocket();
    socket.emit('join_game', roomCode);
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toLowerCase().slice(0, 6);
    setRoomCode(value);
    setError('');
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Join Game
          </h2>
          <p className="text-gray-400">
            Enter the 6-character room code
          </p>
        </div>

        {/* Room code input */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm block mb-2">
            Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={handleInputChange}
            placeholder="abc123"
            maxLength={6}
            className="w-full bg-gray-700 text-white text-2xl font-mono text-center px-4 py-4 rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:outline-none tracking-widest uppercase transition-colors"
            autoFocus
            disabled={isJoining}
          />
          
          {/* Character count */}
          <div className="text-right mt-2">
            <span className={`text-sm ${roomCode.length === 6 ? 'text-green-400' : 'text-gray-500'}`}>
              {roomCode.length}/6
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={roomCode.length !== 6 || isJoining}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
        >
          {isJoining ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Joining...
            </span>
          ) : (
            'Join Game'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-800 text-gray-400">or</span>
          </div>
        </div>

        {/* Create game instead */}
        <button
          onClick={() => window.location.href = window.location.pathname}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          Create New Game
        </button>
      </div>
    </div>
  );
}