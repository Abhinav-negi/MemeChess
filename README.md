# MemeChess

Chess where the engine roasts you. Stockfish evaluates every move. When the evaluation swings (a blunder, a best move, a fork, a check, a checkmate), a meme video plays **on the square of the last move**.

Two ways to play:
- **vs Bot**: five bots from ~400 to ~2000, all Stockfish with different skill and depth.
- **vs Friend**: create a game, send the link, and play in real time (Supabase). No account needed.

## Stack
Next.js 16 (App Router) · React 19 · Tailwind 4 · chess.js · react-chessboard · Stockfish (WASM, in Web Workers) · Supabase (Postgres + Realtime + anonymous auth) · Vitest

## Getting started
```bash
npm install
cp .env.example .env.local   # only needed for friend mode
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Meme-engine unit tests (Vitest) |
| `npm run check:memes` | HEAD-checks every meme video on Cloudinary; exits 1 if any is missing. Run before deploying. |

## Project layout
```
app/                     routes: / (lobby), /play/bot, /play/friend, /g/[gameId] (online game)
components/board/        Board (moves, highlights, promotion), EvalBar, MemeLayer
components/game/         GameLayout, PlayerCard, MoveList, GameOverModal, BotPicker, InviteCard
hooks/useMemeChess.js    the core pipeline: game state → analysis → move quality → memes
hooks/useAnalysis.js     Stockfish analysis worker (one search at a time, White-POV eval)
hooks/useBot.js          separate Stockfish worker that plays the bot's moves
hooks/useOnlineGame.js   Supabase sync for friend games
lib/memes/               catalog (Cloudinary URLs + fallbacks), detectors, selectMeme (priority rules)
lib/                     engine (UCI wrapper), classifyMove, bots, sound, supabase
supabase/migrations/     database schema + RPC functions
public/engine/           Stockfish WASM build
tests/                   Vitest
```

## How the memes work
1. A move is played, and the analysis worker evaluates the new position for 1 second.
2. `evalLoss` is the eval before the move minus the eval after, from the mover's side. `classifyMove` maps it to best / good / inaccuracy / mistake / blunder.
3. `selectMeme` picks a category by priority: game over → special move (royal fork, en passant, promotion) → check → king under pressure → pawn near promotion → move quality → scared piece → capture.
4. `MemeLayer` plays the clip on the target square. Memes never block the board.

### Adding or replacing meme videos
Upload `<category>_<n>.mp4` to the Cloudinary folder, then set the count in `MEME_CATALOG` (`lib/memes/catalog.js`). Categories with count `0` borrow clips through `FALLBACKS`. After re-uploading the missing checkmate and consecutive-check clips, set their counts back to 1. Run `npm run check:memes` after any change.

## Friend mode setup (Supabase)
1. Create a Supabase project.
2. Run `supabase/migrations/001_games.sql` in the SQL editor (or `supabase db push`).
3. **Authentication → Providers → enable Anonymous sign-ins.**
4. Put the project URL and anon key in `.env.local` (and in Vercel env vars).

Writes go through `join_game`, `make_move` and `resign_game`, which enforce seats, turn order and stale-move rejection. Move legality is checked client-side with chess.js.

## Deploy
Vercel: import the repo, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy. Run `npm run check:memes` first.
