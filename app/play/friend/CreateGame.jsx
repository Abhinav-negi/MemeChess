'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ColorPicker, { resolveColor } from '@/components/game/ColorPicker';
import NotConfigured from '@/components/game/NotConfigured';
import { ensureUser, newGameId, supabase } from '@/lib/supabase';

export default function CreateGame() {
  const router = useRouter();
  const [color, setColor] = useState('w');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!supabase) return <NotConfigured />;

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const user = await ensureUser();
      const id = newGameId();
      const seat = resolveColor(color) === 'w' ? { white: user.id } : { black: user.id };
      const { error: insertError } = await supabase.from('games').insert({ id, ...seat });
      if (insertError) throw insertError;
      router.push(`/g/${id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-text">Play a friend</h1>
      <p className="mt-2 text-sm text-muted">
        Create a game, send the link, and it starts the moment they open it. You both get the memes.
      </p>
      <div className="card mt-8 flex flex-col gap-6 p-6">
        <ColorPicker value={color} onChange={setColor} />
        <button className="btn h-12 text-base" onClick={create} disabled={busy}>
          {busy ? 'Creating…' : 'Create invite link'}
        </button>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      </div>
    </div>
  );
}
