'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { useAnalysis } from './useAnalysis';
import { classifyMove } from '@/lib/classifyMove';
import { selectMeme, shouldShowMeme, getResignMeme } from '@/lib/memes/selectMeme';
import { playSound } from '@/lib/sound';

/**
 * The game + analysis + meme pipeline shared by bot and friend modes.
 * Flow: move played → analysis of the new position finishes → eval swing vs the
 * previous position classifies the move → selectMeme puts a video on the last-move square.
 */
export function useMemeChess() {
  // Chess instances are treated as immutable: every move produces a new one for render,
  // while gameRef always holds the latest for callbacks.
  const [game, setGame] = useState(() => new Chess());
  const gameRef = useRef(game);
  const fen = game.fen();
  const [qualities, setQualities] = useState({}); // ply -> quality
  const [memes, setMemes] = useState([]);
  const [resigned, setResigned] = useState(null); // color that resigned
  const [awaitingFen, setAwaitingFen] = useState(null); // position whose meme isn't decided yet

  const evalsRef = useRef({}); // fen -> final white-POV eval
  const pendingRef = useRef({}); // fen after move -> move context waiting for its eval
  const statsRef = useRef(freshStats());
  const memeIdRef = useRef(0);

  const gameOver = game.isGameOver() || Boolean(resigned);

  const showMemes = useCallback((picked) => {
    if (!picked) return;
    setMemes(picked.memes.map((m) => ({ ...m, id: ++memeIdRef.current })));
  }, []);

  const runMemes = useCallback(
    (ctx, evaluation, quality, evalLoss) => {
      const stats = statsRef.current;
      if (quality === 'blunder') stats.blunderCount += 1;
      if (!shouldShowMeme({ game: ctx.game, quality, evalLoss })) return;
      const picked = selectMeme({
        game: ctx.game,
        move: ctx.move,
        quality,
        blunderCount: stats.blunderCount,
        wasInCheck: ctx.wasInCheck,
        consecutiveChecks: ctx.consecutiveChecks,
        shownPressure: stats.shownPressure,
        evaluation,
      });
      if (picked?.showOnceFor) stats.shownPressure[picked.showOnceFor] = true;
      showMemes(picked);
    },
    [showMemes]
  );

  const onResult = useCallback(
    ({ fen: analysedFen, evaluation }) => {
      evalsRef.current[analysedFen] = evaluation;
      setAwaitingFen((f) => (f === analysedFen ? null : f));
      const ctx = pendingRef.current[analysedFen];
      if (!ctx) return;
      delete pendingRef.current[analysedFen];
      const before = evalsRef.current[ctx.fenBefore];
      if (before === undefined) return; // previous position never finished analysing
      const evalLoss = ctx.move.color === 'w' ? before - evaluation : evaluation - before;
      const quality = classifyMove(evalLoss);
      setQualities((q) => ({ ...q, [ctx.ply]: quality }));
      runMemes(ctx, evaluation, quality, evalLoss);
    },
    [runMemes]
  );

  const live = useAnalysis(fen, { enabled: !gameOver, onResult });

  // If analysis ever stalls, don't leave whoever waits on memesSettled (the bot) stuck.
  useEffect(() => {
    if (!awaitingFen) return;
    const t = setTimeout(() => setAwaitingFen((f) => (f === awaitingFen ? null : f)), 5000);
    return () => clearTimeout(t);
  }, [awaitingFen]);

  /** Plays a move ({from,to,promotion} or SAN). Returns the verbose move or null if illegal. */
  const makeMove = useCallback(
    (input) => {
      const g = cloneGame(gameRef.current);
      if (g.isGameOver()) return null;
      const fenBefore = g.fen();
      const wasInCheck = g.isCheck();
      let move;
      try {
        move = g.move(input);
      } catch {
        return null;
      }
      const stats = statsRef.current;
      stats.consecutiveChecks = g.isCheck() ? stats.consecutiveChecks + 1 : 0;
      const ctx = {
        game: g,
        move,
        fenBefore,
        wasInCheck,
        consecutiveChecks: stats.consecutiveChecks,
        ply: g.history().length,
      };

      playSound(moveSound(g, move));

      // Game-over positions can't be analysed; their memes don't depend on eval.
      if (g.isGameOver()) {
        runMemes(ctx, evalsRef.current[fenBefore] ?? 0, null, 0);
      } else {
        pendingRef.current[g.fen()] = ctx;
        setAwaitingFen(g.fen());
      }

      gameRef.current = g;
      setGame(g);
      return move;
    },
    [runMemes]
  );

  /** Replaces the game with a PGN (online sync / restore). Only the newest move gets memes. */
  const loadPgn = useCallback(
    (pgn) => {
      const next = new Chess();
      next.loadPgn(pgn || '');
      const current = gameRef.current.history();
      const incoming = next.history();
      const isOneAhead =
        incoming.length === current.length + 1 && current.every((san, i) => san === incoming[i]);
      if (isOneAhead) return makeMove(incoming[incoming.length - 1]);
      if (incoming.length === current.length && current.every((san, i) => san === incoming[i])) return null;
      gameRef.current = next;
      setGame(next);
      setAwaitingFen(null);
      return null;
    },
    [makeMove]
  );

  const resign = useCallback(
    (color) => {
      setResigned(color);
      showMemes(getResignMeme(gameRef.current, color));
    },
    [showMemes]
  );

  const reset = useCallback(() => {
    const fresh = new Chess();
    gameRef.current = fresh;
    evalsRef.current = {};
    pendingRef.current = {};
    statsRef.current = freshStats();
    setQualities({});
    setMemes([]);
    setResigned(null);
    setAwaitingFen(null);
    setGame(fresh);
  }, []);

  const getGame = useCallback(() => gameRef.current, []);
  const removeMeme = useCallback((id) => setMemes((ms) => ms.filter((m) => m.id !== id)), []);

  const history = game.history({ verbose: true });

  return {
    game,
    getGame, // latest game inside callbacks, right after makeMove
    fen,
    history,
    lastMove: history[history.length - 1] ?? null,
    evaluation: live.evaluation,
    mate: live.mate,
    qualities,
    memes,
    removeMeme,
    // True once the last move's meme is decided and every meme has finished playing.
    memesSettled: !awaitingFen && memes.length === 0,
    makeMove,
    loadPgn,
    resign,
    resigned,
    reset,
    result: getResult(game, resigned),
  };
}

function moveSound(game, move) {
  if (game.isCheckmate()) return 'checkmate';
  if (game.isStalemate()) return 'stalemate';
  if (game.isCheck()) return 'check';
  if (move.flags.includes('k') || move.flags.includes('q')) return 'castle';
  if (move.captured) return 'capture';
  return 'move';
}

function cloneGame(g) {
  const copy = new Chess();
  copy.loadPgn(g.pgn());
  return copy;
}

function freshStats() {
  return { blunderCount: 0, consecutiveChecks: 0, shownPressure: { w: false, b: false } };
}

// { winner: 'w'|'b'|null, reason } or null while the game is on.
export function getResult(game, resigned) {
  if (resigned) return { winner: resigned === 'w' ? 'b' : 'w', reason: 'resignation' };
  if (game.isCheckmate()) return { winner: game.turn() === 'w' ? 'b' : 'w', reason: 'checkmate' };
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' };
  if (game.isInsufficientMaterial()) return { winner: null, reason: 'insufficient material' };
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'threefold repetition' };
  if (game.isDraw()) return { winner: null, reason: '50-move rule' };
  return null;
}
