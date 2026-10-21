'use client';

import { useCallback, useEffect, useState } from 'react';
import GameLayout from '@/components/game/GameLayout';
import BotPicker from '@/components/game/BotPicker';
import { useMemeChess } from '@/hooks/useMemeChess';
import { useBot } from '@/hooks/useBot';
import { getBot } from '@/lib/bots';
import { playSound } from '@/lib/sound';

const SAVE_KEY = 'memechess:bot-game';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

export default function BotGame() {
  const [setup, setSetup] = useState(null); // { botId, color, pgn? }
  const [ready, setReady] = useState(false);

  // Resume an unfinished game after mount (localStorage isn't available during SSR).
  useEffect(() => {
    const saved = loadSaved();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only restore
    if (saved?.botId) setSetup(saved);
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!setup) {
    return (
      <BotPicker
        onStart={(botId, color) => setSetup({ botId, color, nonce: Date.now() })}
      />
    );
  }
  return (
    <Game
      key={`${setup.botId}-${setup.color}-${setup.nonce ?? 0}`}
      setup={setup}
      onNewGame={() => {
        localStorage.removeItem(SAVE_KEY);
        setSetup(null);
      }}
      onRematch={() => {
        localStorage.removeItem(SAVE_KEY);
        setSetup({ botId: setup.botId, color: setup.color, nonce: Date.now() });
      }}
    />
  );
}

function Game({ setup, onNewGame, onRematch }) {
  const bot = getBot(setup.botId);
  const myColor = setup.color;
  const botColor = myColor === 'w' ? 'b' : 'w';
  const chess = useMemeChess();
  const { fen, game, makeMove, loadPgn, result, resign, memesSettled } = chess;
  const [flipped, setFlipped] = useState(false);
  const [showEval, setShowEval] = useState(false);

  useEffect(() => {
    if (!setup.pgn) playSound('start');
  }, [setup.pgn]);

  useEffect(() => {
    if (setup.pgn) loadPgn(setup.pgn);
  }, [setup.pgn, loadPgn]);

  // Save after every move; clear once the game is over.
  useEffect(() => {
    if (result) localStorage.removeItem(SAVE_KEY);
    else if (game.history().length) {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ botId: bot.id, color: myColor, pgn: game.pgn() }));
    }
  }, [fen, result, game, bot.id, myColor]);

  const botThinking = !result && fen.split(' ')[1] === botColor;
  // The bot thinks while memes play but only moves once they've finished.
  useBot({ bot, botColor, fen, active: !result, hold: !memesSettled, onMove: makeMove });

  const onMove = useCallback((m) => Boolean(makeMove(m)), [makeMove]);
  const mine = myColor === 'w' ? 'white' : 'black';
  const orientation = flipped ? (mine === 'white' ? 'black' : 'white') : mine;

  const me = { name: 'You', avatar: '🙂', color: myColor };
  const them = { name: bot.name, subtitle: `${bot.elo}`, img: bot.img, color: botColor, thinking: botThinking };
  const bottomIsMe = orientation === mine;

  return (
    <GameLayout
      chess={chess}
      orientation={orientation}
      myColor={myColor}
      onMove={onMove}
      showEval={showEval}
      top={bottomIsMe ? them : me}
      bottom={bottomIsMe ? me : them}
      actions={
        <>
          <button className="btn-ghost flex-1" onClick={() => setShowEval((v) => !v)} aria-pressed={showEval}>
            {showEval ? 'Hide eval' : 'Show eval'}
          </button>
          <button className="btn-ghost flex-1" onClick={() => setFlipped((f) => !f)}>Flip</button>
          {!result && (
            <button className="btn-danger flex-1" onClick={() => resign(myColor)}>Resign</button>
          )}
          <button className="btn-ghost flex-1" onClick={onNewGame}>New game</button>
        </>
      }
      modalActions={
        <>
          <button className="btn" onClick={onRematch}>Rematch {bot.name}</button>
          <button className="btn-ghost" onClick={onNewGame}>Choose another bot</button>
        </>
      }
    />
  );
}
