'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import ChessBoardComponent from "../ChessBoardComponent";
import GameInfoPanel from "../GameInfoPanel";
import { getSocket } from "@/app/lib/socket";

export default function MultiplayerGameContainer({ roomId, playerColor, initialFEN }) {  // ✅ Accept initialFEN prop
  
  // ✅ Initialize game with FEN if provided
  const gameRef = useRef(initialFEN ? new Chess(initialFEN) : new Chess());
  const game = gameRef.current;

  const [position, setPosition] = useState(game.fen());
  const [isMyTurn, setIsMyTurn] = useState(playerColor === 'w');
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('');

  const socketRef = useRef(getSocket());

  // ✅ Update board when initialFEN changes (on reconnect)
  useEffect(() => {
    if (initialFEN) {
      console.log('📥 Loading reconnected game state:', initialFEN);
      gameRef.current = new Chess(initialFEN);
      setPosition(initialFEN);
      setIsMyTurn(gameRef.current.turn() === playerColor);
      
      // Rebuild move history from FEN
      const history = gameRef.current.history({ verbose: true });
      setMoveHistory(history);
    }
  }, [initialFEN, playerColor]);

  // Store room info in localStorage for reconnection
  useEffect(() => {
    if (roomId && playerColor) {
      localStorage.setItem('currentGame', JSON.stringify({ roomId, playerColor }));
    }
  }, [roomId, playerColor]);

  // Listen for opponent's moves
  useEffect(() => {
    const socket = socketRef.current;

    socket.on('move_made', ({ move, fen, isCheck, isCheckmate, isGameOver }) => {
      console.log('📥 Move received:', move);

      // Update local game state FIRST
      gameRef.current = new Chess(fen);
      setPosition(fen);

      // Add to history
      setMoveHistory(prev => [...prev, move]);

      // NOW check whose turn it is (after updating game)
      const currentTurn = gameRef.current.turn(); // 'w' or 'b'
      const myTurn = currentTurn === playerColor;

      console.log('🎯 Turn check:', {
        currentTurn,
        playerColor,
        isMyTurn: myTurn
      });

      setIsMyTurn(myTurn);

      // Update status
      if (isCheckmate) {
        const winner = currentTurn === 'w' ? 'Black' : 'White';
        setGameStatus(winner === (playerColor === 'w' ? 'White' : 'Black') ? 'You won!' : 'You lost!');
      } else if (isGameOver) {
        setGameStatus('Game Over - Draw');
      } else if (isCheck) {
        setGameStatus('Check!');
      } else {
        setGameStatus('');
      }
    });

    socket.on('error', (message) => {
      console.error('❌ Server error:', message);
      alert(message);
    });

    socket.on('opponent_disconnected', () => {
      alert('Opponent disconnected');
      setGameStatus('Opponent left the game');
    });

    socket.on('opponent_reconnected', () => {
      console.log('✅ Opponent reconnected');
      setGameStatus('Opponent reconnected');
      setTimeout(() => setGameStatus(''), 2000);
    });

    return () => {
      socket.off('move_made');
      socket.off('error');
      socket.off('opponent_disconnected');
      socket.off('opponent_reconnected');
    };
  }, [roomId, playerColor]);

  // Handle move attempt
  const updateGame = useCallback((updatedGame) => {
    console.log('🎯 Move attempt:', {
      isMyTurn,
      playerColor,
      currentTurn: game.turn()
    });

    // Block if not your turn
    if (!isMyTurn) {
      console.log('⏸️ Blocked - Not your turn');
      alert('Not your turn!');
      return false;
    }

    // Block if game over
    if (game.isGameOver()) {
      return false;
    }

    // Get the last move
    const history = updatedGame.history({ verbose: true });
    const lastMove = history[history.length - 1];

    if (!lastMove) return false;

    // Send move to server
    const socket = socketRef.current;
    socket.emit('make_move', {
      roomId: roomId,
      move: {
        from: lastMove.from,
        to: lastMove.to,
        promotion: lastMove.promotion
      }
    });

    console.log('📤 Sent move to server:', lastMove);

    // Don't update locally yet - wait for server confirmation
    return false;
  }, [isMyTurn, game, roomId]);

  const resetGame = useCallback(() => {
    if (confirm('Leave this game?')) {
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="w-screen min-h-screen flex flex-col lg:flex-row justify-center items-center gap-6 p-4 bg-zinc-900">
      
      <div className="flex-shrink-0 relative">
        {/* Turn indicator */}
        <div className="absolute -top-16 left-0 right-0 text-center">
          <div className={`inline-block px-6 py-3 rounded-lg font-bold text-lg ${
            isMyTurn 
              ? 'bg-green-600 text-white animate-pulse' 
              : 'bg-gray-700 text-gray-400'
          }`}>
            {isMyTurn ? '🟢 YOUR TURN' : '⏳ Opponent\'s Turn'}
          </div>
        </div>

        <div className="w-[min(90vw,600px)] aspect-square relative">
          <ChessBoardComponent
            game={game}
            position={position}
            updateGame={updateGame}
            boardOrientation={playerColor === 'w' ? 'white' : 'black'}
          />
        </div>

        {/* Status messages */}
        {gameStatus && (
          <div className="absolute -bottom-16 left-0 right-0 text-center">
            <div className="inline-block px-6 py-3 rounded-lg font-bold text-lg bg-yellow-600 text-white">
              {gameStatus}
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-md lg:w-96 flex flex-col gap-4">
        
        {/* Game Info */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-4 text-white">
          <GameInfoPanel
            game={game}
            onReset={resetGame}
          />
        </div>

        {/* Player info */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-white text-sm mb-2 font-semibold">
            Game Info
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Room:</span>
              <span className="font-mono">{roomId}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>You are:</span>
              <span>{playerColor === 'w' ? 'White ⚪' : 'Black ⚫'}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Turn:</span>
              <span>{game.turn() === 'w' ? 'White' : 'Black'}</span>
            </div>
          </div>
        </div>

        {/* Move history */}
        {moveHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="text-white text-sm font-semibold mb-2">
              Move History
            </div>
            <div className="space-y-1">
              {moveHistory.map((move, i) => (
                <div key={i} className="text-gray-300 text-xs font-mono">
                  {Math.floor(i / 2) + 1}. {move.san}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
