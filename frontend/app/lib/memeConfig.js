/**
 * Meme Configuration & Selection Logic
 * Maps game situations to Cloudinary video URLs
 */

// Cloudinary base configuration
const CLOUDINARY_BASE = 'https://res.cloudinary.com/deb9vep8z/video/upload';

// Meme video URLs organized by category
export const MEME_VIDEOS = {
  // Positive reactions (good/best moves)
  GOOD_MOVE: [
    `${CLOUDINARY_BASE}/v1771149352/sqnice_cv5gmc.mp4`, // Nice move
    `${CLOUDINARY_BASE}/v1771149223/hikaru_ivixvx.mp4`, // Hikaru approval
  ],
  
  // Blunder reactions - ATTACKER perspective (taking advantage)
  BLUNDER_ATTACKER: [
    `${CLOUDINARY_BASE}/v1771149442/sqrajpal_qmtbc0.mp4`, // Rajpal laughing
  ],
  
  // Blunder reactions - VICTIM perspective (who made the blunder)
  BLUNDER_VICTIM: [
    `${CLOUDINARY_BASE}/v1771149592/sqheyheyboi_fdhq06.mp4`, // Sad reaction
  ],
  
  // Capture bonus (when piece is taken)
  CAPTURE: [
    `${CLOUDINARY_BASE}/v1771149592/sqheyheyboi_fdhq06.mp4`, // "Why me?" reaction
  ],
  
  // Add more categories as you upload videos:
  // CHECKMATE_WINNER: [],
  // CHECKMATE_LOSER: [],
  // CHECK_KING: [],
  // EN_PASSANT: [],
  // etc...
};

/**
 * Select appropriate meme based on game state
 * @param {Object} params - Game state parameters
 * @returns {Object|null} - {videoUrl, square, reason} or null if no meme
 */
export function selectMeme({
  moveQuality,        // "Best Move! 🔥", "Good Move ✓", "Blunder!! 💥", etc.
  move,               // {from: "e2", to: "e4", captured: "p", ...}
  blunderCount,       // Total blunders in game
  isCapture,          // Boolean
  isCheck,            // Boolean
  isCheckmate,        // Boolean
  targetSquare,       // Where the piece moved to (e.g., "e4")
  fromSquare,         // Where the piece came from (e.g., "e2")
}) {
  
  // Priority 1: Checkmate (coming soon)
  if (isCheckmate) {
    // TODO: Add checkmate memes
    return null;
  }
  
  // Priority 2: Blunders (alternate perspective)
  if (moveQuality === "Blunder!! 💥") {
    const useVictimPerspective = blunderCount % 2 === 1;
    
    if (useVictimPerspective) {
      // Show crying meme on the piece that just moved (victim)
      return {
        videoUrl: getRandomVideo(MEME_VIDEOS.BLUNDER_VICTIM),
        square: targetSquare, // Show on the blundered piece
        reason: 'blunder_victim',
        duration: null, // Will be detected from video
      };
    } else {
      // Show laughing meme on the piece that blundered (attacker will capture later)
      return {
        videoUrl: getRandomVideo(MEME_VIDEOS.BLUNDER_ATTACKER),
        square: targetSquare, // Show on the hanging piece
        reason: 'blunder_attacker',
        duration: null,
      };
    }
  }
  
  // Priority 3: Good/Best moves
  if (moveQuality === "Best Move! 🔥" || moveQuality === "Good Move ✓") {
    return {
      videoUrl: getRandomVideo(MEME_VIDEOS.GOOD_MOVE),
      square: targetSquare, // Show on the moved piece
      reason: 'good_move',
      duration: null,
    };
  }
  
  // Priority 4: Captures (bonus meme)
  if (isCapture) {
    return {
      videoUrl: getRandomVideo(MEME_VIDEOS.CAPTURE),
      square: targetSquare, // Show where the capture happened
      reason: 'capture',
      duration: null,
    };
  }
  
  // Priority 5: Check (coming soon - will use sound only for now)
  if (isCheck) {
    // TODO: Add check memes
    return null;
  }
  
  // No meme for this move
  return null;
}

/**
 * Get random video from array
 */
function getRandomVideo(videoArray) {
  if (!videoArray || videoArray.length === 0) return null;
  return videoArray[Math.floor(Math.random() * videoArray.length)];
}

/**
 * Determine if we should show a meme based on evaluation change
 * This prevents meme spam on normal moves
 */
export function shouldShowMeme(evalChange, moveQuality) {
  // Always show memes for these situations
  if (moveQuality === "Blunder!! 💥") return true;
  if (moveQuality === "Best Move! 🔥") return true;
  if (moveQuality === "Good Move ✓") return true;
  
  // For other moves, only show if evaluation changed significantly
  const EVAL_THRESHOLD = 0.5; // Show meme if eval swings by 0.5 or more
  return Math.abs(evalChange) >= EVAL_THRESHOLD;
}