'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import EvalBar from '@/components/board/EvalBar';
import { squarePosition } from '@/components/board/MemeLayer';
import { getRandomVideo, posterUrl } from '@/lib/memes/catalog';

// Morphy vs Duke Karl / Count Isouard, Paris 1858: "The Opera Game".
const OPERA_GAME =
  '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#';

// Illustrative eval (White's view) after each ply; the real app computes it live with Stockfish.
const EVALS = [0.3, 0.3, 0.3, 0.4, 0.5, 0.6, 0.6, 1.2, 1.1, 1.2, 1.3, 1.4, 1.6, 1.4, 1.6, 1.9, 2.0, 2.6, 3.4, 3.1, 3.3, 3.0, 3.6, 3.6, 4.2, 4.4, 4.4, 5.2, 5.3, 6.0, 6.1, 100, 100, 100];

// ply (1-based, after the move) -> memes + the annotation glyph shown in the move readout.
const MOMENTS = {
  19: { glyph: '!!', memes: [['best_move', 'b5']] },
  21: { glyph: '+', memes: [['check_attacker', 'b5'], ['check_king', 'e8']] },
  31: { glyph: '!!', memes: [['best_move', 'b8']] },
  33: { glyph: '#', memes: [['checkmate_winner_king', 'c1'], ['checkmate_loser_king', 'e8']] },
};

const MOVE_MS = 1200;
// Start a few moves before the first meme so a visitor sees one within ~4 s.
const START_PLY = 16;
const MEME_HOLD_MS = 3200;
const END_HOLD_MS = 4000;

function buildFrames() {
  const source = new Chess();
  source.loadPgn(OPERA_GAME);
  const game = new Chess();
  const frames = [{ fen: game.fen(), last: null, ply: 0 }];
  source.history({ verbose: true }).forEach((move, i) => {
    game.move(move.san);
    frames.push({ fen: game.fen(), last: move, ply: i + 1 });
  });
  return frames;
}

/** Self-playing board for the landing page: shows the meme mechanic instead of describing it. */
export default function HeroDemo() {
  const frames = useMemo(() => buildFrames(), []);
  const videos = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(MOMENTS).map(([ply, m]) => [ply, m.memes.map(([cat, sq]) => ({ src: getRandomVideo(cat), sq }))])
      ),
    []
  );
  const [i, setI] = useState(START_PLY);

  useEffect(() => {
    // Reduced motion: stay on the starting position.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const atEnd = i === frames.length - 1;
    const hold = atEnd ? END_HOLD_MS : MOMENTS[i] ? MEME_HOLD_MS : MOVE_MS;
    const t = setTimeout(() => setI(atEnd ? 0 : i + 1), hold);
    return () => clearTimeout(t);
  }, [i, frames.length]);

  const { fen, last, ply } = frames[i];
  const moment = MOMENTS[ply];
  const evaluation = EVALS[ply];
  const highlight = last ? { [last.from]: { background: 'rgba(127,216,88,.35)' }, [last.to]: { background: 'rgba(127,216,88,.35)' } } : {};
  const moveNo = Math.ceil(ply / 2);
  const readout = last ? `${moveNo}.${last.color === 'b' ? '..' : ''} ${last.san.replace(/[+#]$/, '')}${moment?.glyph ?? (last.san.match(/[+#]$/)?.[0] ?? '')}` : 'Paris, 1858';

  return (
    <figure aria-label="Demo: a famous game replaying with memes on the key moves" className="w-full">
      <div className="flex gap-2">
        <div className="w-6 shrink-0" aria-hidden>
          <EvalBar evaluation={evaluation} mate={evaluation >= 100 ? 1 : null} />
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-border" aria-hidden>
          <Chessboard
            options={{
              id: 'hero-board',
              position: fen,
              squareStyles: highlight,
              lightSquareStyle: { backgroundColor: '#b7c0c8' },
              darkSquareStyle: { backgroundColor: '#4b5563' },
              showNotation: false,
              allowDragging: false,
              animationDurationInMs: 400,
            }}
          />
          {moment &&
            videos[ply].map(({ src, sq }) => (
              <div key={`${ply}-${sq}`} className="meme-pop absolute h-[12.5%] w-[12.5%]" style={squarePosition(sq, 'white')}>
                <video src={src} poster={posterUrl(src)} autoPlay muted playsInline className="h-full w-full bg-black object-cover ring-2 ring-inset ring-accent" />
              </div>
            ))}
        </div>
      </div>
      <figcaption className="mt-4 flex items-center justify-between pl-8 font-mono text-sm leading-6">
        <span className="text-muted">Morphy · The Opera Game</span>
        <span key={ply} className={`pill-in ${moment ? 'text-accent' : 'text-text'}`}>{readout}</span>
      </figcaption>
    </figure>
  );
}
