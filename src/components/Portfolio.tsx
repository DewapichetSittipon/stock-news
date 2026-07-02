import { formatSignedPct, formatTHB } from '../utils/format';
import type { LedgerEntry, TickerAnalytics } from '../types';

interface Props {
  ledger: LedgerEntry[];
  analytics: TickerAnalytics[];
}

interface Holding {
  symbol: string;
  invested: number;
  units: number;
  value: number;
  pl: number;
  plPct: number;
}

const UP = '#10b981';
const DOWN = '#ef4444';

export const Portfolio = ({ ledger, analytics }: Props): JSX.Element | null => {
  if (ledger.length === 0) return null;

  const priceOf = (symbol: string): number =>
    analytics.find((item) => item.symbol === symbol)?.latestClose ?? 0;

  const bySymbol = new Map<string, { invested: number; units: number }>();
  for (const entry of ledger) {
    const acc = bySymbol.get(entry.symbol) ?? { invested: 0, units: 0 };
    acc.invested += entry.amountTHB;
    acc.units += entry.units;
    bySymbol.set(entry.symbol, acc);
  }

  const holdings: Holding[] = [...bySymbol.entries()].map(([symbol, acc]) => {
    const value = acc.units * priceOf(symbol);
    const pl = value - acc.invested;
    return {
      symbol,
      invested: acc.invested,
      units: acc.units,
      value,
      pl,
      plPct: acc.invested > 0 ? (pl / acc.invested) * 100 : 0,
    };
  });

  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const value = holdings.reduce((sum, h) => sum + h.value, 0);
  const pl = value - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;
  const plColor = pl >= 0 ? UP : DOWN;

  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">พอร์ตของฉัน</h2>
          <p className="text-xs text-slate-500">ลงทุนสะสม {formatTHB(invested)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">มูลค่าปัจจุบัน</p>
          <p className="text-2xl font-bold text-white">{formatTHB(value)}</p>
          <p className="text-sm font-semibold" style={{ color: plColor }}>
            {formatSignedPct(plPct)} ({pl >= 0 ? '+' : ''}
            {formatTHB(pl)})
          </p>
        </div>
      </div>

      <div className="mt-3 divide-y divide-slate-800">
        {holdings.map((h) => (
          <div key={h.symbol} className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-slate-200">{h.symbol}</span>
            <div className="text-right">
              <span className="text-sm text-slate-300">{formatTHB(h.value)}</span>
              <span
                className="ml-2 text-xs font-medium"
                style={{ color: h.pl >= 0 ? UP : DOWN }}
              >
                {formatSignedPct(h.plPct)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-slate-600">
        * มูลค่าเป็นบาทเทียบสัดส่วนราคา (ไม่รวมค่าเงิน/ปันผล)
      </p>
    </div>
  );
};
