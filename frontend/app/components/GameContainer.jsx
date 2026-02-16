"use client";

import Engine from "../lib/engine";
import { useEffect, useState, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import ChessBoardComponent from "./ChessBoardComponent";
import GameInfoPanel from "./GameInfoPanel";

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

// ✅ Analyzing state for UI feedback
const [isAnalyzing, setIsAnalyzing] = useState(false);

const previousEvalRef = useRef(null);
const currentEvalRef = useRef(0);
const playerWhoMovedRef = useRef(null);
const engineRef = useRef(null);

// ✅ Store whose turn it was when we started analyzing
const analysisTurnRef = useRef('w');

// Configuration
const ANALYSIS_TIME_MS = 2000;
const MIN_DEPTH_REQUIRED = 12;

const classifyMove = useCallback((evalLoss) => {
const absLoss = Math.abs(evalLoss);

// ✅ Much more forgiving thresholds
if (absLoss <= 0.10) {
return "Best Move! 🔥";        // Perfect or near-perfect
} else if (absLoss <= 0.50) {
return "Good Move ✓";          // Solid, reasonable play
} else if (absLoss <= 1.00) {
return "Inaccuracy ⚠️";        // Suboptimal but playable
} else if (absLoss <= 2.50) {
return "Mistake ❌";           // Clear error
} else {
return "Blunder!! 💥";         // Serious mistake
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

    // ✅ CRITICAL FIX: Convert evaluation to White's perspective
    if (depth && depth >= MIN_DEPTH_REQUIRED) {
    if (positionEvaluation) {
        const rawEval = parseFloat(positionEvaluation) / 100;
        
        // ✅ Stockfish gives eval from side-to-move's perspective
        // Convert to White's perspective (standard chess notation)
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
        
        // ✅ Mate scores also need conversion
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
        // White moved: eval should improve (increase)
        evalLoss = prevEval - currEval;
        } else {
        // Black moved: eval should improve for Black (decrease)
        evalLoss = currEval - prevEval;
        }
        
        console.log('📈 Eval Loss:', evalLoss.toFixed(2));
        
        const quality = classifyMove(evalLoss);
        setMoveQuality(quality);
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

// ✅ Start analysis when position changes
useEffect(() => {
if (!engineRef.current || !engineRef.current.isReady) return;

setMoveQuality(null);
setIsAnalyzing(true);

// ✅ Store whose turn it is for this analysis
analysisTurnRef.current = game.turn();

console.log('🔍 Starting analysis for position, turn:', game.turn());

engineRef.current.stop();
engineRef.current.evaluatePositionTimed(position, ANALYSIS_TIME_MS);
}, [position, game]);

const updateGame = useCallback((updatedGame) => {
playerWhoMovedRef.current = game.turn();

console.log('🎯 Move made by:', playerWhoMovedRef.current === 'w' ? 'White' : 'Black');
console.log('📍 Eval before move:', previousEvalRef.current?.toFixed(2));

gameRef.current = updatedGame;
const newPosition = updatedGame.fen();
setPosition(newPosition);

localStorage.setItem("chess-game", newPosition);

if (engineRef.current) {
    engineRef.current.stop();
}

setBestLine("");

return true;
}, [game]);

const resetGame = useCallback(() => {
const freshGame = new Chess();
gameRef.current = freshGame;
setPosition(freshGame.fen());
localStorage.removeItem("chess-game");

previousEvalRef.current = null;
currentEvalRef.current = 0;
playerWhoMovedRef.current = null;
analysisTurnRef.current = 'w';
setMoveQuality(null);
setEvaluation(0);
setMate(null);
setBestLine("");
setDepth(0);
setIsAnalyzing(false);
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
    <div className="w-[min(90vw,600px)] aspect-square">
        <ChessBoardComponent
        game={game}
        position={position}
        updateGame={updateGame}
        bestMoveArrow={getBestMoveArrow()}
        />
    </div>
    
    {/* ✅ Better UI: Subtle analyzing indicator */}
    {isAnalyzing && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-yellow-400 px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2">
        <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
        <span>Analyzing depth {depth}...</span>
        </div>
    )}
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
    
    {bestLine && (
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

    {moveQuality && (
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
        </div>
    </div>
    </div>
</div>
);
}