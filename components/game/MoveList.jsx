'use client';

import { useEffect, useRef } from 'react';

const MARK = {
  inaccuracy: { glyph: '?!', className: 'text-warn' },
  mistake: { glyph: '?', className: 'text-warn' },
  blunder: { glyph: '??', className: 'text-danger' },
  best: { glyph: '', className: 'text-accent' },
};

/** SAN moves in numbered pairs, annotated with move quality. Scrolls to the latest move. */
export default function MoveList({ history, qualities }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', inline: 'end' });
  }, [history.length]);

  const rows = [];
  for (let i = 0; i < history.length; i += 2) rows.push(i);

  const cell = (ply) => {
    const move = history[ply];
    if (!move) return <span />;
    const mark = MARK[qualities[ply + 1]];
    const isLast = ply === history.length - 1;
    return (
      <span
        className={`rounded px-1.5 py-0.5 font-mono ${isLast ? 'bg-raised text-text' : ''} ${mark?.className ?? 'text-text'}`}
      >
        {move.san}
        {mark?.glyph}
      </span>
    );
  };

  if (history.length === 0) {
    return <p className="px-3 py-4 text-sm text-muted">No moves yet. Make the first one.</p>;
  }

  return (
    <ol className="flex gap-1 overflow-x-auto px-2 py-2 text-sm md:block md:max-h-[340px] md:overflow-y-auto md:overflow-x-hidden md:px-0 md:py-0">
      {rows.map((ply) => (
        <li
          key={ply}
          className="grid shrink-0 grid-cols-[2rem_1fr_1fr] items-center md:px-3 md:py-1 md:odd:bg-surface md:even:bg-raised/40"
        >
          <span className="font-mono text-xs text-muted">{ply / 2 + 1}.</span>
          {cell(ply)}
          {cell(ply + 1)}
        </li>
      ))}
      <li ref={endRef} aria-hidden className="h-0 w-0" />
    </ol>
  );
}
