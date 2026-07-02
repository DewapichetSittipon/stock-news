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
  usdThb?: number | null;
}

const UP = '#10b981';
const DOWN = '#ef4444';

const Stat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}): JSX.Element => (
  <div className="rounded-lg bg-slate-800/50 px-2.5 py-1.5">
    <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm font-semibold" style={{ color: color ?? '#e2e8f0' }}>
      {value}
    </p>
  </div>
);

export const StockCard = ({ analytics, usdThb }: Props): JSX.Element => {
  const isDaily = analytics.mode === 'daily';
  const meta = multiplierMeta(analytics.multiplier);
  const changeColor = analytics.dailyChangePct >= 0 ? UP : DOWN;
  const accent = isDaily ? changeColor : meta.hex;
  const priceTHB = usdThb ? analytics.latestClose * usdThb : null;

  const rsiColor =
    analytics.rsi14 < 30 ? UP : analytics.rsi14 > 70 ? DOWN : '#e2e8f0';
  const aboveSma200 = analytics.sma200 > 0 && analytics.latestClose >= analytics.sma200;

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
          {priceTHB !== null && (
            <p className="text-xs text-slate-500">≈ {formatTHB(priceTHB)}</p>
          )}
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

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="RSI 14" value={analytics.rsi14.toFixed(0)} color={rsiColor} />
        <Stat
          label="YTD"
          value={formatSignedPct(analytics.ytdPct)}
          color={analytics.ytdPct >= 0 ? UP : DOWN}
        />
        <Stat
          label="vs 200D"
          value={analytics.sma200 > 0 ? (aboveSma200 ? 'เหนือ' : 'ใต้') : '—'}
          color={analytics.sma200 > 0 ? (aboveSma200 ? UP : DOWN) : undefined}
        />
        {!isDaily && analytics.dividendYieldPct > 0 ? (
          <Stat
            label="ปันผล"
            value={`${analytics.dividendYieldPct.toFixed(2)}%`}
            color="#34d399"
          />
        ) : (
          <Stat
            label="52wk low"
            value={Number.isFinite(analytics.low52) ? formatUSD(analytics.low52) : '—'}
          />
        )}
      </div>

      <div className="mt-4">
        <AnalyticsChart
          history={analytics.history}
          color={accent}
          high52={analytics.high52}
          low52={analytics.low52}
          showMultiplier={!isDaily}
        />
      </div>
    </div>
  );
};
