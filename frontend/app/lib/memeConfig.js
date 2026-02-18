/**
 * Comprehensive Meme Configuration
 * Handles all meme categories with proper game state detection
 */

// Cloudinary base URL
// const CLOUDINARY_BASE = 'https://res.cloudinary.com/deb9vep8z/video/upload/v1737024000/memes';
const CLOUDINARY_BASE = 'https://res.cloudinary.com/deb9vep8z/video/upload/v1771148992';

/**
 * Validate that video URL is accessible
 * Falls back to null if network error
 */
async function validateVideoUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return url;
    }
    console.warn('❌ Video not found:', url);
    return null;
  } catch (err) {
    console.error('❌ Network error checking video:', url, err);
    return null;
  }
}

/**
 * Complete Meme Catalog
 * Structure: category: count of videos
 * Videos must be named: category_1.mp4, category_2.mp4, etc.
 */
const MEME_CATALOG = {
  // CHECK SITUATION
  check_attacker: 1,
  check_consecutive_king: 1,
  check_consecutive_piece: 1,
  check_king: 2,

  // CHECKMATE
  checkmate_loser_king: 1,
  checkmate_winner_king: 1,

  // GAME PRESSURE
  king_under_pressure: 1,

  // PAWN SPECIAL
  pawn_at_6th_or_7th_rank: 1,
  pawn_promotion: 1,

  // REACTION
  best_move: 4,
  blunder_attacker: 3,
  blunder_victim: 4,
  capture_bonus: 1,

  // SPECIAL CASE
  en_passant: 1,
  resign: 1,
  royal_fork: 1,
  safe_king: 1,
  scared_piece: 1,
  stalemate: 1,
  under_promotion: 1,
};

/**
 * Auto-generate video URLs from catalog
 */
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

/**
 * Get random video from category
 * Returns null if no videos available (game will skip meme)
 */
function getRandomVideo(category) {
  const videos = MEME_VIDEOS[category];
  if (!videos || videos.length === 0) {
    console.warn('⚠️ No videos found for category:', category);
    return null;
  }
  
  const url = videos[Math.floor(Math.random() * videos.length)];
  
  // Basic validation: check if URL is properly formed
  if (!url || !url.startsWith('http')) {
    console.error('❌ Invalid video URL for category:', category, url);
    return null;
  }
  
  return url;
}

/**
 * Detect if move is en passant
 */
function isEnPassant(move, game) {
  if (!move.captured) return false;
  
  // En passant: pawn captures but target square is empty
  const piece = game.get(move.to);
  if (!piece || piece.type !== 'p') return false;
  
  // Check if the captured pawn was on a different rank
  const fromFile = move.from.charCodeAt(0);
  const toFile = move.to.charCodeAt(0);
  const fromRank = parseInt(move.from[1]);
  const toRank = parseInt(move.to[1]);
  
  return Math.abs(fromFile - toFile) === 1 && fromRank !== toRank;
}

/**
 * Detect if move is a royal fork (King + Queen both attacked)
 */
function isRoyalFork(game, move) {
  // Get all squares attacked by the piece that just moved
  const piece = game.get(move.to);
  if (!piece) return false;

  const moves = game.moves({ square: move.to, verbose: true });
  const attackedSquares = moves.map(m => m.to);

  // Check if both enemy king and queen are attacked
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

/**
 * Detect if king moved to safety (instead of blocking check)
 */
function isSafeKingMove(move, wasInCheck) {
  if (!wasInCheck) return false;
  
  const piece = move.piece;
  return piece === 'k'; // King moved out of check
}

/**
 * Detect if piece moved to a square attacked by opponent (scared piece)
 */
function isScaredPiece(game, move) {
  // Get opponent's possible moves
  const opponentColor = game.turn(); // Current turn after move
  
  // Check if the square where piece landed is attacked
  const allOpponentMoves = game.moves({ verbose: true });
  const isAttacked = allOpponentMoves.some(m => m.to === move.to);
  
  return isAttacked;
}

/**
 * Detect pawn at 6th or 7th rank
 */
function isPawnNearPromotion(game, move) {
  const piece = game.get(move.to);
  if (!piece || piece.type !== 'p') return false;
  
  const rank = parseInt(move.to[1]);
  
  // White pawn at rank 6 or 7, Black pawn at rank 2 or 3
  if (piece.color === 'w') return rank === 6 || rank === 7;
  if (piece.color === 'b') return rank === 2 || rank === 3;
  
  return false;
}

/**
 * Detect under-promotion (pawn promotes to anything except queen)
 */
function isUnderPromotion(move) {
  return move.promotion && move.promotion !== 'q';
}

/**
 * Find king position for a given color
 */
function findKingSquare(game, color) {
  const board = game.board();
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      if (square && square.type === 'k' && square.color === color) {
        const fileChar = String.fromCharCode(97 + file); // a-h
        const rankNum = 8 - rank; // 8-1
        return fileChar + rankNum;
      }
    }
  }
  return null;
}

/**
 * Main meme selection function
 * Returns single meme or array of memes (for stalemate)
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
  isDraw,
  targetSquare,
  fromSquare,
  wasInCheck,
  consecutiveChecks = 0,
  hasShownPressure = false,
  currentEvaluation = 0,
}) {
  
  // PRIORITY 1: Game Over States
  
  // Stalemate - ALL pieces show meme
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
  
  // Checkmate
  if (isCheckmate) {
    const winnerColor = game.turn() === 'w' ? 'b' : 'w'; // Opponent won
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
  
  // Royal Fork (King + Queen attacked)
  if (isRoyalFork(game, move)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('royal_fork'),
      square: targetSquare,
      reason: 'royal_fork',
    };
  }
  
  // En Passant
  if (isEnPassant(move, game)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('en_passant'),
      square: targetSquare,
      reason: 'en_passant',
    };
  }
  
  // Under Promotion
  if (isUnderPromotion(move)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('under_promotion'),
      square: targetSquare,
      reason: 'under_promotion',
    };
  }
  
  // Pawn Promotion (to queen)
  if (move.promotion === 'q') {
    return {
      type: 'single',
      videoUrl: getRandomVideo('pawn_promotion'),
      square: targetSquare,
      reason: 'pawn_promotion',
    };
  }
  
  // PRIORITY 3: Check Situations
  
  if (isCheck) {
    // Consecutive checks (3+)
    if (consecutiveChecks >= 3) {
      const checkingPiece = targetSquare;
      const checkedKing = findKingSquare(game, game.turn());
      
      return {
        type: 'multiple',
        memes: [
          {
            videoUrl: getRandomVideo('check_consecutive_piece'),
            square: checkingPiece,
            reason: 'check_consecutive_piece',
          },
          {
            videoUrl: getRandomVideo('check_consecutive_king'),
            square: checkedKing,
            reason: 'check_consecutive_king',
          }
        ]
      };
    }
    
    // Regular check - show on both attacker and king
    const checkingPiece = targetSquare;
    const checkedKing = findKingSquare(game, game.turn());
    
    return {
      type: 'multiple',
      memes: [
        {
          videoUrl: getRandomVideo('check_attacker'),
          square: checkingPiece,
          reason: 'check_attacker',
        },
        {
          videoUrl: getRandomVideo('check_king'),
          square: checkedKing,
          reason: 'check_king',
        }
      ]
    };
  }
  
  // Safe King (moved out of check)
  if (isSafeKingMove(move, wasInCheck)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('safe_king'),
      square: targetSquare,
      reason: 'safe_king',
    };
  }
  
// PRIORITY 4: Position Pressure (show once per game per side)

// King under pressure (losing badly, eval threshold ±3.5)
if (!hasShownPressure.white && currentEvaluation < -3.5) {
  // White is losing (eval is negative from White's POV)
  const kingSquare = findKingSquare(game, 'w');
  return {
    type: 'single',
    videoUrl: getRandomVideo('king_under_pressure'),
    square: kingSquare,
    reason: 'king_under_pressure',
    showOnceFor: 'white', // Signal which side to mark
  };
}

if (!hasShownPressure.black && currentEvaluation > 3.5) {
  // Black is losing (eval is positive from White's POV)
  const kingSquare = findKingSquare(game, 'b');
  return {
    type: 'single',
    videoUrl: getRandomVideo('king_under_pressure'),
    square: kingSquare,
    reason: 'king_under_pressure',
    showOnceFor: 'black', // Signal which side to mark
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
  
  // PRIORITY 6: Move Quality Reactions
  
  // Blunders (alternate perspective)
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
  
  // Best/Good moves
  if (moveQuality === "Best Move! 🔥" || moveQuality === "Good Move ✓") {
    return {
      type: 'single',
      videoUrl: getRandomVideo('best_move'),
      square: targetSquare,
      reason: 'best_move',
    };
  }
  
  // PRIORITY 7: Scared Piece (moved to attacked square)
  
  if (isScaredPiece(game, move)) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('scared_piece'),
      square: targetSquare,
      reason: 'scared_piece',
    };
  }
  
  // PRIORITY 8: Captures
  
  if (isCapture) {
    return {
      type: 'single',
      videoUrl: getRandomVideo('capture_bonus'),
      square: targetSquare,
      reason: 'capture',
    };
  }
  
  // No meme for this move
  return null;
}

/**
 * Evaluation threshold for showing memes
 */
export function shouldShowMeme(evalChange, moveQuality) {
  // Always show for these
  if (moveQuality === "Blunder!! 💥") return true;
  if (moveQuality === "Best Move! 🔥") return true;
  if (moveQuality === "Good Move ✓") return true;
  
  // For other moves, check evaluation swing
  const EVAL_THRESHOLD = 0.5;
  return Math.abs(evalChange) >= EVAL_THRESHOLD;
}

/**
 * Handle resign (to be called manually)
 */
export function getResignMeme(resigningColor, game) {
  const kingSquare = findKingSquare(game, resigningColor);
  
  return {
    type: 'single',
    videoUrl: getRandomVideo('resign'),
    square: kingSquare,
    reason: 'resign',
  };
}