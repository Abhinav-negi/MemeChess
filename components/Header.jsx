'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { setMusic, setMuted, startMusicOnFirstGesture, useMuted, useMusic } from '@/lib/sound';

const NAV = [
  { href: '/play/bot', label: 'Play Bot', short: 'Bot' },
  { href: '/play/friend', label: 'Play a Friend', short: 'Friend' },
];

// Sizes and spacing on the 8px grid: 64px bar, 32px controls, 8/16/32px gaps.
export default function Header() {
  const pathname = usePathname();
  const muted = useMuted();
  const music = useMusic();

  useEffect(() => startMusicOnFirstGesture(), []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-black/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1184px] items-center gap-2 px-4 sm:gap-8">
        <Link href="/" className="whitespace-nowrap font-display text-[24px] uppercase leading-8 tracking-wide text-text">
          Meme <span className="text-accent">Chess</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm leading-6">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-8 items-center whitespace-nowrap rounded-lg px-2 transition sm:px-4 ${active ? 'bg-raised text-text' : 'text-muted hover:text-text'}`}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <IconToggle
            on={music && !muted}
            disabled={muted}
            onClick={() => setMusic(!music)}
            label={music ? 'Turn music off' : 'Turn music on'}
          >
            <MusicIcon off={!music || muted} />
          </IconToggle>
          <IconToggle on={!muted} onClick={() => setMuted(!muted)} label={muted ? 'Unmute all sound' : 'Mute all sound'}>
            {muted ? <SpeakerOff /> : <SpeakerOn />}
          </IconToggle>
        </div>
      </div>
    </header>
  );
}

function IconToggle({ on, disabled, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={on}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-raised disabled:opacity-40 ${on ? 'text-text' : 'text-muted'}`}
    >
      {children}
    </button>
  );
}

const icon = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function MusicIcon({ off }) {
  return (
    <svg {...icon} aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

function SpeakerOn() {
  return (
    <svg {...icon} aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg {...icon} aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="m22 9-6 6M16 9l6 6" />
    </svg>
  );
}
