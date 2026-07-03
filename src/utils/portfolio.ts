import type { LedgerEntry, PricePoint } from '../types';

export interface PortfolioPoint {
  date: string; // ISO YYYY-MM-DD
  invested: number; // cumulative THB put in, up to this date
  value: number; // ฿-ratio valuation of everything held on this date
}

// Daily invested-vs-value series reconstructed from the Ledger and each
// symbol's price history — no snapshot file needed. Valuation is ฿-ratio per
// ADR-0007 (`units × close`, where units = amountTHB / priceUSD at buy time).
// The FX leg is left out of the historical curve: the Prices Snapshot has no
// historical FX series, only today's rate. The headline Portfolio numbers
// still fold FX in for "now".
export const portfolioSeries = (
  ledger: LedgerEntry[],
  histories: Record<string, PricePoint[]>,
): PortfolioPoint[] => {
  if (ledger.length === 0) return [];
  const entries = [...ledger].sort((a, b) => a.date.localeCompare(b.date));
  const firstBuy = entries[0].date;

  const symbols = [...new Set(entries.map((entry) => entry.symbol))];
  const dateSet = new Set<string>();
  for (const symbol of symbols) {
    for (const point of histories[symbol] ?? []) {
      if (point.date >= firstBuy) dateSet.add(point.date);
    }
  }
  const dates = [...dateSet].sort();

  // Per-symbol cursor into its sorted history; `close` carries forward over
  // dates the symbol didn't trade (holiday mismatches between symbols).
  const cursors = new Map(
    symbols.map((symbol) => [symbol, { points: histories[symbol] ?? [], i: 0, close: 0 }]),
  );

  const units = new Map<string, number>();
  let invested = 0;
  let entryIdx = 0;
  const out: PortfolioPoint[] = [];

  for (const date of dates) {
    for (const cursor of cursors.values()) {
      while (cursor.i < cursor.points.length && cursor.points[cursor.i].date <= date) {
        cursor.close = cursor.points[cursor.i].close;
        cursor.i += 1;
      }
    }
    while (entryIdx < entries.length && entries[entryIdx].date <= date) {
      const entry = entries[entryIdx];
      invested += entry.amountTHB;
      units.set(entry.symbol, (units.get(entry.symbol) ?? 0) + entry.units);
      entryIdx += 1;
    }

    let value = 0;
    for (const symbol of symbols) {
      value += (units.get(symbol) ?? 0) * (cursors.get(symbol)?.close ?? 0);
    }
    out.push({ date, invested, value });
  }
  return out;
};
