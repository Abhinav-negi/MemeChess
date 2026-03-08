"use client";

import Engine from "../lib/engine";
import { useEffect, useState, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import ChessBoardComponent from "./ChessBoardComponent";
import GameInfoPanel from "./GameInfoPanel";
import MemeOverlay from "./MemeOverlay";
import { selectMeme, shouldShowMeme } from "../lib/memeConfig";
import { soundManager } from "../lib/soundManager";

export default function GameContainer({ 
  botDifficulty = null, 
  playerColor = 'white' 
}) {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;
  const [position, setPosition] = useState(() => game.fen());

  const [evaluation, setEvaluation] = useState(0);
  const [mate, setMate] = useState(null);
  const [engineStatus, setEngineStatus] = useState("Initializing...");
  const [depth, setDepth] = useState(0);
  const [bestLine, setBestLine] = useState("");
  const [moveQuality, setMoveQuality] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Meme system state
  const [currentMemes, setCurrentMemes] = useState([]);
  const [isPlayingMeme, setIsPlayingMeme] = useState(false);
  const [blunderCount, setBlunderCount] = useState(0);
  const [boardSize, setBoardSize] = useState(600);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);

  // Game state tracking
  const [consecutiveChecks, setConsecutiveChecks] = useState(0);
  const [wasInCheckLastMove, setWasInCheckLastMove] = useState(false);
  const checkStateRef = useRef({ isCheck: false, isCheckmate: false });
  
  // ✅ ADD: Track which side has shown pressure meme
  const hasShownPressureRef = useRef({ white: false, black: false });

  const previousEvalRef = useRef(null);
  const currentEvalRef = useRef(0);
  const playerWhoMovedRef = useRef(null);
  const engineRef = useRef(null);
  const analysisTurnRef = useRef('w');
  const lastMoveRef = useRef(null);
  const moveQualityRef = useRef(null);
  
  // ✅ ADD: Analysis completion lock
  const analysisCompleteRef = useRef(true);
  const memeIdCounterRef = useRef(0);  // ✅ Unique ID for each meme

  const ANALYSIS_TIME_MS = 2000;
  const MIN_DEPTH_REQUIRED = 12;
  const botColor = playerColor === 'white' ? 'b' : 'w';
  const consecutiveBestMovesRef = useRef(0);
  const consecutiveGoodMovesRef = useRef(0);


  // Initialize sound manager
  useEffect(() => {
    soundManager.init();
    
    const musicTimer = setTimeout(() => {
      soundManager.startBackgroundMusic();
    }, 1000);
    
    return () => clearTimeout(musicTimer);
  }, []);

  // Calculate board size
  useEffect(() => {
    function updateSize() {
      const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9, 600);
      setBoardSize(size);
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const classifyMove = useCallback((evalLoss) => {
    const absLoss = Math.abs(evalLoss);
    if (absLoss <= 0.10) return "Best Move! 🔥";
    else if (absLoss <= 0.50) return "Good Move ✓";
    else if (absLoss <= 1.00) return "Inaccuracy ⚠️";
    else if (absLoss <= 2.50) return "Mistake ❌";
    else return "Blunder!! 💥";
  }, []);

const triggerMemeIfNeeded = useCallback((quality, evalLoss) => {
  if (!lastMoveRef.current) return;

  const evalChange = Math.abs(evalLoss);
  const move = lastMoveRef.current;
  
  const isCheck = checkStateRef.current.isCheck;
  const isCheckmate = checkStateRef.current.isCheckmate;
  const isStalemate = gameRef.current.isStalemate();

  // ✅ Track consecutive moves SYNCHRONOUSLY with refs
  if (quality === "Best Move! 🔥") {
    consecutiveBestMovesRef.current += 1;
    consecutiveGoodMovesRef.current = 0;
  } else if (quality === "Good Move ✓") {
    consecutiveGoodMovesRef.current += 1;
    consecutiveBestMovesRef.current = 0;
  } else {
    consecutiveBestMovesRef.current = 0;
    consecutiveGoodMovesRef.current = 0;
  }

  // Track consecutive checks
  if (isCheck) {
    setConsecutiveChecks(prev => prev + 1);
  } else {
    setConsecutiveChecks(0);
  }

  console.log('📊 Move Quality:', quality, 'Best streak:', consecutiveBestMovesRef.current, 'Good streak:', consecutiveGoodMovesRef.current);

  // ✅ NOW the counters are already updated!
  const memeResult = selectMeme({
    moveQuality: quality,
    move: move,
    game: gameRef.current,
    blunderCount: blunderCount,
    isCapture: !!move.captured,
    isCheck: isCheck,
    isCheckmate: isCheckmate,
    isStalemate: isStalemate,
    targetSquare: move.to,
    wasInCheck: wasInCheckLastMove,
    consecutiveChecks: consecutiveChecks,
    hasShownPressure: hasShownPressureRef.current,
    currentEvaluation: currentEvalRef.current,
    evalChange: evalChange,
    consecutiveBestMoves: consecutiveBestMovesRef.current,  // ✅ Use ref value
    consecutiveGoodMoves: consecutiveGoodMovesRef.current,  // ✅ Use ref value
  });

  if (memeResult) {
    console.log('🎬 Showing meme:', memeResult);
    
    soundManager.pauseBackgroundMusic();
    
    const memesWithIds = [];
    
    if (memeResult.type === 'single') {
      memesWithIds.push({
        id: ++memeIdCounterRef.current,
        videoUrl: memeResult.videoUrl,
        square: memeResult.square,
        reason: memeResult.reason,
      });
    } else if (memeResult.type === 'multiple') {
      memeResult.memes.forEach(meme => {
        memesWithIds.push({
          id: ++memeIdCounterRef.current,
          videoUrl: meme.videoUrl,
          square: meme.square,
          reason: meme.reason,
        });
      });
    }
    
    setCurrentMemes(memesWithIds);
    setIsPlayingMeme(true);
    
    if (memeResult.showOnceFor) {
      hasShownPressureRef.current = {
        ...hasShownPressureRef.current,
        [memeResult.showOnceFor]: true
      };
    }
  }

  setWasInCheckLastMove(isCheck);
}, [blunderCount, consecutiveChecks, wasInCheckLastMove]);
  // Initialize engine
  useEffect(() => {
    engineRef.current = new Engine();

    setTimeout(() => {
      if (botDifficulty && engineRef.current) {
        engineRef.current.setElo(botDifficulty.elo, botDifficulty.multiPV);
        console.log(`🤖 Bot: ${botDifficulty.name} (${botDifficulty.elo} ELO, MultiPV: ${botDifficulty.multiPV})`);
      }
    }, 1000);

    const handleMessage = (data) => {
      const { raw, positionEvaluation, possibleMate, depth, pv, bestMove } = data;

      if (raw === 'uciok' || raw === 'readyok') {
        setEngineStatus("Engine Ready ✅");
        
      } else if (raw?.startsWith('info')) {
        setEngineStatus("Analyzing...");
        setIsAnalyzing(true);
      }

      if (depth) setDepth(depth);
      if (pv) setBestLine(pv);

      if (depth && depth >= MIN_DEPTH_REQUIRED) {
        if (positionEvaluation) {
          const rawEval = parseFloat(positionEvaluation) / 100;
          const turnWhenAnalyzed = analysisTurnRef.current;
          const evalFromWhitePOV = turnWhenAnalyzed === 'w' ? rawEval : -rawEval;
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

        if (previousEvalRef.current !== null && playerWhoMovedRef.current) {
          const prevEval = previousEvalRef.current;
          const currEval = currentEvalRef.current;
          const player = playerWhoMovedRef.current;

          const evalLoss = player === 'w' ? prevEval - currEval : currEval - prevEval;
          const quality = classifyMove(evalLoss);
          setMoveQuality(quality);
          moveQualityRef.current = quality;

          if (quality === "Blunder!! 💥") {
            setBlunderCount(prev => prev + 1);
          }

          triggerMemeIfNeeded(quality, evalLoss);
        }

        previousEvalRef.current = currentEvalRef.current;
        playerWhoMovedRef.current = null;
        
        // ✅ Mark analysis as complete
        analysisCompleteRef.current = true;
      }
    };

    engineRef.current.onMessage(handleMessage);

    return () => {
      if (engineRef.current) {
        engineRef.current.terminate();
      }
    };
  }, [classifyMove, botDifficulty, triggerMemeIfNeeded]);

  // Start analysis when position changes
  useEffect(() => {
    if (!engineRef.current || !engineRef.current.isReady) return;
    if (game.isGameOver()) {
      setEngineStatus("Game Over");
      return;
    }

    // ✅ Mark analysis as in progress
    analysisCompleteRef.current = false;
    
    setMoveQuality(null);
    setIsAnalyzing(true);
    analysisTurnRef.current = game.turn();

    engineRef.current.stop();
    engineRef.current.evaluatePositionTimed(position, ANALYSIS_TIME_MS);
  }, [position, game]);

  const updateGame = useCallback((updatedGame) => {
  // Block moves while meme is playing
  if (isPlayingMeme) {
    console.log('⏸️ Move blocked - meme is playing');
    return false;
  }

  // Capture check state
  checkStateRef.current = {
    isCheck: updatedGame.isCheck(),
    isCheckmate: updatedGame.isCheckmate()
  };

  // Store move details BEFORE playing sounds
  const history = updatedGame.history({ verbose: true });
  lastMoveRef.current = history[history.length - 1];
  const lastMove = lastMoveRef.current;

  // ✅ Play appropriate sounds
  if (updatedGame.isCheckmate()) {
    soundManager.play('checkmate');
  } else if (updatedGame.isStalemate()) {
    soundManager.play('stalemate');
  } else if (updatedGame.isCheck()) {
    soundManager.play('check');
  } else if (lastMove.flags.includes('k') || lastMove.flags.includes('q')) {
    // Castling (k = kingside, q = queenside)
    soundManager.play('castle');
  } else if (lastMove.captured) {
    soundManager.play('capture');
  } else {
    soundManager.play('move');
  }

  playerWhoMovedRef.current = game.turn();

  gameRef.current = updatedGame;
  setPosition(updatedGame.fen());
  
  if (engineRef.current) {
    engineRef.current.stop();
  }
  setBestLine("");
  return true;
}, [game, isPlayingMeme]);

// ✅ BOT MOVE LOGIC - Wait for memes, trigger on mount if bot's turn
useEffect(() => {
  if (!botDifficulty) return;
  if (game.isGameOver()) return;
  if (game.turn() !== botColor) return;
  if (!engineRef.current?.isReady) return;
  
  // ✅ Wait for memes to finish
  if (isPlayingMeme) {
    console.log('⏸️ Bot waiting for meme to finish...');
    return;
  }
  
  // ✅ REMOVED: Don't wait for analysis on first move
  // For opening move, there's no previous analysis needed
  const isOpeningPosition = game.history().length === 0;
  
  if (!isOpeningPosition && !analysisCompleteRef.current) {
    console.log('⏸️ Bot waiting for analysis to complete...');
    return;
  }

  console.log('🤖 Bot thinking...');

  const timer = setTimeout(() => {
    engineRef.current.findBestMove(
      position, 
      (bestMove) => {
        console.log('🤖 Bot plays:', bestMove);
        
        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.length > 4 ? bestMove[4] : 'q'
        });

        if (move) {
          soundManager.play('move');
          updateGame(gameCopy);
        }
      }, 
      botDifficulty.thinkTime,
      botDifficulty.pickMove
    );
  }, 500);

  return () => clearTimeout(timer);
}, [position, game, botDifficulty, botColor, isPlayingMeme, analysisCompleteRef.current]);



  const resetGame = useCallback(() => {
    const freshGame = new Chess();
    gameRef.current = freshGame;
    setPosition(freshGame.fen());
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
    setWasInCheckLastMove(false);
    consecutiveBestMovesRef.current = 0;  // ✅ Reset ref
    consecutiveGoodMovesRef.current = 0;  // ✅ Reset ref
    hasShownPressureRef.current = { white: false, black: false };  // ✅ Reset
    analysisCompleteRef.current = true;  // ✅ Reset
  }, []);

  // ✅ Handle meme completion
  const handleMemeComplete = useCallback((memeId) => {
    console.log('✅ Meme complete:', memeId);
    
    setCurrentMemes(prev => {
      const updated = prev.filter(m => m.id !== memeId);  // ✅ Filter by ID
      
      if (updated.length === 0) {
        setIsPlayingMeme(false);
        soundManager.resumeBackgroundMusic();
      }
      
      return updated;
    });
  }, []);

  // Toggle music
  const toggleMusic = useCallback(() => {
    const newState = soundManager.toggleBackgroundMusic();
    setIsMusicEnabled(newState);
  }, []);

  const getDisplayEvaluation = () => {
    if (mate !== null) {
      return `${mate > 0 ? 'White' : 'Black'} mates in ${Math.abs(mate)}`;
    }
    return `${evaluation >= 0 ? '+' : ''}${evaluation.toFixed(2)}`;
  };

  const getEvaluationBarWidth = () => {
    if (mate !== null) return mate > 0 ? 100 : 0;
    const clamped = Math.max(-5, Math.min(5, evaluation));
    return ((clamped + 5) / 10) * 100;
  };

  return (
    <div className="w-screen min-h-screen flex flex-col lg:flex-row justify-center items-center gap-6 p-4 bg-zinc-900">
      <div className="flex-shrink-0 relative">
        <div className="w-[min(90vw,600px)] aspect-square relative">
          <ChessBoardComponent
            game={game}
            position={position}
            updateGame={updateGame}
            boardOrientation={playerColor}
            playerColor={playerColor}
          />

          {/* ✅ Meme Overlays - Use unique ID as key */}
          {currentMemes.map((meme) => (
            <MemeOverlay
              key={meme.id}  // ✅ Use unique ID
              memeData={meme}
              onComplete={() => handleMemeComplete(meme.id)}  // ✅ Pass ID
              boardSize={boardSize}
              boardOrientation={playerColor}
            />
          ))}
        </div>

        {/* Music toggle */}
        <button
          onClick={toggleMusic}
          className="absolute bottom-2 right-2 bg-black/75 hover:bg-black/90 text-white p-2 rounded-lg text-sm transition-all z-20"
          title={isMusicEnabled ? "Mute" : "Unmute"}
        >
          {isMusicEnabled ? "🔊" : "🔇"}
        </button>

        {/* Analyzing indicator */}
        {isAnalyzing && !game.isGameOver() && (
          <div className="absolute top-2 left-2 bg-black/75 text-yellow-400 px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
            <span>Depth {depth}</span>
          </div>
        )}

        {/* Meme playing indicator */}
        {isPlayingMeme && (
          <div className="absolute bottom-2 left-2 bg-purple-600/90 text-white px-3 py-2 rounded-lg text-sm font-bold">
            🎬 Meme Playing...
          </div>
        )}
      </div>

      <div className="w-full max-w-md lg:w-96 flex flex-col gap-4">
        <div className="bg-gray-800 shadow-lg rounded-lg p-4 text-white">
          <GameInfoPanel game={game} onReset={resetGame} />
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

        {moveQuality && !game.isGameOver() && (
          <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 rounded-lg p-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}