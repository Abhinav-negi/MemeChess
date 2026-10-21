-- Online games between two anonymous players.
-- Clients may read any game, but every write goes through the functions below,
-- which enforce seats, turn order and optimistic concurrency (move_count).
-- Move legality is checked by chess.js in the client.
-- shortcut: no server-side legality check; move it to an Edge Function if cheating becomes a problem.

create table public.games (
  id          text primary key check (id ~ '^[a-z0-9]{8}$'),
  white       uuid references auth.users on delete set null,
  black       uuid references auth.users on delete set null,
  pgn         text not null default '',
  move_count  int  not null default 0,
  status      text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  winner      text check (winner in ('w', 'b')),
  reason      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "games are public to read" on public.games
  for select using (true);

create policy "creator takes a seat" on public.games
  for insert to authenticated
  with check (
    (white = auth.uid() and black is null) or (black = auth.uid() and white is null)
  );

-- No update/delete policies: writes only via the security definer functions.

create or replace function public.join_game(p_id text)
returns public.games
language plpgsql security definer set search_path = public
as $$
declare g public.games;
begin
  select * into g from games where id = p_id for update;
  if not found then raise exception 'game not found'; end if;
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if g.white = auth.uid() or g.black = auth.uid() then return g; end if;

  if g.white is null then
    update games set white = auth.uid(), status = 'active', updated_at = now() where id = p_id returning * into g;
  elsif g.black is null then
    update games set black = auth.uid(), status = 'active', updated_at = now() where id = p_id returning * into g;
  end if;
  return g; -- both seats taken: caller spectates
end $$;

create or replace function public.make_move(
  p_id text, p_move_count int, p_pgn text, p_winner text default null, p_reason text default null
)
returns public.games
language plpgsql security definer set search_path = public
as $$
declare g public.games;
begin
  select * into g from games where id = p_id for update;
  if not found then raise exception 'game not found'; end if;
  if g.status <> 'active' then raise exception 'game is not active'; end if;
  if g.move_count <> p_move_count then raise exception 'stale move'; end if;
  -- Even move_count = white to move.
  if auth.uid() is distinct from (case when g.move_count % 2 = 0 then g.white else g.black end) then
    raise exception 'not your turn';
  end if;

  update games set
    pgn = p_pgn,
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
  if g.status = 'finished' then return g; end if;
  if auth.uid() is null or auth.uid() not in (g.white, g.black) then raise exception 'not a player'; end if;

  update games set
    status = 'finished',
    winner = case when auth.uid() = g.white then 'b' else 'w' end,
    reason = 'resignation',
    updated_at = now()
  where id = p_id returning * into g;
  return g;
end $$;

revoke all on function public.join_game(text) from public, anon;
revoke all on function public.make_move(text, int, text, text, text) from public, anon;
revoke all on function public.resign_game(text) from public, anon;
grant execute on function public.join_game(text) to authenticated;
grant execute on function public.make_move(text, int, text, text, text) to authenticated;
grant execute on function public.resign_game(text) to authenticated;

alter publication supabase_realtime add table public.games;
