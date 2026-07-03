import { PortfolioChart } from './PortfolioChart';
import { formatSignedPct, formatTHB } from '../utils/format';
import { portfolioSeries } from '../utils/portfolio';
import type { LedgerEntry, PricePoint, TickerAnalytics } from '../types';

interface Props {
  ledger: LedgerEntry[];
  analytics: TickerAnalytics[];
  usdThb?: number | null;
}

interface Holding {
  symbol: string;
  invested: number;
  value: number;
  annualDividend: number;
  pl: number;
  plPct: number;
}

const UP = '#10b981';
const DOWN = '#ef4444';

export const Portfolio = ({ ledger, analytics, usdThb }: Props): JSX.Element | null => {
  if (ledger.length === 0) return null;

  const infoOf = (symbol: string): TickerAnalytics | undefined =>
    analytics.find((item) => item.symbol === symbol);

  // Value each buy with the currency leg included when the ledger recorded the
  // FX at buy time: multiplying by (now / then) captures the THB gain/loss on
  // the dollars held. Legacy entries (no fxRate) fall back to a factor of 1,
  // i.e. the previous price-ratio valuation.
  const bySymbol = new Map<string, Holding>();
  for (const entry of ledger) {
    const info = infoOf(entry.symbol);
    const price = info?.latestClose ?? 0;
    const ttmDiv = info?.ttmDividend ?? 0;
    const fxFactor = usdThb && entry.fxRate ? usdThb / entry.fxRate : 1;

    const acc = bySymbol.get(entry.symbol) ?? {
      symbol: entry.symbol,
      invested: 0,
      value: 0,
      annualDividend: 0,
      pl: 0,
      plPct: 0,
    };
    acc.invested += entry.amountTHB;
    acc.value += entry.units * price * fxFactor;
    acc.annualDividend += entry.units * ttmDiv * fxFactor;
    bySymbol.set(entry.symbol, acc);
  }

  const holdings: Holding[] = [...bySymbol.values()].map((h) => {
    const pl = h.value - h.invested;
    return { ...h, pl, plPct: h.invested > 0 ? (pl / h.invested) * 100 : 0 };
  });

  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const value = holdings.reduce((sum, h) => sum + h.value, 0);
  const annualDividend = holdings.reduce((sum, h) => sum + h.annualDividend, 0);
  const pl = value - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;
  const plColor = pl >= 0 ? UP : DOWN;
  const dividendYield = value > 0 ? (annualDividend / value) * 100 : 0;
  const fxAware = ledger.some((entry) => entry.fxRate != null) && usdThb != null;

  const histories: Record<string, PricePoint[]> = {};
  for (const item of analytics) histories[item.symbol] = item.history;
  const growth = portfolioSeries(ledger, histories);

  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">พอร์ตของฉัน</h2>
          <p className="text-xs text-slate-500">
            ลงทุนสะสม {formatTHB(invested)}
            {usdThb != null && ` · USD/THB ${usdThb.toFixed(2)}`}
          </p>
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

      <PortfolioChart points={growth} />

      {annualDividend > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
          <span className="text-xs text-emerald-200/80">ปันผลคาดการณ์/ปี</span>
          <span className="text-sm font-semibold text-emerald-300">
            {formatTHB(annualDividend)} ({dividendYield.toFixed(2)}%)
          </span>
        </div>
      )}

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
        * มูลค่าเป็นบาทเทียบสัดส่วนราคา
        {fxAware ? ' รวมผลค่าเงินจากรายการที่บันทึกเรตไว้' : ' (ยังไม่รวมค่าเงิน)'} · ปันผลเป็นตัวเลขคาดการณ์
      </p>
    </div>
  );
};
