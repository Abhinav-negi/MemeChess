import { Chess } from 'chess.js';

// The server stores a space-separated SAN list; the game hook takes PGN.
// The server only format-checks moves, so replay defensively: stop at the first
// illegal one (a tampered client) instead of throwing inside a Realtime callback.
export function movesToPgn(moves) {
  const game = new Chess();
  for (const san of moves.split(' ').filter(Boolean)) {
    try {
      game.move(san);
    } catch {
      return { pgn: game.pgn(), corrupt: true };
    }
  }
  return { pgn: game.pgn(), corrupt: false };
}
