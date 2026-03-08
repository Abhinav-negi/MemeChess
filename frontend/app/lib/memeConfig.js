/**
 * Comprehensive Meme Configuration with Smart Frequency Control
 */

const CLOUDINARY_BASE = 'https://res.cloudinary.com/deb9vep8z/video/upload/v1771148992';

const MEME_CATALOG = {
  check_attacker: 1,
  check_consecutive_king: 1,
  check_consecutive_piece: 1,
  check_king: 2,
  checkmate_loser_king: 1,
  checkmate_winner_king: 1,
  king_under_pressure: 1,
  pawn_at_6th_or_7th_rank: 1,
  pawn_promotion: 1,
  best_move: 4,
  blunder_attacker: 3,
  blunder_victim: 4,
  capture_bonus: 1,
  en_passant: 1,
  resign: 1,
  royal_fork: 1,
  safe_king: 1,
  scared_piece: 1,
  stalemate: 1,
  under_promotion: 1,
};

const MEME_VIDEOS = {};
Object.entries(MEME_CATALOG).forEach(([category, count]) => {
  if (count === 0) {
    MEME_VIDEOS[category] = [];
    return;
  }
  MEME_VIDEOS[category] = Array.from({ length: count }, (_, i) => {
    const videoNumber = i + 1;
    return `${CLOUDINARY_BASE}/${category}_${videoNumber}.mp4`;
  });
});

function getRandomVideo(category) {
  const videos = MEME_VIDEOS[category];
  if (!videos || videos.length === 0) {
    console.warn('⚠️ No videos found for category:', category);
    return null;
  }
  const url = videos[Math.floor(Math.random() * videos.length)];
  if (!url || !url.startsWith('http')) {
    console.error('❌ Invalid video URL for category:', category, url);
    return null;
  }
  return url;
}

// ✅ Fibonacci sequence for spacing out repeated good moves
const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

/**
 * ✅ Check if we should show meme based on Fibonacci spacing
 * @param {number} count - Number of consecutive good/best moves
 * @returns {boolean}
 */
function shouldShowBasedOnFibonacci(count) {
  return FIBONACCI.includes(count);
}

/**
 * ✅ Determine if eval change is significant enough
 * @param {number} evalChange - Absolute evaluation change
 * @returns {boolean}
 */
function isSignificantEvalChange(evalChange) {
  const THRESHOLD = 1.5; // Show if eval swings by 1.5+ pawns
  return Math.abs(evalChange) >= THRESHOLD;
}

/**
 * ✅ SMART MEME FILTER - Main decision logic
 * @param {Object} params
 * @returns {boolean} - Whether to show meme
 */
export function shouldShowMeme({
  moveQuality,
  evalChange,
  consecutiveBestMoves = 0,
  consecutiveGoodMoves = 0,
  isSpecialEvent = false, // check, checkmate, promotion, etc.
}) {
  
  // ✅ ALWAYS SHOW: Critical game events
  if (isSpecialEvent) {
    console.log('🎬 Show meme: Special event');
    return true;
  }

  // ✅ ALWAYS SHOW: Blunders (no matter what)
  if (moveQuality === "Blunder!! 💥") {
    console.log('🎬 Show meme: Blunder');
    return true;
  }

  // ✅ SHOW WITH SPACING: Best moves (Fibonacci pattern)
  if (moveQuality === "Best Move! 🔥") {
    const shouldShow = shouldShowBasedOnFibonacci(consecutiveBestMoves);
    console.log(`🎬 Best move #${consecutiveBestMoves}: ${shouldShow ? 'SHOW' : 'SKIP'}`);
    return shouldShow;
  }

  // ✅ RARELY SHOW: Good moves (only if BIG eval change)
  if (moveQuality === "Good Move ✓") {
    if (isSignificantEvalChange(evalChange)) {
      console.log('🎬 Show meme: Good move with big eval change');
      return true;
    }
    console.log('⏭️ Skip meme: Good move without big swing');
    return false;
  }

  // ✅ NEVER SHOW: Inaccuracies and mistakes (too common)
  if (moveQuality === "Inaccuracy ⚠️" || moveQuality === "Mistake ❌") {
    console.log('⏭️ Skip meme: Minor error');
    return false;
  }

  // ✅ FALLBACK: Only show if massive eval swing
  if (isSignificantEvalChange(evalChange)) {
    console.log('🎬 Show meme: Massive eval change');
    return true;
  }

  console.log('⏭️ Skip meme: Nothing significant');
  return false;
}

// Helper functions for special move detection

function isEnPassant(move, game) {
  if (!move.captured) return false;
  const piece = game.get(move.to);
  if (!piece || piece.type !== 'p') return false;
  const fromFile = move.from.charCodeAt(0);
  const toFile = move.to.charCodeAt(0);
  const fromRank = parseInt(move.from[1]);
  const toRank = parseInt(move.to[1]);
  return Math.abs(fromFile - toFile) === 1 && fromRank !== toRank;
}

function isRoyalFork(game, move) {
  const piece = game.get(move.to);
  if (!piece) return false;
  const moves = game.moves({ square: move.to, verbose: true });
  const attackedSquares = moves.map(m => m.to);
  let attacksKing = false;
  let attacksQueen = false;
  attackedSquares.forEach(square => {
    const target = game.get(square);
    if (target && target.color !== piece.color) {
      if (target.type === 'k') attacksKing = true;
      if (target.type === 'q') attacksQueen = true;
    }
  });
  return attacksKing && attacksQueen;
}

function isSafeKingMove(move, wasInCheck) {
  if (!wasInCheck) return false;
  const piece = move.piece;
  return piece === 'k';
}

function isPawnNearPromotion(game, move) {
  const piece = game.get(move.to);
  if (!piece || piece.type !== 'p') return false;
  const rank = parseInt(move.to[1]);
  if (piece.color === 'w') return rank === 6 || rank === 7;
  if (piece.color === 'b') return rank === 2 || rank === 3;
  return false;
}

function isUnderPromotion(move) {
  return move.promotion && move.promotion !== 'q';
}

function findKingSquare(game, color) {
  const board = game.board();
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      if (square && square.type === 'k' && square.color === color) {
        const fileChar = String.fromCharCode(97 + file);
        const rankNum = 8 - rank;
        return fileChar + rankNum;
      }
    }
  }
  return null;
}

/**
 * ✅ Main meme selection with special event detection
 */
export function selectMeme({
  moveQuality,
  move,
  game,
  blunderCount,
  isCapture,
  isCheck,
  isCheckmate,
  isStalemate,
  targetSquare,
  wasInCheck,
  consecutiveChecks = 0,
  hasShownPressure = { white: false, black: false },
  currentEvaluation = 0,
  evalChange = 0,
  consecutiveBestMoves = 0,
  consecutiveGoodMoves = 0,
}) {
  
  // ✅ Detect if this is a special event
  const isSpecialEvent = 
    isCheckmate || 
    isStalemate || 
    isCheck || 
    isRoyalFork(game, move) || 
    isEnPassant(move, game) || 
    move.promotion ||
    consecutiveChecks >= 3;

  // ✅ SMART FILTER: Should we show ANY meme?
  const shouldShow = shouldShowMeme({
    moveQuality,
    evalChange,
    consecutiveBestMoves,
    consecutiveGoodMoves,
    isSpecialEvent,
  });

  if (!shouldShow) {
    console.log('⏭️ Meme filtered out by smart system');
    return null;
  }

  // ✅ If we passed the filter, select appropriate meme
  
  // PRIORITY 1: Game Over
  if (isStalemate) {
    const board = game.board();
    const memes = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square) {
          const fileChar = String.fromCharCode(97 + file);
          const rankNum = 8 - rank;
          const squareName = fileChar + rankNum;
          memes.push({
            videoUrl: getRandomVideo('stalemate'),
            square: squareName,
            reason: 'stalemate',
          });
        }
      }
    }
    return { type: 'multiple', memes };
  }
  
  if (isCheckmate) {
    const winnerColor = game.turn() === 'w' ? 'b' : 'w';
    const loserColor = game.turn();
    const winnerKing = findKingSquare(game, winnerColor);
    const loserKing = findKingSquare(game, loserColor);
    
    return {
      type: 'multiple',
      memes: [
        {
          videoUrl: getRandomVideo('checkmate_winner_king'),
          square: winnerKing,
          reason: 'checkmate_winner',
        },
        {
          videoUrl: getRandomVideo('checkmate_loser_king'),
          square: loserKing,
          reason: 'checkmate_loser',
        }
      ]
    };
  }
  
  // PRIORITY 2: Special Moves
  if (isRoyalFork(game, move)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('royal_fork'),
      square: targetSquare,
      reason: 'royal_fork',
    };
  }
  
  if (isEnPassant(move, game)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('en_passant'),
      square: targetSquare,
      reason: 'en_passant',
    };
  }
  
  if (isUnderPromotion(move)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('under_promotion'),
      square: targetSquare,
      reason: 'under_promotion',
    };
  }
  
  if (move.promotion === 'q') {
    return {
      type: 'single',
      videoUrl: getRandomVideo('pawn_promotion'),
      square: targetSquare,
      reason: 'pawn_promotion',
    };
  }
  
  // PRIORITY 3: Check (single meme)
  if (isCheck) {
    if (consecutiveChecks >= 3) {
      return {
        type: 'single',
        videoUrl: getRandomVideo('check_consecutive_piece'),
        square: targetSquare,
        reason: 'check_consecutive',
      };
    }
    
    return {
      type: 'single',
      videoUrl: getRandomVideo('check_attacker'),
      square: targetSquare,
      reason: 'check_attacker',
    };
  }
  
  if (isSafeKingMove(move, wasInCheck)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('safe_king'),
      square: targetSquare,
      reason: 'safe_king',
    };
  }
  
  // PRIORITY 4: King Under Pressure (once per game per side)
  if (!hasShownPressure.white && currentEvaluation < -3.5) {
    const kingSquare = findKingSquare(game, 'w');
    return {
      type: 'single',
      videoUrl: getRandomVideo('king_under_pressure'),
      square: kingSquare,
      reason: 'king_under_pressure',
      showOnceFor: 'white',
    };
  }
  
  if (!hasShownPressure.black && currentEvaluation > 3.5) {
    const kingSquare = findKingSquare(game, 'b');
    return {
      type: 'single',
      videoUrl: getRandomVideo('king_under_pressure'),
      square: kingSquare,
      reason: 'king_under_pressure',
      showOnceFor: 'black',
    };
  }
  
  // PRIORITY 5: Pawn Progress
  if (isPawnNearPromotion(game, move)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('pawn_at_6th_or_7th_rank'),
      square: targetSquare,
      reason: 'pawn_near_promotion',
    };
  }
  
  // PRIORITY 6: Move Quality
  if (moveQuality === "Blunder!! 💥") {
    const useVictimPerspective = blunderCount % 2 === 1;
    return {
      type: 'single',
      videoUrl: getRandomVideo(
        useVictimPerspective ? 'blunder_victim' : 'blunder_attacker'
      ),
      square: targetSquare,
      reason: useVictimPerspective ? 'blunder_victim' : 'blunder_attacker',
    };
  }
  
  if (moveQuality === "Best Move! 🔥") {
    return {
      type: 'single',
      videoUrl: getRandomVideo('best_move'),
      square: targetSquare,
      reason: 'best_move',
    };
  }
  
  if (moveQuality === "Good Move ✓") {
    return {
      type: 'single',
      videoUrl: getRandomVideo('best_move'),
      square: targetSquare,
      reason: 'good_move',
    };
  }
  
  // PRIORITY 7: High-Value Captures
  if (isCapture) {
    const capturedPiece = move.captured;
    const highValuePieces = ['q', 'r'];
    if (highValuePieces.includes(capturedPiece)) {
      return {
        type: 'single',
        videoUrl: getRandomVideo('capture_bonus'),
        square: targetSquare,
        reason: 'capture_high_value',
      };
    }
  }
  
  return null;
}

export function getResignMeme(resigningColor, game) {
  const kingSquare = findKingSquare(game, resigningColor);
  return {
    type: 'single',
    videoUrl: getRandomVideo('resign'),
    square: kingSquare,
    reason: 'resign',
  };
}