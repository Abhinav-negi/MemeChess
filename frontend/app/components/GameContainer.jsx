"use client";

import Engine from "../lib/engine";
import { useEffect, useState, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import ChessBoardComponent from "./ChessBoardComponent";
import GameInfoPanel from "./GameInfoPanel";
import MemeOverlay from "./MemeOverlay";
import { selectMeme, shouldShowMeme } from "../lib/memeConfig";
import { soundManager } from "../lib/soundManager";

export default function GameContainer() {
const gameRef = useRef(
  typeof window !== "undefined" && localStorage.getItem("chess-game")
    ? new Chess(localStorage.getItem("chess-game"))
    : new Chess()
);

const game = gameRef.current;
const [position, setPosition] = useState(() => game.fen());

const [evaluation, setEvaluation] = useState(0);
const [mate, setMate] = useState(null);
const [engineStatus, setEngineStatus] = useState("Initializing...");
const [depth, setDepth] = useState(0);
const [bestLine, setBestLine] = useState("");
const [moveQuality, setMoveQuality] = useState(null);
const checkStateRef = useRef({ isCheck: false, isCheckmate: false });

// Analyzing state
const [isAnalyzing, setIsAnalyzing] = useState(false);

// Meme system state
const [currentMemes, setCurrentMemes] = useState([]); // Array of memes to show
const [isPlayingMeme, setIsPlayingMeme] = useState(false);
const [blunderCount, setBlunderCount] = useState(0);
const [boardSize, setBoardSize] = useState(600);
const [isMusicEnabled, setIsMusicEnabled] = useState(true);

// Game state tracking
const [consecutiveChecks, setConsecutiveChecks] = useState(0);
const [hasShownPressure, setHasShownPressure] = useState({ 
  white: false, 
  black: false 
});
// Add this ref alongside the state
const hasShownPressureRef = useRef({ white: false, black: false });
// Keep state for UI if needed, but update ref whenever state updates
const updateHasShownPressure = useCallback((side) => {
  hasShownPressureRef.current = {
    ...hasShownPressureRef.current,
    [side]: true
  };
  setHasShownPressure(hasShownPressureRef.current);
}, []);
const [wasInCheckLastMove, setWasInCheckLastMove] = useState(false);

const previousEvalRef = useRef(null);
const currentEvalRef = useRef(0);
const playerWhoMovedRef = useRef(null);
const engineRef = useRef(null);
const lastMoveRef = useRef(null);

const analysisTurnRef = useRef('w');

// Configuration
const ANALYSIS_TIME_MS = 1000;
const MIN_DEPTH_REQUIRED = 12;

// Initialize sound manager and start background music
useEffect(() => {
  soundManager.init();
  
  const musicTimer = setTimeout(() => {
    soundManager.startBackgroundMusic();
  }, 1000);
  
  return () => clearTimeout(musicTimer);
}, []);

// Calculate board size for meme positioning
useEffect(() => {
  function updateSize() {
    const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9, 600);
    setBoardSize(size);
  }

  updateSize();
  window.addEventListener("resize", updateSize);
  return () => window.removeEventListener("resize", updateSize);
}, []);

  /**
   * Decide if we should show a meme based on move quality and evaluation
   */
  const triggerMemeIfNeeded = useCallback((quality, evalLoss) => {
    if (!lastMoveRef.current) return;

    const evalChange = Math.abs(evalLoss);
    const move = lastMoveRef.current;
    
    // Get current game state BEFORE checking for memes
    const isCheck = checkStateRef.current.isCheck;
    const isCheckmate = checkStateRef.current.isCheckmate;
    const isStalemate = gameRef.current.isStalemate();
    const isDraw = gameRef.current.isDraw();


    // Track consecutive checks
    if (isCheck) {
      setConsecutiveChecks(prev => prev + 1);
    } else {
      setConsecutiveChecks(0);
    }

    // Check if we should show meme (skip for normal moves)
    if (!isCheckmate && !isStalemate && !isCheck && !shouldShowMeme(evalChange, quality)) {
      console.log('⏭️ Skipping meme (eval change too small)');
      setWasInCheckLastMove(isCheck);
      return;
    }

    // Select appropriate meme(s)
    const memeResult = selectMeme({
      moveQuality: quality,
      move: move,
      game: gameRef.current,
      blunderCount: blunderCount,
      isCapture: !!move.captured,
      isCheck: isCheck,
      isCheckmate: isCheckmate,
      isStalemate: isStalemate,
      isDraw: isDraw,
      targetSquare: move.to,
      fromSquare: move.from,
      wasInCheck: wasInCheckLastMove,
      consecutiveChecks: consecutiveChecks,
      hasShownPressure: hasShownPressureRef.current,
      currentEvaluation: currentEvalRef.current,
    });

    if (memeResult) {
      console.log('🎬 Showing meme(s):', memeResult);
      
      // Pause background music during meme
      soundManager.pauseBackgroundMusic();
      
      // Handle single or multiple memes
      if (memeResult.type === 'single') {
        setCurrentMemes([{
          videoUrl: memeResult.videoUrl,
          square: memeResult.square,
          reason: memeResult.reason,
        }]);
      } else if (memeResult.type === 'multiple') {
        setCurrentMemes(memeResult.memes);
      }
      
      setIsPlayingMeme(true);
      
      // Mark pressure as shown if applicable
      if (memeResult.showOnceFor) {
  updateHasShownPressure(memeResult.showOnceFor);
}
    }

    setWasInCheckLastMove(isCheck);
  }, [game, blunderCount, consecutiveChecks, hasShownPressure, wasInCheckLastMove]);
const classifyMove = useCallback((evalLoss) => {
  const absLoss = Math.abs(evalLoss);

  if (absLoss <= 0.10) {
    return "Best Move! 🔥";
  } else if (absLoss <= 0.50) {
    return "Good Move ✓";
  } else if (absLoss <= 1.00) {
    return "Inaccuracy ⚠️";
  } else if (absLoss <= 2.50) {
    return "Mistake ❌";
  } else {
    return "Blunder!! 💥";
  }
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

  engineRef.current = new Engine();

  const handleMessage = (data) => {
    const { raw, positionEvaluation, possibleMate, depth, pv, bestMove } = data;

    if (raw === 'uciok' || raw === 'readyok') {
      setEngineStatus("Engine Ready ✅");
    } else if (raw.startsWith('info')) {
      setEngineStatus("Analyzing...");
      setIsAnalyzing(true);
    }

    if (depth) {
      setDepth(depth);
    }

    if (pv) {
      setBestLine(pv);
    }

    if (depth && depth >= MIN_DEPTH_REQUIRED) {
      if (positionEvaluation) {
        const rawEval = parseFloat(positionEvaluation) / 100;
        const turnWhenAnalyzed = analysisTurnRef.current;
        const evalFromWhitePOV = turnWhenAnalyzed === 'w' ? rawEval : -rawEval;

        console.log('📊 Evaluation Update:', {
          rawCP: positionEvaluation,
          rawEval: rawEval.toFixed(2),
          turnAnalyzed: turnWhenAnalyzed,
          finalEval: evalFromWhitePOV.toFixed(2),
          depth
        });

        currentEvalRef.current = evalFromWhitePOV;
        setEvaluation(evalFromWhitePOV);
        setMate(null);
      }

      if (possibleMate) {
        const mateIn = parseInt(possibleMate);
        const turnWhenAnalyzed = analysisTurnRef.current;
        const mateFromWhitePOV = turnWhenAnalyzed === 'w' ? mateIn : -mateIn;

        setMate(mateFromWhitePOV);
        currentEvalRef.current = mateFromWhitePOV > 0 ? 100 : -100;
        setEvaluation(mateFromWhitePOV > 0 ? 100 : -100);
      }
    }

    if (bestMove) {
      setEngineStatus("Analysis Complete ✅");
      setIsAnalyzing(false);

      // Calculate move quality
      if (previousEvalRef.current !== null && playerWhoMovedRef.current) {
        const prevEval = previousEvalRef.current;
        const currEval = currentEvalRef.current;
        const player = playerWhoMovedRef.current;

        console.log('🎯 Move Quality Analysis:', {
          player: player === 'w' ? 'White' : 'Black',
          evalBefore: prevEval.toFixed(2),
          evalAfter: currEval.toFixed(2),
          change: (currEval - prevEval).toFixed(2),
          depth: depth
        });

        let evalLoss;
        if (player === 'w') {
          evalLoss = prevEval - currEval;
        } else {
          evalLoss = currEval - prevEval;
        }

        console.log('📈 Eval Loss:', evalLoss.toFixed(2));

        const quality = classifyMove(evalLoss);
        setMoveQuality(quality);

        // Track blunders
        if (quality === "Blunder!! 💥") {
          setBlunderCount(prev => prev + 1);
        }

        // Trigger meme based on move quality
        triggerMemeIfNeeded(quality, evalLoss);
      }

      previousEvalRef.current = currentEvalRef.current;
      playerWhoMovedRef.current = null;
    }
  };

  engineRef.current.onMessage(handleMessage);

  return () => {
    if (engineRef.current) {
      engineRef.current.terminate();
    }
  };
}, [classifyMove]);

// Start analysis when position changes
useEffect(() => {
  // ✅ CRITICAL FIX: Don't analyze if game is over
  if (game.isGameOver()) {
    setIsAnalyzing(false);
    setEngineStatus("Game Over");
    
    if (engineRef.current) {
      engineRef.current.stop();
    }
    
    return;
  }

  if (!engineRef.current || !engineRef.current.isReady) return;

  setMoveQuality(null);
  setIsAnalyzing(true);

  analysisTurnRef.current = game.turn();

  console.log('🔍 Starting analysis for position, turn:', game.turn());

  engineRef.current.stop();
  engineRef.current.evaluatePositionTimed(position, ANALYSIS_TIME_MS);
}, [position, game]);



const updateGame = useCallback((updatedGame) => {
  // Block moves while meme is playing
  if (isPlayingMeme) {
    console.log('⏸️ Move blocked - meme is playing');
    return false;
  }
    // Capture check state RIGHT NOW while game state is fresh
  checkStateRef.current = {
    isCheck: updatedGame.isCheck(),
    isCheckmate: updatedGame.isCheckmate()
  };
    // Fire sounds IMMEDIATELY when move is made
    if (updatedGame.isCheckmate()) {
      soundManager.play('checkmate');
    } else if (updatedGame.isCheck()) {
      soundManager.play('check');
    }  

  playerWhoMovedRef.current = game.turn();

  console.log('🎯 Move made by:', playerWhoMovedRef.current === 'w' ? 'White' : 'Black');
  console.log('📍 Eval before move:', previousEvalRef.current?.toFixed(2));

  // Store move details for meme selection
  const history = updatedGame.history({ verbose: true });
  lastMoveRef.current = history[history.length - 1];

  gameRef.current = updatedGame;
  const newPosition = updatedGame.fen();
  setPosition(newPosition);

  localStorage.setItem("chess-game", newPosition);

  if (engineRef.current) {
    engineRef.current.stop();
  }

  setBestLine("");

  return true;
}, [game, isPlayingMeme]);

const resetGame = useCallback(() => {
  const freshGame = new Chess();
  gameRef.current = freshGame;
  setPosition(freshGame.fen());
  localStorage.removeItem("chess-game");

  previousEvalRef.current = null;
  currentEvalRef.current = 0;
  playerWhoMovedRef.current = null;
  analysisTurnRef.current = 'w';
  lastMoveRef.current = null;
  setMoveQuality(null);
  setEvaluation(0);
  setMate(null);
  setBestLine("");
  setDepth(0);
  setIsAnalyzing(false);
  setBlunderCount(0);
  setCurrentMemes([]);
  setIsPlayingMeme(false);
  setConsecutiveChecks(0);
  hasShownPressureRef.current = { white: false, black: false };
setHasShownPressure({ white: false, black: false });
  setWasInCheckLastMove(false);
}, []);

/**
 * Handle meme completion (single meme finished)
 */
const handleMemeComplete = useCallback((memeIndex) => {
  console.log('✅ Meme playback complete:', memeIndex);
  
  setCurrentMemes(prev => {
    const updated = [...prev];
    updated.splice(memeIndex, 1);
    
    // If all memes are done, resume music
    if (updated.length === 0) {
      setIsPlayingMeme(false);
      soundManager.resumeBackgroundMusic();
    }
    
    return updated;
  });
}, []);

/**
 * Toggle background music on/off
 */
const toggleMusic = useCallback(() => {
  const newState = soundManager.toggleBackgroundMusic();
  setIsMusicEnabled(newState);
}, []);

const getDisplayEvaluation = useCallback(() => {
  if (mate !== null) {
    const side = mate > 0 ? 'White' : 'Black';
    return `${side} mates in ${Math.abs(mate)}`;
  }

  const sign = evaluation >= 0 ? '+' : '';
  return `${sign}${evaluation.toFixed(2)}`;
}, [evaluation, mate]);

const getEvaluationBarWidth = useCallback(() => {
  if (mate !== null) {
    return mate > 0 ? 100 : 0;
  }

  const clamped = Math.max(-5, Math.min(5, evaluation));
  return ((clamped + 5) / 10) * 100;
}, [evaluation, mate]);

const getBestMoveArrow = useCallback(() => {
  if (!bestLine) return null;

  const moves = bestLine.split(' ');
  const bestMove = moves[0];

  if (bestMove && bestMove.length >= 4) {
    return {
      from: bestMove.substring(0, 2),
      to: bestMove.substring(2, 4)
    };
  }

  return null;
}, [bestLine]);

return (
  <div className="w-screen min-h-screen flex flex-col lg:flex-row justify-center items-center gap-6 p-4 bg-zinc-900">
    <div className="flex-shrink-0 relative">
      <div className="w-[min(90vw,600px)] aspect-square relative">
        <ChessBoardComponent
          game={game}
          position={position}
          updateGame={updateGame}
          bestMoveArrow={getBestMoveArrow()}
        />

        {/* Meme Overlays - can show multiple simultaneously */}
        {currentMemes.map((meme, index) => (
          <MemeOverlay
            key={`${meme.square}-${meme.reason}-${index}`}
            memeData={meme}
            onComplete={() => handleMemeComplete(index)}
            boardSize={boardSize}
          />
        ))}
      </div>

      {/* Analyzing indicator - HIDE when game is over */}
      {isAnalyzing && !game.isGameOver() && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-yellow-400 px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
          <span>Analyzing depth {depth}...</span>
        </div>
      )}

      {/* Meme playing indicator */}
      {isPlayingMeme && (
        <div className="absolute bottom-4 left-4 bg-purple-600 bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm font-bold">
          🎬 {currentMemes.length} Meme{currentMemes.length > 1 ? 's' : ''} Playing...
        </div>
      )}

      {/* Music toggle button */}
      <button
        onClick={toggleMusic}
        className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-mono hover:bg-opacity-90 transition-all"
        title={isMusicEnabled ? "Mute Music" : "Unmute Music"}
      >
        {isMusicEnabled ? "🔊 Music On" : "🔇 Music Off"}
      </button>
    </div>

    <div className="w-full max-w-md lg:w-96 flex flex-col gap-4">
      <div className="bg-gray-800 shadow-lg rounded-lg p-4 text-white">
        <GameInfoPanel
          game={game}
          evaluation={evaluation}
          mate={mate}
          onReset={resetGame}
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-white text-sm mb-2 font-semibold">
          Position Evaluation (White's POV)
        </div>
        <div className="w-full h-8 bg-gray-900 rounded-lg overflow-hidden relative border border-gray-700">
          <div
            className="h-full bg-gradient-to-r from-white to-gray-200 transition-all duration-500 ease-out"
            style={{ width: `${getEvaluationBarWidth()}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold mix-blend-difference">
            {getDisplayEvaluation()}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>← Black Winning</span>
          <span>White Winning →</span>
        </div>
      </div>

      {bestLine && !game.isGameOver() && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-white text-sm font-semibold mb-2">
            Best Line
          </div>
          <div className="text-gray-300 text-xs font-mono break-all">
            {bestLine.split(' ').slice(0, 8).join(' ')}
            {bestLine.split(' ').length > 8 && '...'}
          </div>
        </div>
      )}

      {moveQuality && !game.isGameOver() && (
        <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 rounded-lg p-4 border border-yellow-600 shadow-lg">
          <div className="text-yellow-100 text-lg font-bold text-center">
            {moveQuality}
          </div>
        </div>
      )}

      <div className="bg-black text-green-400 rounded-lg p-4 text-sm font-mono">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <span>{engineStatus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Depth:</span>
            <span>{depth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Turn:</span>
            <span>{game.turn() === 'w' ? 'White ⚪' : 'Black ⚫'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Blunders:</span>
            <span>{blunderCount} 💥</span>
          </div>
          {consecutiveChecks > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Checks:</span>
              <span>{consecutiveChecks} ⚔️</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}