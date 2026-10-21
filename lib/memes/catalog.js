// Videos live on Cloudinary as <category>_<n>.mp4.
// The transform shrinks clips to ~150 KB and trims them to 4 s on the CDN.
const CLOUDINARY_BASE = 'https://res.cloudinary.com/deb9vep8z/video/upload';
const TRANSFORM = 'q_auto,w_320,eo_4';
const VERSION = 'v1771148992';

// category -> number of uploaded clips. 0 = not uploaded yet (uses FALLBACKS).
export const MEME_CATALOG = {
  check_attacker: 1,
  check_consecutive_king: 0,
  check_consecutive_piece: 0,
  check_king: 2,
  checkmate_loser_king: 0,
  checkmate_winner_king: 0,
  king_under_pressure: 1,
  pawn_at_6th_or_7th_rank: 0,
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

// Missing clips borrow from a similar category until they are uploaded.
export const FALLBACKS = {
  checkmate_winner_king: 'best_move',
  checkmate_loser_king: 'blunder_victim',
  check_consecutive_king: 'check_king',
  check_consecutive_piece: 'check_attacker',
  pawn_at_6th_or_7th_rank: 'pawn_promotion',
};

export function memeUrl(category, n) {
  return `${CLOUDINARY_BASE}/${TRANSFORM}/${VERSION}/${category}_${n}.mp4`;
}

// First frame as a JPEG (Cloudinary derives it from the same path), shown while the clip loads.
export const posterUrl = (videoUrl) => videoUrl.replace(/\.mp4$/, '.jpg');

export function allMemeUrls() {
  return Object.entries(MEME_CATALOG).flatMap(([category, count]) =>
    Array.from({ length: count }, (_, i) => memeUrl(category, i + 1))
  );
}

export function getRandomVideo(category) {
  const resolved = MEME_CATALOG[category] ? category : FALLBACKS[category];
  const count = MEME_CATALOG[resolved];
  if (!count) return null;
  return memeUrl(resolved, 1 + Math.floor(Math.random() * count));
}
