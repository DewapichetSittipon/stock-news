import { multiplierMeta } from '../utils/multiplier';
import { plainMonthlyPlan } from '../utils/plain';
import type { TickerAnalytics } from '../types';

interface Props {
  dca: TickerAnalytics[];
  boughtThisMonth: boolean;
}

// Jargon-free "what do I do this month" card, shown before everything else so
// a user who knows nothing about markets still gets the answer first.
export const PlainSummary = ({ dca, boughtThisMonth }: Props): JSX.Element | null => {
  if (dca.length === 0) return null;
  const plan = plainMonthlyPlan(dca, boughtThisMonth);

  return (
    <section className="mb-6 rounded-2xl border border-emerald-700/40 bg-gradient-to-br from-emerald-900/30 to-slate-900/60 p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wide text-emerald-400/80">
        สรุปง่าย ๆ เดือนนี้
      </p>
      <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{plan.headline}</h2>
      <p className="mt-1 text-sm text-slate-400">{plan.detail}</p>

      <ul className={`mt-3 space-y-2 ${boughtThisMonth ? 'opacity-60' : ''}`}>
        {plan.lines.map((line) => {
          const meta = multiplierMeta(line.multiplier);
          return (
            <li key={line.symbol} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
              <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dotClass}`} />
              <span className="w-14 font-semibold text-slate-200">{line.symbol}</span>
              <span className="font-semibold text-white">{line.amount}</span>
              <span className="text-slate-400">— {line.reason}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
