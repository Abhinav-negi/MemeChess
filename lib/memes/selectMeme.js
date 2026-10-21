import { getRandomVideo } from './catalog';
import {
  allPieceSquares,
  findKingSquare,
  isEnPassant,
  isPawnNearPromotion,
  isRoyalFork,
  isSafeKingMove,
  isScaredPiece,
  isUnderPromotion,
} from './detectors';

const PRESSURE_THRESHOLD = 3.5;
const EVAL_SWING_THRESHOLD = 0.5;

const meme = (category, square, reason = category) => ({
  videoUrl: getRandomVideo(category),
  square,
  reason,
});

function result(memes, extra = {}) {
  const playable = memes.filter((m) => m.videoUrl && m.square);
  return playable.length ? { memes: playable, ...extra } : null;
}

/**
 * Picks the meme(s) for the move just played, by priority:
 * game over > special move > check > pressure > pawn progress > quality > scared > capture.
 * `game` is the position AFTER `move`. Returns { memes: [{videoUrl, square, reason}], showOnceFor? } or null.
 */
export function selectMeme({
  game,
  move,
  quality,
  blunderCount = 0,
  wasInCheck = false,
  consecutiveChecks = 0,
  shownPressure = { w: false, b: false },
  evaluation = 0,
}) {
  const to = move.to;

  if (game.isStalemate()) {
    return result(allPieceSquares(game).map((sq) => meme('stalemate', sq)));
  }

  if (game.isCheckmate()) {
    const loser = game.turn();
    return result([
      meme('checkmate_winner_king', findKingSquare(game, move.color), 'checkmate_winner'),
      meme('checkmate_loser_king', findKingSquare(game, loser), 'checkmate_loser'),
    ]);
  }

  if (isRoyalFork(game, move)) return result([meme('royal_fork', to)]);
  if (isEnPassant(move)) return result([meme('en_passant', to)]);
  if (isUnderPromotion(move)) return result([meme('under_promotion', to)]);
  if (move.promotion === 'q') return result([meme('pawn_promotion', to)]);

  if (game.isCheck()) {
    const king = findKingSquare(game, game.turn());
    return consecutiveChecks >= 3
      ? result([meme('check_consecutive_piece', to), meme('check_consecutive_king', king)])
      : result([meme('check_attacker', to), meme('check_king', king)]);
  }

  if (isSafeKingMove(move, wasInCheck)) return result([meme('safe_king', to)]);

  // Once per game per side: that side is losing badly.
  if (!shownPressure.w && evaluation < -PRESSURE_THRESHOLD) {
    return result([meme('king_under_pressure', findKingSquare(game, 'w'))], { showOnceFor: 'w' });
  }
  if (!shownPressure.b && evaluation > PRESSURE_THRESHOLD) {
    return result([meme('king_under_pressure', findKingSquare(game, 'b'))], { showOnceFor: 'b' });
  }

  if (isPawnNearPromotion(move)) return result([meme('pawn_at_6th_or_7th_rank', to, 'pawn_near_promotion')]);

  if (quality === 'blunder') {
    // Alternate perspective between blunders.
    return result([meme(blunderCount % 2 === 1 ? 'blunder_victim' : 'blunder_attacker', to)]);
  }
  if (quality === 'best' || quality === 'good') return result([meme('best_move', to)]);

  if (isScaredPiece(game, move)) return result([meme('scared_piece', to)]);
  if (move.captured) return result([meme('capture_bonus', to, 'capture')]);

  return null;
}

// Quiet moves only get a meme when the eval actually swung.
export function shouldShowMeme({ game, quality, evalLoss }) {
  if (game.isGameOver() || game.isCheck()) return true;
  if (quality === 'blunder' || quality === 'best' || quality === 'good') return true;
  return Math.abs(evalLoss) >= EVAL_SWING_THRESHOLD;
}

export function getResignMeme(game, resigningColor) {
  return result([meme('resign', findKingSquare(game, resigningColor))]);
}
