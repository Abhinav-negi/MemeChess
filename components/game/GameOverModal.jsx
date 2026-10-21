'use client';

import { useState } from 'react';

/** Result sheet. Reopens for each new result; can be dismissed to look at the board. */
export default function GameOverModal({ result, myColor, actions }) {
  const [dismissedFor, setDismissedFor] = useState(null);
  const key = result && `${result.winner}-${result.reason}`;
  if (!result || dismissedFor === key) return null;

  const title =
    result.winner === null
      ? 'Draw'
      : myColor
        ? result.winner === myColor
          ? 'You won'
          : 'You lost'
        : `${result.winner === 'w' ? 'White' : 'Black'} won`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Game over</p>
        <h2 id="result-title" className="mt-2 text-3xl font-bold text-text">{title}</h2>
        <p className="mt-1 text-sm text-muted">by {result.reason}</p>
        <div className="mt-6 flex flex-col gap-2">
          {actions}
          <button onClick={() => setDismissedFor(key)} className="btn-ghost">
            View board
          </button>
        </div>
      </div>
    </div>
  );
}
