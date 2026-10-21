'use client';

import Board from '@/components/board/Board';
import EvalBar from '@/components/board/EvalBar';
import PlayerCard from './PlayerCard';
import MoveList from './MoveList';
import GameOverModal from './GameOverModal';
import { QUALITY_LABELS } from '@/lib/classifyMove';

const PILL = {
  best: 'border-accent/40 bg-accent/10 text-accent',
  good: 'border-accent/30 bg-accent/5 text-accent',
  inaccuracy: 'border-warn/40 bg-warn/10 text-warn',
  mistake: 'border-warn/40 bg-warn/10 text-warn',
  blunder: 'border-danger/40 bg-danger/10 text-danger',
};

/**
 * Board-centric game page shared by bot and friend modes:
 * [eval | board] with player cards above/below, and a side panel with moves and actions.
 */
export default function GameLayout({ chess, orientation, myColor, onMove, showEval = false, top, bottom, panelTop, actions, modalActions }) {
  const { game, fen, history, lastMove, evaluation, mate, qualities, memes, removeMeme, result } = chess;
  const lastQuality = qualities[history.length];
  const turn = game.turn();
  const playing = !result;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-4 md:flex-row md:items-start md:justify-center md:gap-6 md:py-8">
      <section className="w-full md:max-w-[min(calc(100vh-180px),720px)] md:flex-1" aria-label="Game board">
        <PlayerCard {...top} history={history} active={playing && turn === top.color} />
        <div className="flex gap-2">
          {showEval && (
            <div className="w-5 shrink-0 sm:w-7">
              <EvalBar evaluation={evaluation} mate={mate} orientation={orientation} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Board
              game={game}
              fen={fen}
              orientation={orientation}
              myColor={playing ? myColor : null}
              onMove={onMove}
              lastMove={lastMove}
              memes={memes}
              onMemeEnd={removeMeme}
            />
          </div>
        </div>
        <PlayerCard {...bottom} history={history} active={playing && turn === bottom.color} />
      </section>

      <aside className="flex w-full flex-col gap-3 md:w-[320px] md:shrink-0">
        {panelTop}
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Moves</h2>
            <span
              key={history.length}
              className={`pill-in rounded-full border px-2 py-0.5 text-xs font-medium ${lastQuality ? PILL[lastQuality] : 'border-transparent text-muted'}`}
              aria-live="polite"
            >
              {lastQuality ? QUALITY_LABELS[lastQuality] : playing ? `${turn === 'w' ? 'White' : 'Black'} to move` : 'Finished'}
            </span>
          </div>
          <MoveList history={history} qualities={qualities} />
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </aside>

      <GameOverModal result={result} myColor={myColor} actions={modalActions} />
    </div>
  );
}
