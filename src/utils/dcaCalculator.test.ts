import { describe, expect, it } from 'vitest';
import {
  analyzeTicker,
  compute52WeekHigh,
  computeDrawdownPct,
  multiplierForDrawdown,
  multiplierSeries,
  TRADING_DAYS_PER_YEAR,
} from './dcaCalculator';
import type { PricePoint, TickerConfig } from '../types';

// Build a flat run of trading days ending "today", each with the given close.
const series = (closes: number[], startDay = 1): PricePoint[] =>
  closes.map((close, i) => ({
    date: `2026-01-${String(startDay + i).padStart(2, '0')}`,
    close,
  }));

describe('multiplierForDrawdown — band boundaries', () => {
  it('maps a flat/rising price to 1x', () => {
    expect(multiplierForDrawdown(0)).toBe(1);
    expect(multiplierForDrawdown(5)).toBe(1); // above the high (positive) still 1x
    expect(multiplierForDrawdown(-4.99)).toBe(1);
  });

  it('is inclusive on the lower edge of each band', () => {
    expect(multiplierForDrawdown(-5)).toBe(2);
    expect(multiplierForDrawdown(-10)).toBe(3);
    expect(multiplierForDrawdown(-15)).toBe(4);
    expect(multiplierForDrawdown(-20)).toBe(5);
  });

  it('picks the deeper band just past each edge', () => {
    expect(multiplierForDrawdown(-9.99)).toBe(2);
    expect(multiplierForDrawdown(-14.99)).toBe(3);
    expect(multiplierForDrawdown(-19.99)).toBe(4);
    expect(multiplierForDrawdown(-50)).toBe(5);
  });
});

describe('compute52WeekHigh', () => {
  it('is the max close within the trailing 252 sessions', () => {
    expect(compute52WeekHigh(series([100, 120, 110]))).toBe(120);
  });

  it('ignores highs older than the 252-day window', () => {
    const old = series(Array(300).fill(50));
    old[0].close = 999; // outside the trailing window
    expect(compute52WeekHigh(old)).toBe(50);
    expect(old.length).toBeGreaterThan(TRADING_DAYS_PER_YEAR);
  });

  it('returns 0 for empty history', () => {
    expect(compute52WeekHigh([])).toBe(0);
  });
});

describe('computeDrawdownPct', () => {
  it('is a negative percent below the high', () => {
    expect(computeDrawdownPct(90, 100)).toBeCloseTo(-10);
  });

  it('is 0 at the high and guards a non-positive high', () => {
    expect(computeDrawdownPct(100, 100)).toBe(0);
    expect(computeDrawdownPct(50, 0)).toBe(0);
  });
});

describe('multiplierSeries', () => {
  it('emits one band per day, sorted, using the running trailing high', () => {
    // 100 (high) then down to 80 = -20% → 5x on the last day.
    const bands = multiplierSeries(series([100, 90, 80]));
    expect(bands).toHaveLength(3);
    expect(bands[0].multiplier).toBe(1); // first day is its own high
    expect(bands[2].multiplier).toBe(5); // 80 vs high 100 = -20%
    expect(bands[2].time).toBe('2026-01-03');
  });

  it('does not mutate the input order dependency (accepts unsorted)', () => {
    const unsorted = [...series([100, 80])].reverse();
    const bands = multiplierSeries(unsorted);
    expect(bands.map((b) => b.time)).toEqual(['2026-01-01', '2026-01-02']);
  });
});

describe('analyzeTicker', () => {
  const config: TickerConfig = {
    symbol: 'VOO',
    name: 'Vanguard S&P 500',
    mode: 'dca',
    baseTHB: 2000,
  };

  it('derives multiplier, recommendation and daily change from history', () => {
    const a = analyzeTicker(config, series([100, 90])); // high 100, latest 90 = -10%
    expect(a.high52).toBe(100);
    expect(a.latestClose).toBe(90);
    expect(a.prevClose).toBe(100);
    expect(a.drawdownPct).toBeCloseTo(-10);
    expect(a.multiplier).toBe(3);
    expect(a.recommendedTHB).toBe(2000 * 3);
    expect(a.dailyChangeUsd).toBe(-10);
    expect(a.dailyChangePct).toBeCloseTo(-10);
  });

  it('treats a single day as its own previous close (no phantom change)', () => {
    const a = analyzeTicker(config, series([100]));
    expect(a.prevClose).toBe(100);
    expect(a.dailyChangeUsd).toBe(0);
    expect(a.dailyChangePct).toBe(0);
    expect(a.multiplier).toBe(1);
  });

  it('defaults baseTHB to 0 for daily-mode tickers', () => {
    const a = analyzeTicker({ symbol: 'SNDK', name: 'SanDisk', mode: 'daily' }, series([10]));
    expect(a.baseTHB).toBe(0);
    expect(a.recommendedTHB).toBe(0);
  });

  it('throws on empty history rather than silently returning bad numbers', () => {
    expect(() => analyzeTicker(config, [])).toThrow(/No price history/);
  });

  it('computes dividend yield from trailing-twelve-month dividends', () => {
    const a = analyzeTicker(config, series([100, 100]), [
      { date: '2025-06-01', amount: 1 },
      { date: '2025-12-01', amount: 1 },
      { date: '2020-01-01', amount: 5 }, // too old to count
    ]);
    expect(a.ttmDividend).toBe(2);
    expect(a.dividendYieldPct).toBeCloseTo(2); // 2 / 100 * 100
  });
});
