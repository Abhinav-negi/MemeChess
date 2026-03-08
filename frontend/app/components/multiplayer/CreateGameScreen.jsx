'use client';
import { useEffect, useState, useRef } from 'react';
import { getSocket } from '@/app/lib/socket';

export default function CreateGameScreen({ roomId, onGameReady, onBack }) {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const listenerSetup = useRef(false);  // ✅ Prevent double setup

useEffect(() => {
  const link = `${window.location.origin}?join=${roomId}`;
  setInviteLink(link);

  const socket = getSocket();
  
  console.log('🎧 CreateGameScreen: Setting up game_ready listener');
  
  const handleGameReady = (data) => {
    console.log('🎉 CreateGameScreen: game_ready received:', data);
    
    // Save to localStorage
    localStorage.setItem('currentGame', JSON.stringify({
      roomId: data.roomId,
      playerColor: data.yourColor
    }));
    
    // ✅ REDIRECT TO GAME PAGE
    window.location.href = `/game/${data.roomId}`;
  };
  
  socket.on('game_ready', handleGameReady);

  return () => {
    socket.off('game_ready', handleGameReady);
  };
}, [roomId]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-lg px-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
        >
          <span>←</span> Cancel
        </button>

        {/* Waiting animation */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">⏳</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Waiting for Opponent
          </h2>
          <p className="text-gray-400">
            Share the code or link below
          </p>
        </div>

        {/* Room Code */}
        <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
          <label className="text-gray-400 text-sm block mb-2">
            Room Code
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-700 rounded-lg px-4 py-3 font-mono text-2xl text-center text-white tracking-widest">
              {roomId}
            </div>
            <button
              onClick={() => copyToClipboard(roomId, 'code')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              {copied === 'code' ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Invite Link */}
        <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
          <label className="text-gray-400 text-sm block mb-2">
            Invite Link
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-700 rounded-lg px-4 py-3 text-sm text-white truncate">
              {inviteLink}
            </div>
            <button
              onClick={() => copyToClipboard(inviteLink, 'link')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              {copied === 'link' ? '✓' : '🔗'}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://wa.me/?text=Join my chess game: ${inviteLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
          >
            <span className="text-xl">💬</span>
            WhatsApp
          </a>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Join my chess game',
                  text: `Room code: ${roomId}`,
                  url: inviteLink
                });
              } else {
                copyToClipboard(inviteLink, 'link');
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">📤</span>
            Share
          </button>
        </div>

        {/* Status indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Waiting for player...</span>
          </div>
        </div>
      </div>
    </div>
  );
}