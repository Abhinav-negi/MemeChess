'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import GameContainer from '@/app/components/GameContainer';

const BOT_CONFIG = {
  beginner: { 
    name: 'Chill Guy', 
    elo: 300, 
    emoji: '😎', 
    img: '/assets/bot/bot1.png', 
    thinkTime: 500,
    multiPV: 5,  // ✅ Pick 5th best move
    pickMove: 5  // ✅ Use 5th option
  },
  easy: { 
    name: 'Penguin', 
    elo: 800, 
    emoji: '🐧', 
    img: '/assets/bot/bot2.png', 
    thinkTime: 1000,
    multiPV: 4,  // ✅ Pick 4th best move
    pickMove: 4
  },
  medium: { 
    name: 'Puppy', 
    elo: 1300, 
    emoji: '🐶', 
    img: '/assets/bot/bot3.png', 
    thinkTime: 2000,
    multiPV: 3,  // ✅ Pick 3rd best move
    pickMove: 3
  },
  hard: { 
    name: 'GothamChess', 
    elo: 1800, 
    emoji: '♟️', 
    img: '/assets/bot/bot4.png', 
    thinkTime: 3000,
    multiPV: 2,  // ✅ Pick 2nd best move
    pickMove: 2
  },
  master: { 
    name: 'Mikhail Tal', 
    elo: 2700, 
    emoji: '👑', 
    img: '/assets/bot/bot5.jpg', 
    thinkTime: 5000,
    multiPV: 1,  // ✅ Pick best move
    pickMove: 1
  }
};

export default function BotGamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  const difficulty = params.difficulty;
  const playerColor = searchParams.get('color') || 'white';  // ✅ GET COLOR
  const botConfig = BOT_CONFIG[difficulty];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;
    
    if (!user) {
      router.push('/');
      return;
    }

    if (!botConfig) {
      router.push('/');
      return;
    }
  }, [mounted, loading, user, botConfig, router]);

  const handleBack = () => {
    router.push('/');
  };

  if (!mounted || loading || !user || !botConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-900 relative">
      {/* Header - Desktop only */}
      <div className="hidden md:flex absolute top-4 left-4 right-4 z-10 justify-between items-center">
        <button
          onClick={handleBack}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Back
        </button>

        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-6 py-3 border border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{botConfig.emoji}</span>
            <div>
              <div className="text-white font-bold">{botConfig.name}</div>
              <div className="text-gray-400 text-sm">{botConfig.elo} ELO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <GameContainer 
        botDifficulty={botConfig}
        playerColor={playerColor}  // ✅ PASS COLOR
        showBackButton={false}
      />
    </div>
  );
}