import { describe, expect, it } from 'vitest';
import { runBacktest } from './backtest';
import type { PricePoint } from '../types';

const at = (date: string, close: number): PricePoint => ({ date, close });

describe('runBacktest', () => {
  it('buys once on the first trading day of each month', () => {
    const points = [
      at('2026-01-05', 100), // Jan buy
      at('2026-01-20', 110), // same month, not a buy day
      at('2026-02-02', 100), // Feb buy
      at('2026-03-01', 200), // Mar buy + final price
    ];
    const r = runBacktest(points, 1000, false); // plain DCA
    expect(r.months).toBe(3);
    expect(r.invested).toBe(3000);
    // units: 1000/100 + 1000/100 + 1000/200 = 10 + 10 + 5 = 25
    expect(r.units).toBeCloseTo(25);
    expect(r.finalValue).toBeCloseTo(25 * 200); // 5000
    expect(r.returnPct).toBeCloseTo((5000 / 3000 - 1) * 100);
  });

  it('smart mode invests more (and buys more units) during a drawdown', () => {
    // Start high, then a deep month-one dip should scale the buy up.
    const points = [
      at('2026-01-02', 100),
      at('2026-02-02', 100),
      at('2026-03-02', 70), // -30% vs trailing high → 5x buy this month
    ];
    const plain = runBacktest(points, 1000, false);
    const smart = runBacktest(points, 1000, true);
    expect(smart.invested).toBeGreaterThan(plain.invested);
    expect(smart.units).toBeGreaterThan(plain.units);
    // Jan+Feb at 1x, Mar at 5x → 1000 + 1000 + 5000
    expect(smart.invested).toBe(7000);
  });

  it('smart and plain agree when the price only ever rises (always 1x)', () => {
    const points = [
      at('2026-01-02', 100),
      at('2026-02-02', 110),
      at('2026-03-02', 120),
    ];
    const plain = runBacktest(points, 1000, false);
    const smart = runBacktest(points, 1000, true);
    expect(smart.invested).toBe(plain.invested);
    expect(smart.units).toBeCloseTo(plain.units);
  });

  it('skips buy days priced at zero without crashing', () => {
    const points = [at('2026-01-02', 0), at('2026-02-02', 100)];
    const r = runBacktest(points, 1000, false);
    expect(r.months).toBe(2); // both counted as month starts
    expect(r.invested).toBe(1000); // only the priced day actually buys
    expect(r.units).toBeCloseTo(10);
  });

  it('returns zeros for empty history instead of NaN', () => {
    const r = runBacktest([], 1000, true);
    expect(r.invested).toBe(0);
    expect(r.units).toBe(0);
    expect(r.finalValue).toBe(0);
    expect(r.returnPct).toBe(0);
    expect(r.months).toBe(0);
  });
});
