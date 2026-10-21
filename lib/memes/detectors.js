// Every detector runs on the game AFTER the move was played,
// so game.turn() is the opponent of the player who moved.

export function findKingSquare(game, color) {
  return findPieceSquares(game, 'k', color)[0] ?? null;
}

function findPieceSquares(game, type, color) {
  return game
    .board()
    .flat()
    .filter((p) => p && p.type === type && p.color === color)
    .map((p) => p.square);
}

export function isEnPassant(move) {
  return move.flags.includes('e');
}

// The moved piece attacks both the enemy king and an enemy queen.
export function isRoyalFork(game, move) {
  const enemy = game.turn();
  const king = findKingSquare(game, enemy);
  const queens = findPieceSquares(game, 'q', enemy);
  if (!king || queens.length === 0) return false;
  const hits = (sq) => game.attackers(sq, move.color).includes(move.to);
  return hits(king) && queens.some(hits);
}

export function isSafeKingMove(move, wasInCheck) {
  return wasInCheck && move.piece === 'k';
}

// Piece landed on a square the opponent attacks.
export function isScaredPiece(game, move) {
  return game.isAttacked(move.to, game.turn());
}

export function isPawnNearPromotion(move) {
  if (move.piece !== 'p' || move.promotion) return false;
  const rank = Number(move.to[1]);
  return move.color === 'w' ? rank === 6 || rank === 7 : rank === 2 || rank === 3;
}

export function isUnderPromotion(move) {
  return Boolean(move.promotion) && move.promotion !== 'q';
}

export function allPieceSquares(game) {
  return game.board().flat().filter(Boolean).map((p) => p.square);
}
