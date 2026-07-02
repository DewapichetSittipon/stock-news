import { AnalyticsChart } from './AnalyticsChart';
import { MultiplierBadge } from './MultiplierBadge';
import { useWatchlistStore } from '../stores/useWatchlistStore';
import { multiplierMeta } from '../utils/multiplier';
import { formatDrawdown, formatTHB, formatUSD } from '../utils/format';
import type { TickerAnalytics } from '../types';

interface Props {
  analytics: TickerAnalytics;
}

export const StockCard = ({ analytics }: Props): JSX.Element => {
  const favorites = useWatchlistStore((state) => state.favorites);
  const toggle = useWatchlistStore((state) => state.toggle);
  const isFavorite = favorites.includes(analytics.symbol);
  const meta = multiplierMeta(analytics.multiplier);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{analytics.symbol}</h3>
            <MultiplierBadge multiplier={analytics.multiplier} />
          </div>
          <p className="text-sm text-slate-400">{analytics.name}</p>
        </div>
        <button
          onClick={() => toggle(analytics.symbol)}
          aria-label="toggle favorite"
          className={`text-xl ${
            isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-white">
            {formatUSD(analytics.latestClose)}
          </p>
          <p className="text-sm" style={{ color: meta.hex }}>
            {formatDrawdown(analytics.drawdownPct)} จาก 52wk high
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">แนะนำวันนี้</p>
          <p className="text-xl font-bold" style={{ color: meta.hex }}>
            {formatTHB(analytics.recommendedTHB)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <AnalyticsChart history={analytics.history} color={meta.hex} />
      </div>
    </div>
  );
};
