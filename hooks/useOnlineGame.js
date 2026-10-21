'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureUser, supabase } from '@/lib/supabase';

/**
 * Syncs a `useMemeChess` game with the Supabase `games` row `gameId`.
 * Joins an empty seat if there is one; otherwise the visitor spectates.
 */
export function useOnlineGame(gameId, chess) {
  const { loadPgn, resign, resigned } = chess;
  const [row, setRow] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const rowRef = useRef(null);

  const applyRow = useCallback(
    (next) => {
      if (!next) return;
      // Ignore out-of-order realtime events.
      if (rowRef.current && next.move_count < rowRef.current.move_count) return;
      rowRef.current = next;
      setRow(next);
      loadPgn(next.pgn);
    },
    [loadPgn]
  );

  useEffect(() => {
    let channel;
    let cancelled = false;
    (async () => {
      try {
        const user = await ensureUser();
        if (cancelled) return;
        setUserId(user.id);
        const { data, error: joinError } = await supabase.rpc('join_game', { p_id: gameId });
        if (joinError) throw joinError;
        if (cancelled) return;
        applyRow(data);
        channel = supabase
          .channel(`game:${gameId}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) =>
            applyRow(payload.new)
          )
          .subscribe((status) => {
            // After a reconnect, fetch once in case events were missed.
            if (status === 'SUBSCRIBED') {
              supabase.from('games').select('*').eq('id', gameId).single().then(({ data: fresh }) => applyRow(fresh));
            }
          });
      } catch (e) {
        if (!cancelled) setError(e.message?.includes('not found') ? 'This game does not exist.' : e.message);
      }
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [gameId, applyRow]);

  // Show the resign meme on both screens when the row says someone resigned.
  useEffect(() => {
    if (row?.reason === 'resignation' && !resigned) resign(row.winner === 'w' ? 'b' : 'w');
  }, [row, resigned, resign]);

  const myColor = !row || !userId ? null : row.white === userId ? 'w' : row.black === userId ? 'b' : null;

  /** Call after the move was applied locally. Rolls back to the server state on conflict. */
  const sendMove = useCallback(
    async (game, result) => {
      const current = rowRef.current;
      const { data, error: moveError } = await supabase.rpc('make_move', {
        p_id: gameId,
        p_move_count: current.move_count,
        p_pgn: game.pgn(),
        p_winner: result?.winner ?? null,
        p_reason: result?.reason ?? null,
      });
      if (moveError) {
        const { data: fresh } = await supabase.from('games').select('*').eq('id', gameId).single();
        rowRef.current = null;
        applyRow(fresh);
        return;
      }
      applyRow(data);
    },
    [gameId, applyRow]
  );

  const sendResign = useCallback(async () => {
    const { data } = await supabase.rpc('resign_game', { p_id: gameId });
    applyRow(data);
  }, [gameId, applyRow]);

  return { row, myColor, error, sendMove, sendResign };
}
