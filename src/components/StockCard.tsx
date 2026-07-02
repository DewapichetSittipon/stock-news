import { AnalyticsChart } from './AnalyticsChart';
import { MultiplierBadge } from './MultiplierBadge';
import { multiplierMeta } from '../utils/multiplier';
import {
  formatDrawdown,
  formatSignedPct,
  formatSignedUSD,
  formatTHB,
  formatUSD,
} from '../utils/format';
import type { TickerAnalytics } from '../types';

interface Props {
  analytics: TickerAnalytics;
}

const UP = '#10b981';
const DOWN = '#ef4444';

export const StockCard = ({ analytics }: Props): JSX.Element => {
  const isDaily = analytics.mode === 'daily';
  const meta = multiplierMeta(analytics.multiplier);
  const changeColor = analytics.dailyChangePct >= 0 ? UP : DOWN;
  const accent = isDaily ? changeColor : meta.hex;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg sm:p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-white">{analytics.symbol}</h3>
        {isDaily ? (
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-sky-300">
            รายวัน
          </span>
        ) : (
          <MultiplierBadge multiplier={analytics.multiplier} />
        )}
      </div>
      <p className="text-sm text-slate-400">{analytics.name}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-white">
            {formatUSD(analytics.latestClose)}
          </p>
          {isDaily ? (
            <p className="text-sm font-medium" style={{ color: changeColor }}>
              {formatSignedPct(analytics.dailyChangePct)} (
              {formatSignedUSD(analytics.dailyChangeUsd)}) วันนี้
            </p>
          ) : (
            <p className="text-sm" style={{ color: accent }}>
              {formatDrawdown(analytics.drawdownPct)} จาก 52wk high
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {isDaily ? (
            <>
              <p className="text-xs uppercase tracking-wide text-slate-500">เทียบเมื่อวาน</p>
              <p className="text-xl font-bold" style={{ color: changeColor }}>
                {formatSignedPct(analytics.dailyChangePct)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wide text-slate-500">แนะนำ/เดือน</p>
              <p className="text-xl font-bold" style={{ color: accent }}>
                {formatTHB(analytics.recommendedTHB)}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <AnalyticsChart history={analytics.history} color={accent} />
      </div>
    </div>
  );
};
