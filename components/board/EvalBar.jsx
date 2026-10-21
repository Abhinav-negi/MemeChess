// Lichess-style winning-chance curve, so +1 and +8 don't look the same.
function whiteShare(evaluation, mate) {
  if (mate !== null) return mate > 0 || (mate === 0 && evaluation > 0) ? 100 : 0;
  const chance = 2 / (1 + Math.exp(-0.368 * evaluation)) - 1;
  return 50 + 50 * chance;
}

function label(evaluation, mate) {
  if (mate !== null) return `M${Math.abs(mate)}`;
  const v = Math.abs(evaluation);
  return v >= 10 ? v.toFixed(0) : v.toFixed(1);
}

/** Vertical eval bar. White's share grows from White's side of the board. */
export default function EvalBar({ evaluation, mate, orientation = 'white' }) {
  const share = whiteShare(evaluation, mate);
  const whiteAhead = mate !== null ? mate > 0 : evaluation >= 0;
  const whiteAtBottom = orientation === 'white';
  const labelAtBottom = whiteAhead === whiteAtBottom;

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-sm bg-[#1a1a1a] flex ${whiteAtBottom ? 'flex-col-reverse' : 'flex-col'}`}
      role="meter"
      aria-label="Evaluation"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(share)}
      aria-valuetext={`${whiteAhead ? 'White' : 'Black'} ${label(evaluation, mate)}`}
    >
      <div className="w-full bg-[#ededed] transition-[height] duration-500 ease-out" style={{ height: `${share}%` }} />
      <span
        className={`absolute left-0 right-0 text-center font-mono text-[9px] font-semibold sm:text-[11px] ${labelAtBottom ? 'bottom-1' : 'top-1'} ${whiteAhead ? 'text-black' : 'text-[#ededed]'}`}
      >
        {label(evaluation, mate)}
      </span>
    </div>
  );
}
