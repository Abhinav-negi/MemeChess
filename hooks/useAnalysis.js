'use client';

import { useEffect, useRef, useState } from 'react';
import Engine from '@/lib/engine';

const ANALYSIS_TIME_MS = 1000;
const MATE_SCORE = 100;

// Engine scores are from the side to move; convert to White's point of view.
function toWhitePov(fen, { cp, mate }) {
  const sign = fen.split(' ')[1] === 'w' ? 1 : -1;
  if (mate !== null) return { evaluation: sign * Math.sign(mate || -1) * MATE_SCORE, mate: sign * mate };
  return { evaluation: (sign * cp) / 100, mate: null };
}

/**
 * Analyses `fen` with Stockfish. Live eval for the bar, plus `onResult({fen, evaluation, mate})`
 * once per position when the search finishes. Positions are searched one at a time:
 * a stopped search still reports its bestmove, which must be credited to the right fen.
 */
export function useAnalysis(fen, { enabled = true, onResult } = {}) {
  const [live, setLive] = useState({ evaluation: 0, mate: null });
  const engineRef = useRef(null);
  const searchingRef = useRef(null); // fen currently being searched
  const queuedRef = useRef(null); // fen waiting for the engine
  const scoreRef = useRef(null); // latest score of the current search
  const onResultRef = useRef(onResult);
  const startRef = useRef(null);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const engine = new Engine();
    engineRef.current = engine;
    searchingRef.current = null; // a previous (strict-mode) engine may have been mid-search

    const start = (target) => {
      searchingRef.current = target;
      scoreRef.current = null;
      engine.analyse(target, ANALYSIS_TIME_MS);
    };

    const off = engine.onMessage((msg) => {
      if (msg.raw === 'readyok' && queuedRef.current) {
        start(queuedRef.current);
        queuedRef.current = null;
        return;
      }
      const searching = searchingRef.current;
      if (!searching) return;

      if (msg.cp !== null || msg.mate !== null) {
        const score = toWhitePov(searching, msg);
        scoreRef.current = score;
        if (!queuedRef.current) setLive(score);
      }

      if (msg.bestMove) {
        if (scoreRef.current) onResultRef.current?.({ fen: searching, ...scoreRef.current });
        searchingRef.current = null;
        if (queuedRef.current) {
          start(queuedRef.current);
          queuedRef.current = null;
        }
      }
    });

    startRef.current = start;
    return () => {
      off();
      engine.terminate();
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !enabled) return;
    if (!engine.isReady || searchingRef.current) {
      queuedRef.current = fen;
      if (searchingRef.current) engine.stop();
      return;
    }
    startRef.current(fen);
  }, [fen, enabled]);

  return live;
}
