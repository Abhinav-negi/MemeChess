-- Online games between two anonymous players.
-- Rows are readable only by the two seated players; everyone else (including
-- spectators) must know the exact game id and go through get_game(), so ids
-- can't be listed or enumerated. Every write goes through the security definer
-- functions below, which enforce seats, turn order, one move per call,
-- valid results and optimistic concurrency (move_count).
-- shortcut: move legality is checked by chess.js in the client only; replay the
-- move list in an Edge Function before trusting results for ratings/prizes.

create table public.games (
  id          text primary key check (id ~ '^[a-z0-9]{8}$'),
  white       uuid references auth.users on delete set null,
  black       uuid references auth.users on delete set null,
  moves       text not null default '' check (length(moves) <= 8000), -- space-separated SAN
  move_count  int  not null default 0 check (move_count between 0 and 600),
  status      text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  winner      text check (winner in ('w', 'b')),
  reason      text check (reason in ('checkmate', 'stalemate', 'insufficient material',
                                     'threefold repetition', '50-move rule', 'resignation')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.games enable row level security;

-- Players can read their own game (also what Realtime uses to deliver updates).
create policy "players read their game" on public.games
  for select to authenticated
  using (auth.uid() = white or auth.uid() = black);

create policy "creator takes a seat in a fresh game" on public.games
  for insert to authenticated
  with check (
    ((white = auth.uid() and black is null) or (black = auth.uid() and white is null))
    and status = 'waiting' and moves = '' and move_count = 0
    and winner is null and reason is null
  );

-- No update/delete policies: writes only via the functions below.

-- Read one game by exact id (spectators, and players before Realtime connects).
create or replace function public.get_game(p_id text)
returns public.games
language sql stable security definer set search_path = public
as $$ select * from games where id = p_id $$;

create or replace function public.join_game(p_id text)
returns public.games
language plpgsql security definer set search_path = public
as $$
declare g public.games;
begin
  select * into g from games where id = p_id for update;
  if not found then raise exception 'game not found'; end if;
  if auth.uid() is null then raise exception 'not signed in'; end if;
  -- Seats can only be taken while the game is still waiting; otherwise the caller spectates.
  if g.status <> 'waiting' or g.white = auth.uid() or g.black = auth.uid() then return g; end if;

  if g.white is null then
    update games set white = auth.uid(), status = 'active', updated_at = now() where id = p_id returning * into g;
  elsif g.black is null then
    update games set black = auth.uid(), status = 'active', updated_at = now() where id = p_id returning * into g;
  end if;
  return g;
end $$;

-- Appends exactly one move. p_winner/p_reason only when that move ends the game.
create or replace function public.make_move(
  p_id text, p_move_count int, p_san text, p_winner text default null, p_reason text default null
)
returns public.games
language plpgsql security definer set search_path = public
as $$
declare
  g public.games;
  mover text;
begin
  select * into g from games where id = p_id for update;
  if not found then raise exception 'game not found'; end if;
  if g.status <> 'active' then raise exception 'game is not active'; end if;
  if g.move_count <> p_move_count then raise exception 'stale move'; end if;

  mover := case when g.move_count % 2 = 0 then 'w' else 'b' end;
  if auth.uid() is distinct from (case when mover = 'w' then g.white else g.black end) then
    raise exception 'not your turn';
  end if;

  if p_san !~ '^(O-O(-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?)[+#]?$' then
    raise exception 'malformed move';
  end if;

  -- Results must be consistent with the move: only mate has a winner, and it's the mover.
  if (p_san like '%#') <> (p_reason is not distinct from 'checkmate') then raise exception 'inconsistent result'; end if;
  if p_reason = 'checkmate' and p_winner is distinct from mover then raise exception 'inconsistent result'; end if;
  if p_reason is distinct from 'checkmate' and p_winner is not null then raise exception 'inconsistent result'; end if;
  if p_reason = 'resignation' then raise exception 'use resign_game'; end if;

  update games set
    moves = case when g.moves = '' then p_san else g.moves || ' ' || p_san end,
    move_count = g.move_count + 1,
    status = case when p_reason is null then 'active' else 'finished' end,
    winner = p_winner,
    reason = p_reason,
    updated_at = now()
  where id = p_id returning * into g;
  return g;
end $$;

create or replace function public.resign_game(p_id text)
returns public.games
language plpgsql security definer set search_path = public
as $$
declare g public.games;
begin
  select * into g from games where id = p_id for update;
  if not found then raise exception 'game not found'; end if;
  if g.status <> 'active' then return g; end if;
  if auth.uid() is null or auth.uid() not in (g.white, g.black) then raise exception 'not a player'; end if;

  update games set
    status = 'finished',
    winner = case when auth.uid() = g.white then 'b' else 'w' end,
    reason = 'resignation',
    updated_at = now()
  where id = p_id returning * into g;
  return g;
end $$;

revoke all on function public.get_game(text) from public, anon;
revoke all on function public.join_game(text) from public, anon;
revoke all on function public.make_move(text, int, text, text, text) from public, anon;
revoke all on function public.resign_game(text) from public, anon;
grant execute on function public.get_game(text) to authenticated;
grant execute on function public.join_game(text) to authenticated;
grant execute on function public.make_move(text, int, text, text, text) to authenticated;
grant execute on function public.resign_game(text) to authenticated;

alter publication supabase_realtime add table public.games;
