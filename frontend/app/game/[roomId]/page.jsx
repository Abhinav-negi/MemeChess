'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { getSocket } from '@/app/lib/socket';
import MultiplayerGameContainer from '@/app/components/multiplayer/MultiplayerGameContainer';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const roomId = params.roomId;
  const [playerColor, setPlayerColor] = useState(null);
  const [initialFEN, setInitialFEN] = useState(null);  // ✅ ADD THIS
  const [isReconnecting, setIsReconnecting] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;
    
    if (!user) {
      router.push('/');
      return;
    }

    const socket = getSocket();
    
    console.log('🔄 GamePage: Attempting to join/reconnect to room:', roomId);
    
    const savedGame = localStorage.getItem('currentGame');
    if (savedGame) {
      const { roomId: savedRoomId, playerColor: savedColor } = JSON.parse(savedGame);
      
      if (savedRoomId === roomId) {
        console.log('📦 Found saved game data:', { roomId, playerColor: savedColor });
        setPlayerColor(savedColor);
        socket.emit('reconnect_game', roomId);
        return;
      }
    }
    
    console.log('🆕 No saved game, emitting join_game');
    socket.emit('join_game', roomId);
    
  }, [user, loading, roomId, router, mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    const socket = getSocket();
    
    socket.on('game_reconnected', (data) => {
      console.log('✅ Reconnected:', data);
      setPlayerColor(data.yourColor);
      setInitialFEN(data.fen);  // ✅ CAPTURE THE FEN!
      setIsReconnecting(false);
      
      localStorage.setItem('currentGame', JSON.stringify({
        roomId: data.roomId,
        playerColor: data.yourColor
      }));
    });
    
    socket.on('game_ready', (data) => {
      console.log('✅ Game ready:', data);
      setPlayerColor(data.yourColor);
      setInitialFEN(null);  // ✅ New game, no FEN needed
      setIsReconnecting(false);
      
      localStorage.setItem('currentGame', JSON.stringify({
        roomId: data.roomId,
        playerColor: data.yourColor
      }));
    });
    
    socket.on('error', (message) => {
      console.error('❌ Error:', message);
      setError(message);
      setIsReconnecting(false);
    });
    
    return () => {
      socket.off('game_reconnected');
      socket.off('game_ready');
      socket.off('error');
    };
  }, [roomId, mounted]);

  const handleLeaveGame = () => {
    localStorage.removeItem('currentGame');
    router.push('/');
  };

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {error}
            </h2>
            <button
              onClick={handleLeaveGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Connecting to Game
            </h2>
            <p className="text-gray-400">
              Room: {roomId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!playerColor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-white text-xl">Waiting for game data...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <MultiplayerGameContainer
        roomId={roomId}
        playerColor={playerColor}
        initialFEN={initialFEN}  // ✅ PASS THE FEN!
        onBack={handleLeaveGame}
      />
    </div>
  );
}