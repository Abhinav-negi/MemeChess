import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { selectMeme, shouldShowMeme, getResignMeme } from '../lib/memes/selectMeme';
import { getRandomVideo, MEME_CATALOG, FALLBACKS } from '../lib/memes/catalog';
import { classifyMove } from '../lib/classifyMove';

// Plays `moves` from `fen` and returns the game plus the last verbose move.
function play(moves, fen) {
  const game = new Chess(fen);
  let move;
  for (const m of moves) move = game.move(m);
  return { game, move };
}

const reasons = (r) => r?.memes.map((m) => m.reason);
const squares = (r) => r?.memes.map((m) => m.square);

describe('selectMeme', () => {
  it('en passant only fires on actual en passant', () => {
    const ep = play(['exd6'], 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
    expect(reasons(selectMeme({ ...ep, quality: 'inaccuracy' }))).toEqual(['en_passant']);

    const normal = play(['e4', 'd5', 'exd5']);
    expect(reasons(selectMeme({ ...normal, quality: 'inaccuracy' }))).not.toContain('en_passant');
  });

  it('detects a royal fork (beats plain check)', () => {
    const r = selectMeme(play(['Nc7+'], 'q3k3/8/8/1N6/8/8/8/4K3 w - - 0 1'));
    expect(reasons(r)).toEqual(['royal_fork']);
    expect(squares(r)).toEqual(['c7']);
  });

  it('detects under-promotion and queen promotion', () => {
    expect(reasons(selectMeme(play(['a8=N'], '8/P7/8/8/8/8/8/k6K w - - 0 1')))).toEqual(['under_promotion']);
    expect(reasons(selectMeme(play(['a8=Q'], '8/P7/8/8/8/8/8/k6K w - - 0 1')))).toEqual(['pawn_promotion']);
  });

  it('checkmate puts memes on winner and loser kings', () => {
    const r = selectMeme(play(['f3', 'e5', 'g4', 'Qh4#']));
    expect(reasons(r)).toEqual(['checkmate_winner', 'checkmate_loser']);
    expect(squares(r)).toEqual(['e8', 'e1']);
    r.memes.forEach((m) => expect(m.videoUrl).toMatch(/^https:/));
  });

  it('stalemate puts a meme on every piece', () => {
    const r = selectMeme(play(['Qc7'], 'k7/8/2Q5/8/8/8/8/7K w - - 0 1'));
    expect(r.memes).toHaveLength(3);
    expect(new Set(reasons(r))).toEqual(new Set(['stalemate']));
  });

  it('check shows attacker + king, consecutive after 3', () => {
    const g = play(['e4', 'd5', 'Bb5+']);
    expect(squares(selectMeme(g))).toEqual(['b5', 'e8']);
    expect(reasons(selectMeme({ ...g, consecutiveChecks: 3 }))).toEqual([
      'check_consecutive_piece',
      'check_consecutive_king',
    ]);
  });

  it('scared piece: moved onto an attacked square', () => {
    const r = selectMeme({ ...play(['e4', 'e5', 'Ba6']), quality: 'inaccuracy' });
    expect(reasons(r)).toEqual(['scared_piece']);
  });

  it('blunders alternate attacker/victim, quality memes land on the destination square', () => {
    const g = play(['e4']);
    expect(reasons(selectMeme({ ...g, quality: 'blunder', blunderCount: 0 }))).toEqual(['blunder_attacker']);
    expect(reasons(selectMeme({ ...g, quality: 'blunder', blunderCount: 1 }))).toEqual(['blunder_victim']);
    expect(squares(selectMeme({ ...g, quality: 'best' }))).toEqual(['e4']);
  });

  it('king under pressure shows once per side', () => {
    const g = play(['e4']);
    expect(selectMeme({ ...g, quality: 'inaccuracy', evaluation: 4 })).toMatchObject({ showOnceFor: 'b' });
    expect(selectMeme({ ...g, quality: 'inaccuracy', evaluation: 4, shownPressure: { w: false, b: true } })).toBeNull();
  });

  it('resign meme sits on the resigning king', () => {
    expect(squares(getResignMeme(new Chess(), 'b'))).toEqual(['e8']);
  });
});

describe('shouldShowMeme', () => {
  it('skips small swings on quiet moves', () => {
    const { game } = play(['e4']);
    expect(shouldShowMeme({ game, quality: 'inaccuracy', evalLoss: 0.3 })).toBe(false);
    expect(shouldShowMeme({ game, quality: 'inaccuracy', evalLoss: 0.8 })).toBe(true);
    expect(shouldShowMeme({ game, quality: 'blunder', evalLoss: 3 })).toBe(true);
  });
});

describe('catalog', () => {
  it('every category resolves to a video (fallbacks included)', () => {
    for (const category of Object.keys(MEME_CATALOG)) {
      expect(getRandomVideo(category), category).toMatch(/\.mp4$/);
    }
    expect(getRandomVideo('checkmate_winner_king')).toContain(`/${FALLBACKS.checkmate_winner_king}_`);
  });
});

describe('classifyMove', () => {
  it('maps eval loss to quality', () => {
    expect(classifyMove(0.05)).toBe('best');
    expect(classifyMove(-3)).toBe('best');
    expect(classifyMove(0.4)).toBe('good');
    expect(classifyMove(0.9)).toBe('inaccuracy');
    expect(classifyMove(2)).toBe('mistake');
    expect(classifyMove(5)).toBe('blunder');
  });
});
