'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import GameLayout from '@/components/game/GameLayout';
import InviteCard from '@/components/game/InviteCard';
import NotConfigured from '@/components/game/NotConfigured';
import { useMemeChess, getResult } from '@/hooks/useMemeChess';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { supabase } from '@/lib/supabase';

export default function OnlineGame({ gameId }) {
  if (!supabase) return <NotConfigured />;
  return <Online gameId={gameId} />;
}

function Online({ gameId }) {
  const chess = useMemeChess();
  const { row, myColor, error, sendMove, sendResign } = useOnlineGame(gameId, chess);
  const [flipped, setFlipped] = useState(false);
  const { makeMove, getGame, resign, result } = chess;

  const waiting = row?.status === 'waiting';
  const onMove = useCallback(
    (m) => {
      if (waiting) return false;
      const move = makeMove(m);
      if (!move) return false;
      const latest = getGame();
      sendMove(latest, getResult(latest, null));
      return true;
    },
    [waiting, makeMove, getGame, sendMove]
  );

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="card p-6">
          <h1 className="text-lg font-semibold text-text">Couldn’t open this game</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link href="/play/friend" className="btn mt-4">Create a new game</Link>
        </div>
      </div>
    );
  }
  if (!row) return <p className="px-4 py-16 text-center text-sm text-muted">Loading game…</p>;

  const spectating = !myColor;
  const base = myColor === 'b' ? 'black' : 'white';
  const orientation = flipped ? (base === 'white' ? 'black' : 'white') : base;
  const label = (color) => {
    if (spectating) return color === 'w' ? 'White' : 'Black';
    if (color === myColor) return 'You';
    return waiting ? 'Waiting…' : 'Friend';
  };
  const player = (color) => ({ name: label(color), avatar: color === myColor ? '🙂' : '🎭', color });
  const bottomColor = orientation === 'white' ? 'w' : 'b';

  return (
    <GameLayout
      chess={chess}
      orientation={orientation}
      myColor={waiting ? null : myColor}
      onMove={onMove}
      top={player(bottomColor === 'w' ? 'b' : 'w')}
      bottom={player(bottomColor)}
      panelTop={
        waiting && !spectating ? (
          <InviteCard gameId={gameId} />
        ) : spectating ? (
          <div className="card px-4 py-3 text-sm text-muted">You’re spectating this game.</div>
        ) : null
      }
      actions={
        <>
          <button className="btn-ghost flex-1" onClick={() => setFlipped((f) => !f)}>Flip</button>
          {!spectating && !result && !waiting && (
            <button
              className="btn-danger flex-1"
              onClick={() => {
                resign(myColor);
                sendResign();
              }}
            >
              Resign
            </button>
          )}
          <Link href="/play/friend" className="btn-ghost flex-1">New game</Link>
        </>
      }
      modalActions={<Link href="/play/friend" className="btn">New game</Link>}
    />
  );
}
