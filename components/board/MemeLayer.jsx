'use client';

import { useEffect, useRef } from 'react';
import { setMemePlaying, useMuted } from '@/lib/sound';
import { posterUrl } from '@/lib/memes/catalog';

const MAX_MS = 4500; // clips are trimmed to 4 s on the CDN; this guards stalled loads

// Square → percent offsets, so memes stay aligned at any board size and orientation.
export function squarePosition(square, orientation) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 8 - rank : rank - 1;
  return { left: `${col * 12.5}%`, top: `${row * 12.5}%` };
}

export default function MemeLayer({ memes, orientation, onEnd }) {
  const muted = useMuted();
  const playing = memes.length > 0;

  useEffect(() => {
    setMemePlaying(playing);
  }, [playing]);
  useEffect(() => () => setMemePlaying(false), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {memes.map((meme, i) => (
        <MemeVideo
          key={meme.id}
          meme={meme}
          // Many simultaneous memes (stalemate): only the first one plays sound.
          muted={muted || i > 0}
          style={squarePosition(meme.square, orientation)}
          onEnd={onEnd}
        />
      ))}
    </div>
  );
}

function MemeVideo({ meme, muted, style, onEnd }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    const done = () => onEnd(meme.id);
    const timer = setTimeout(done, MAX_MS);
    // Autoplay with sound can be refused; retry muted rather than skipping the meme.
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(done);
    });
    return () => clearTimeout(timer);
  }, [meme.id, onEnd]);

  return (
    <div className="meme-pop absolute h-[12.5%] w-[12.5%]" style={style}>
      <video
        ref={ref}
        src={meme.videoUrl}
        poster={posterUrl(meme.videoUrl)}
        muted={muted}
        playsInline
        preload="auto"
        onEnded={() => onEnd(meme.id)}
        onError={() => onEnd(meme.id)}
        className="h-full w-full bg-black object-cover ring-2 ring-inset ring-accent shadow-[0_0_18px_rgba(127,216,88,.35)]"
      />
    </div>
  );
}
