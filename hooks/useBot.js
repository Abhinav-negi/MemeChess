'use client';

import { useEffect, useRef } from 'react';
import Engine from '@/lib/engine';

/**
 * Plays `botColor` with its own Stockfish worker (separate from analysis).
 * Calls `onMove({from, to, promotion})` whenever it's the bot's turn in `fen` and `active`.
 * `hold` delays the move (not the search) so the bot never cuts a meme short.
 */
export function useBot({ bot, botColor, fen, active, hold = false, onMove }) {
  const engineRef = useRef(null);
  const onMoveRef = useRef(onMove);
  const handlerRef = useRef(null); // receives the bestmove of the live search
  const staleRef = useRef(0); // stopped searches whose bestmove must be ignored
  const holdRef = useRef(hold);
  const flushRef = useRef(null); // a found move waiting for the hold to lift

  useEffect(() => {
    onMoveRef.current = onMove;
  });

  useEffect(() => {
    const engine = new Engine();
    engineRef.current = engine;
    staleRef.current = 0;
    engine.setOption('Skill Level', bot.skill);
    const off = engine.onMessage(({ bestMove }) => {
      if (!bestMove) return;
      if (staleRef.current > 0) {
        staleRef.current -= 1;
        return;
      }
      handlerRef.current?.(bestMove);
    });
    return () => {
      off();
      engine.terminate();
    };
  }, [bot.skill]);

  useEffect(() => {
    const engine = engineRef.current;
    const botToMove = fen.split(' ')[1] === botColor;
    if (!engine || !active || !botToMove) return;

    let searching = true;
    let timer;
    const readyAt = Date.now() + bot.thinkMs;
    handlerRef.current = (bestMove) => {
      searching = false;
      if (bestMove === '(none)') return;
      const move = { from: bestMove.slice(0, 2), to: bestMove.slice(2, 4), promotion: bestMove[4] };
      const deliver = () => {
        if (holdRef.current) {
          flushRef.current = deliver; // released when the hold lifts
          return;
        }
        onMoveRef.current(move);
      };
      timer = setTimeout(deliver, Math.max(0, readyAt - Date.now()));
    };
    engine.searchDepth(fen, bot.depth);

    return () => {
      clearTimeout(timer);
      handlerRef.current = null;
      flushRef.current = null;
      if (searching) {
        staleRef.current += 1;
        engine.stop();
      }
    };
  }, [fen, botColor, active, bot.depth, bot.thinkMs]);

  // While `hold` is true (memes playing) the bot keeps thinking but doesn't move.
  useEffect(() => {
    holdRef.current = hold;
    if (!hold && flushRef.current) {
      const flush = flushRef.current;
      flushRef.current = null;
      flush();
    }
  }, [hold]);
}
