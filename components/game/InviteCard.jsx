'use client';

import { useEffect, useState } from 'react';

export default function InviteCard({ gameId }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/g/${gameId}`);
  }, [gameId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div className="card border-accent/40 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text">
        <span className="thinking-dots text-accent" aria-hidden>●</span> Waiting for your friend
      </div>
      <p className="mt-1 text-xs text-muted">The game starts as soon as they open this link.</p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Invite link"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-black px-3 font-mono text-xs text-text"
        />
        <button className="btn shrink-0" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      {canShare && (
        <button className="btn-ghost mt-2 w-full" onClick={() => navigator.share({ title: 'MemeChess', text: 'Play me on MemeChess', url })}>
          Share…
        </button>
      )}
    </div>
  );
}
