'use client';

const OPTIONS = [
  { value: 'w', label: 'White', swatch: 'bg-[#ededed]' },
  { value: 'random', label: 'Random', swatch: 'bg-gradient-to-r from-[#ededed] from-50% to-[#333] to-50%' },
  { value: 'b', label: 'Black', swatch: 'bg-[#333]' },
];

export const resolveColor = (value) => (value === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : value);

export default function ColorPicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Play as</legend>
      <div className="inline-flex rounded-md border border-border bg-surface p-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`flex h-9 items-center gap-2 rounded px-3 text-sm transition ${value === o.value ? 'bg-raised text-text' : 'text-muted hover:text-text'}`}
          >
            <span className={`h-3.5 w-3.5 rounded-full border border-[#444] ${o.swatch}`} aria-hidden />
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
