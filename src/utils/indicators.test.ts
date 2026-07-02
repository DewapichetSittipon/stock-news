import { describe, expect, it } from 'vitest';
import {
  low52Week,
  rsiLatest,
  smaLatest,
  smaSeries,
  ttmDividendPerShare,
  ytdReturnPct,
} from './indicators';
import type { DividendPoint, PricePoint } from '../types';

const at = (date: string, close: number): PricePoint => ({ date, close });

describe('ttmDividendPerShare', () => {
  const divs: DividendPoint[] = [
    { date: '2025-03-01', amount: 0.5 },
    { date: '2025-09-01', amount: 0.5 },
    { date: '2024-06-01', amount: 0.5 }, // older than 12 months
  ];

  it('sums only dividends within the trailing 12 months', () => {
    expect(ttmDividendPerShare(divs, '2026-01-01')).toBe(1);
  });

  it('is 0 when there are no dividends', () => {
    expect(ttmDividendPerShare([], '2026-01-01')).toBe(0);
  });
});

describe('smaLatest', () => {
  it('averages the last `period` closes', () => {
    expect(smaLatest([2, 4, 6], 3)).toBe(4);
    expect(smaLatest([1, 2, 3, 4], 2)).toBe(3.5);
  });

  it('returns 0 when there is not enough data', () => {
    expect(smaLatest([1, 2], 5)).toBe(0);
  });
});

describe('smaSeries', () => {
  it('starts emitting once `period` points exist and matches a rolling mean', () => {
    const pts = [at('d1', 1), at('d2', 2), at('d3', 3), at('d4', 4)];
    const s = smaSeries(pts, 2);
    expect(s.map((p) => p.value)).toEqual([1.5, 2.5, 3.5]);
    expect(s[0].time).toBe('d2');
  });
});

describe('rsiLatest', () => {
  it('is 100 when every recent move is a gain', () => {
    const rising = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(rsiLatest(rising)).toBe(100);
  });

  it('falls below 50 on a net decline', () => {
    const falling = Array.from({ length: 20 }, (_, i) => 100 - i);
    expect(rsiLatest(falling)).toBeLessThan(50);
  });

  it('returns the neutral 50 fallback without enough data', () => {
    expect(rsiLatest([1, 2, 3])).toBe(50);
  });
});

describe('low52Week', () => {
  it('is the minimum close in the trailing window', () => {
    expect(low52Week([at('d1', 100), at('d2', 80), at('d3', 90)])).toBe(80);
  });
});

describe('ytdReturnPct', () => {
  it('measures the latest close against the last close of the prior year', () => {
    const pts = [at('2025-12-31', 100), at('2026-06-01', 110)];
    expect(ytdReturnPct(pts)).toBeCloseTo(10);
  });

  it('is 0 when there is no prior-year close to anchor to', () => {
    expect(ytdReturnPct([at('2026-01-05', 100), at('2026-06-01', 110)])).toBe(0);
    expect(ytdReturnPct([])).toBe(0);
  });
});
