import Image from 'next/image';
import Link from 'next/link';
import HeroDemo from '@/components/home/HeroDemo';
import { BOTS } from '@/lib/bots';

/*
 * Layout follows how eyes scan a landing page:
 * - Hero is a Z: logo (top-left) → nav (top-right) → headline → demo board → CTAs (bottom-left).
 * - Sections below zig-zag (S): text left / visual right, then visual left / text right.
 * - The page ends bottom-right on the final CTA, where the Z/S path finishes.
 * Rule of 8: every size, gap and line height is a multiple of 8px
 * (Tailwind units 2=8, 4=16, 6=24, 8=32, 12=48, 16=64, 24=96, 32=128).
 */

const MEME_SHEET = [
  { glyph: '??', name: 'Blunder', where: 'on the square you just ruined' },
  { glyph: '!!', name: 'Best move', where: 'on the square you just nailed' },
  { glyph: '+', name: 'Check', where: 'on the attacker and on the king' },
  { glyph: '#', name: 'Checkmate', where: 'on both kings: one wins, one cries' },
  { glyph: '⑂', name: 'Royal fork', where: 'on the piece hitting king and queen' },
  { glyph: 'e.p.', name: 'En passant', where: 'holy hell' },
  { glyph: '=N', name: 'Under-promotion', where: 'on the knight nobody asked for' },
  { glyph: '½', name: 'Stalemate', where: 'on every piece still on the board' },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1184px] px-4">
      {/* Z: headline left, live board right, CTAs bottom-left */}
      <section className="grid gap-8 py-8 md:grid-cols-12 md:grid-rows-[auto_1fr] md:gap-x-8 md:gap-y-6 md:py-24">
        <h1 className="font-display text-[56px] uppercase leading-[56px] text-text md:col-span-6 md:self-end md:text-[80px] md:leading-[80px] lg:text-[96px] lg:leading-[96px]">
          Blunder.
          <br />
          <span className="text-accent">Get memed.</span>
        </h1>
        <div className="md:col-span-6 md:col-start-7 md:row-span-2 md:row-start-1 md:pl-8">
          <div className="mx-auto max-w-[512px]">
            <HeroDemo />
          </div>
        </div>
        <div className="md:col-span-6">
          <p className="max-w-[448px] text-lg leading-8 text-muted">
            Stockfish judges every move. Swing the evaluation and a meme plays{' '}
            <span className="text-text">on the exact square you just moved to.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/play/bot" className="btn h-12 px-8 text-base">Play a bot</Link>
            <Link href="/play/friend" className="btn-ghost h-12 px-8 text-base">Invite a friend</Link>
          </div>
        </div>
      </section>

      {/* S, row 1: text left, bot ladder right */}
      <section className="grid gap-8 border-t border-border py-16 md:grid-cols-12 md:py-24" aria-labelledby="bots">
        <div className="md:col-span-5">
          <h2 id="bots" className="font-display text-[40px] uppercase leading-[48px] text-text md:text-[48px] md:leading-[56px]">
            Five bots.
            <br />
            Zero chill.
          </h2>
          <p className="mt-4 max-w-[384px] text-base leading-6 text-muted">
            From a dog who doesn’t care to the Magician of Riga. Every one of them gets memed when they blunder,
            and so do you. <span className="text-text">Click one to play.</span>
          </p>
        </div>
        <ol className="md:col-span-7">
          {BOTS.map((bot, i) => (
            <li key={bot.id}>
              <Link
                href="/play/bot"
                className="grid grid-cols-[32px_48px_1fr_auto] items-center gap-4 border-b border-border py-4 transition hover:bg-surface"
              >
                <span className="text-center font-mono text-sm leading-6 text-muted">{i + 1}</span>
                <Image src={bot.img} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold leading-6 text-text">{bot.name}</span>
                  <span className="block truncate text-sm leading-6 text-muted">{bot.description}</span>
                </span>
                <span className="pr-2 text-right font-mono text-base leading-6 text-text">{bot.elo}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* S, row 2: invite visual left, text right */}
      <section className="grid items-center gap-8 border-t border-border py-16 md:grid-cols-12 md:py-24" aria-labelledby="friend">
        <div className="order-2 md:order-1 md:col-span-7 md:pr-16">
          <div className="rounded-lg border border-accent/40 bg-surface p-6">
            <p className="flex items-center gap-2 text-sm font-semibold leading-6 text-text">
              <span className="thinking-dots text-accent" aria-hidden>●</span> Waiting for your friend
            </p>
            <p className="text-sm leading-6 text-muted">The game starts as soon as they open this link.</p>
            <div className="mt-4 flex h-12 items-center gap-2 rounded-lg border border-border bg-black pl-4 pr-2 font-mono text-sm leading-6 text-muted">
              <span className="min-w-0 flex-1 truncate">memechess.app/g/<span className="text-text">k3x9q2ab</span></span>
              <span className="flex h-8 items-center rounded-lg bg-accent px-4 text-xs font-semibold text-black">Copy</span>
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2 md:col-span-5">
          <h2 id="friend" className="font-display text-[40px] uppercase leading-[48px] text-text md:text-[48px] md:leading-[56px]">
            One link.
            <br />
            That’s the lobby.
          </h2>
          <p className="mt-4 max-w-[384px] text-base leading-6 text-muted">
            Create a game, send the link, play live. No accounts, no friend requests. Both of you see every meme.
          </p>
          <Link href="/play/friend" className="btn mt-6 h-12 px-8 text-base">Create your link</Link>
        </div>
      </section>

      {/* The rules, written the way chess players annotate games */}
      <section className="border-t border-border py-16 md:py-24" aria-labelledby="sheet">
        <h2 id="sheet" className="font-display text-[40px] uppercase leading-[48px] text-text md:text-[48px] md:leading-[56px]">
          The meme sheet
        </h2>
        <p className="mt-4 max-w-[512px] text-base leading-6 text-muted">What triggers a meme, and which square it lands on.</p>
        <dl className="mt-8 grid border-t border-border md:grid-flow-col md:grid-cols-2 md:grid-rows-4 md:gap-x-16">
          {MEME_SHEET.map((row) => (
            <div key={row.name} className="grid grid-cols-[64px_1fr] items-baseline gap-4 border-b border-border py-4">
              <dt className="font-mono text-2xl leading-8 text-accent">{row.glyph}</dt>
              <dd>
                <span className="block text-base font-semibold leading-6 text-text">{row.name}</span>
                <span className="block text-sm leading-6 text-muted">{row.where}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Z/S path ends bottom-right: final CTA */}
      <section className="flex justify-end border-t border-border py-16 md:py-24" aria-label="Start playing">
        <div className="flex flex-wrap justify-end gap-4">
          <Link href="/play/friend" className="btn-ghost h-12 px-8 text-base">Invite a friend</Link>
          <Link href="/play/bot" className="btn h-12 px-8 text-base">Play a bot</Link>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-border py-8 text-sm leading-6 text-muted md:flex-row md:justify-between">
        <span>Meme Chess</span>
        <span>Analysis by Stockfish, in your browser.</span>
      </footer>
    </div>
  );
}
