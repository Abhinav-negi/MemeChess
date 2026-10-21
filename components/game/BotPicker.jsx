'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BOTS, BOT_TIP } from '@/lib/bots';
import ColorPicker, { resolveColor } from './ColorPicker';

export default function BotPicker({ onStart }) {
  const [botId, setBotId] = useState(BOTS[1].id);
  const [color, setColor] = useState('w');
  const selectedBot = BOTS.find((b) => b.id === botId);

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-8 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-text">Choose your opponent</h1>
      <p className="mt-2 text-sm text-muted">Every bot gets memes too. Make it blunder.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" role="radiogroup" aria-label="Bot">
        {BOTS.map((bot) => {
          const selected = bot.id === botId;
          return (
            <button
              key={bot.id}
              role="radio"
              aria-checked={selected}
              onClick={() => setBotId(bot.id)}
              className={`group flex flex-col overflow-hidden rounded-lg border text-left transition ${selected ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-[#333]'}`}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-raised">
                <Image
                  src={bot.img}
                  alt={bot.name}
                  fill
                  sizes="(min-width: 1024px) 200px, 45vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 font-mono text-xs text-text backdrop-blur">
                  {bot.elo}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <span className="font-semibold text-text">{bot.name}</span>
                <span className="text-xs text-muted">{bot.description}</span>
                <span className="mt-auto pt-2 text-xs tracking-widest text-accent" aria-label={`Difficulty ${bot.stars} of 5`}>
                  {'★'.repeat(bot.stars)}
                  <span className="text-[#333]">{'★'.repeat(5 - bot.stars)}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <ColorPicker value={color} onChange={setColor} />
        <button className="btn h-12 px-8 text-base" onClick={() => onStart(botId, resolveColor(color))}>
          Play {selectedBot.name}
        </button>
      </div>

      <p className="mt-8 border-t border-border pt-4 text-sm text-muted">💡 {BOT_TIP}</p>
    </div>
  );
}
