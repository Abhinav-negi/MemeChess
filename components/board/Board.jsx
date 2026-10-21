'use client';

import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import MemeLayer from './MemeLayer';
import { findKingSquare } from '@/lib/memes/detectors';

const LIGHT = '#b7c0c8';
const DARK = '#4b5563';
const LAST_MOVE = 'rgba(127, 216, 88, 0.35)';
const SELECTED = 'rgba(127, 216, 88, 0.55)';
const CHECK = 'radial-gradient(circle, rgba(255,77,79,.95) 0%, rgba(255,77,79,.5) 45%, transparent 75%)';
const DOT = 'radial-gradient(circle, rgba(0,0,0,.35) 22%, transparent 24%)';
const RING = 'radial-gradient(circle, transparent 58%, rgba(0,0,0,.35) 60%)';
const PROMOTION_PIECES = ['q', 'r', 'b', 'n'];
const PIECE_GLYPH = { w: { q: '♕', r: '♖', b: '♗', n: '♘' }, b: { q: '♛', r: '♜', b: '♝', n: '♞' } };

/**
 * Interactive board. `myColor` is the side the local player may move ('w' | 'b' | null for none).
 * `onMove({from,to,promotion})` returns true when the move was accepted.
 */
export default function Board({ game, fen, orientation = 'white', myColor, onMove, lastMove, memes, onMemeEnd }) {
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null); // {from, to} awaiting piece choice

  const canMove = myColor && game.turn() === myColor && !game.isGameOver();
  const legalFrom = (square) => (canMove ? game.moves({ square, verbose: true }) : []);

  function attempt(from, to) {
    const move = legalFrom(from).find((m) => m.to === to);
    if (!move) return false;
    setSelected(null);
    if (move.promotion) {
      setPromotion({ from, to });
      return 'promotion';
    }
    return onMove({ from, to });
  }

  function onSquareClick({ square }) {
    if (promotion) return;
    if (selected && attempt(selected, square)) return;
    const piece = game.get(square);
    setSelected(piece && piece.color === myColor && legalFrom(square).length ? square : null);
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare || promotion) return false;
    // Promotion drops snap back until a piece is chosen; the chosen move then updates `fen`.
    return attempt(sourceSquare, targetSquare) === true;
  }

  const styles = {};
  if (lastMove) {
    styles[lastMove.from] = { background: LAST_MOVE };
    styles[lastMove.to] = { background: LAST_MOVE };
  }
  if (selected) {
    styles[selected] = { background: SELECTED };
    for (const m of legalFrom(selected)) {
      styles[m.to] = { ...styles[m.to], backgroundImage: game.get(m.to) ? RING : DOT };
    }
  }
  if (game.isCheck()) {
    styles[findKingSquare(game, game.turn())] = { backgroundImage: CHECK };
  }

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-md border border-border">
      <Chessboard
        options={{
          id: 'memechess-board',
          position: fen,
          boardOrientation: orientation,
          squareStyles: styles,
          lightSquareStyle: { backgroundColor: LIGHT },
          darkSquareStyle: { backgroundColor: DARK },
          lightSquareNotationStyle: { color: DARK, fontWeight: 600 },
          darkSquareNotationStyle: { color: LIGHT, fontWeight: 600 },
          dropSquareStyle: { boxShadow: 'inset 0 0 0 3px rgba(127,216,88,.8)' },
          animationDurationInMs: 180,
          allowDrawingArrows: true,
          canDragPiece: ({ piece }) => Boolean(canMove) && piece.pieceType[0] === myColor && !promotion,
          onPieceDrop,
          onSquareClick,
        }}
      />

      <MemeLayer memes={memes} orientation={orientation} onEnd={onMemeEnd} />

      {promotion && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
          <div className="flex gap-2 rounded-lg border border-border bg-surface p-3" role="dialog" aria-label="Choose promotion piece">
            {PROMOTION_PIECES.map((p) => (
              <button
                key={p}
                autoFocus={p === 'q'}
                onClick={() => {
                  setPromotion(null);
                  onMove({ ...promotion, promotion: p });
                }}
                className="flex h-16 w-16 items-center justify-center rounded-md bg-raised text-5xl leading-none text-text transition hover:bg-accent hover:text-black"
                aria-label={`Promote to ${{ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[p]}`}
              >
                {PIECE_GLYPH[myColor ?? 'w'][p]}
              </button>
            ))}
            <button
              onClick={() => setPromotion(null)}
              className="ml-1 self-start text-sm text-muted hover:text-text"
              aria-label="Cancel promotion"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
