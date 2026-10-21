import Image from 'next/image';

const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
const ORDER = ['q', 'r', 'b', 'n', 'p'];

// Pieces `color` has captured, and its material lead.
function captures(history, color) {
  const taken = (c) => history.filter((m) => m.color === c && m.captured).map((m) => m.captured);
  const mine = taken(color);
  const theirs = taken(color === 'w' ? 'b' : 'w');
  const sum = (list) => list.reduce((s, p) => s + VALUE[p], 0);
  return {
    pieces: mine.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)),
    lead: sum(mine) - sum(theirs),
  };
}

export default function PlayerCard({ name, subtitle, avatar, img, color, history, active, thinking }) {
  const { pieces, lead } = captures(history, color);
  return (
    <div className="flex h-12 items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border text-lg ${active ? 'border-accent' : 'border-border'} ${color === 'w' ? 'bg-[#ededed] text-black' : 'bg-raised'}`}
        aria-hidden
      >
        {img ? <Image src={img} alt="" width={36} height={36} className="h-full w-full object-cover" /> : avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-text">{name}</span>
          {subtitle && <span className="truncate text-xs text-muted">{subtitle}</span>}
          {thinking && <span className="thinking-dots text-xs text-accent" aria-label="Thinking">●●●</span>}
        </div>
        <div className="flex h-4 items-center gap-1 text-xs leading-none text-muted">
          <span className="tracking-[-0.15em]">{pieces.map((p) => GLYPH[p]).join('')}</span>
          {lead > 0 && <span className="ml-1 font-mono">+{lead}</span>}
        </div>
      </div>
    </div>
  );
}
