'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ensureUser, supabase } from '@/lib/supabase';

const SPECTATOR_POLL_MS = 3000;

// The server stores a space-separated SAN list; the game hook takes PGN.
function movesToPgn(moves) {
  const game = new Chess();
  for (const san of moves.split(' ').filter(Boolean)) game.move(san);
  return game.pgn();
}

const fetchGame = (gameId) => supabase.rpc('get_game', { p_id: gameId }).then(({ data }) => data);

/**
 * Syncs a `useMemeChess` game with the Supabase `games` row `gameId`.
 * Joins an empty seat while the game is waiting; otherwise the visitor spectates.
 * Players get live updates over Realtime; spectators can't read the row directly
 * (RLS), so they poll get_game.
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
      // Ignore out-of-order updates.
      if (rowRef.current && next.move_count < rowRef.current.move_count) return;
      rowRef.current = next;
      setRow(next);
      loadPgn(movesToPgn(next.moves));
    },
    [loadPgn]
  );

  useEffect(() => {
    let channel;
    let poll;
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

        const seated = data.white === user.id || data.black === user.id;
        if (!seated) {
          poll = setInterval(() => fetchGame(gameId).then(applyRow), SPECTATOR_POLL_MS);
          return;
        }
        channel = supabase
          .channel(`game:${gameId}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) =>
            applyRow(payload.new)
          )
          .subscribe((status) => {
            // After a (re)connect, fetch once in case events were missed.
            if (status === 'SUBSCRIBED') fetchGame(gameId).then(applyRow);
          });
      } catch (e) {
        if (!cancelled) setError(e.message?.includes('not found') ? 'This game does not exist.' : e.message);
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(poll);
      if (channel) supabase.removeChannel(channel);
    };
  }, [gameId, applyRow]);

  // Show the resign meme on both screens when the row says someone resigned.
  useEffect(() => {
    if (row?.reason === 'resignation' && !resigned) resign(row.winner === 'w' ? 'b' : 'w');
  }, [row, resigned, resign]);

  const myColor = !row || !userId ? null : row.white === userId ? 'w' : row.black === userId ? 'b' : null;

  /** Call after the move was applied locally: sends just that move. Rolls back to the server state on conflict. */
  const sendMove = useCallback(
    async (game, result) => {
      const current = rowRef.current;
      const { data, error: moveError } = await supabase.rpc('make_move', {
        p_id: gameId,
        p_move_count: current.move_count,
        p_san: game.history().at(-1),
        p_winner: result?.winner ?? null,
        p_reason: result?.reason ?? null,
      });
      if (moveError) {
        const fresh = await fetchGame(gameId);
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
