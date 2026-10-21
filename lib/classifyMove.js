// evalLoss: pawns the mover gave away (positive = worse for the mover).
export function classifyMove(evalLoss) {
  // Gains count as best: the old Math.abs() labelled big gains as blunders.
  const loss = Math.max(0, evalLoss);
  if (loss <= 0.1) return 'best';
  if (loss <= 0.5) return 'good';
  if (loss <= 1.0) return 'inaccuracy';
  if (loss <= 2.5) return 'mistake';
  return 'blunder';
}

export const QUALITY_LABELS = {
  best: 'Best move',
  good: 'Good move',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
};
