import { describe, expect, it } from 'vitest';
import { portfolioSeries } from './portfolio';
import type { LedgerEntry, PricePoint } from '../types';

const hist = (pairs: [string, number][]): PricePoint[] =>
  pairs.map(([date, close]) => ({ date, close }));

const buy = (
  date: string,
  symbol: string,
  amountTHB: number,
  priceUSD: number,
): LedgerEntry => ({ date, symbol, amountTHB, priceUSD, units: amountTHB / priceUSD });

describe('portfolioSeries', () => {
  it('returns empty for an empty ledger', () => {
    expect(portfolioSeries([], { VOO: hist([['2024-01-02', 100]]) })).toEqual([]);
  });

  it('starts at the first buy and follows the close ratio', () => {
    const series = portfolioSeries([buy('2024-01-02', 'VOO', 1000, 100)], {
      VOO: hist([
        ['2024-01-01', 90],
        ['2024-01-02', 100],
        ['2024-01-03', 110],
        ['2024-01-04', 99],
      ]),
    });
    expect(series).toEqual([
      { date: '2024-01-02', invested: 1000, value: 1000 },
      { date: '2024-01-03', invested: 1000, value: 1100 },
      { date: '2024-01-04', invested: 1000, value: 990 },
    ]);
  });

  it('steps invested up on each later buy', () => {
    const series = portfolioSeries(
      [buy('2024-01-02', 'VOO', 1000, 100), buy('2024-01-03', 'VOO', 1100, 110)],
      {
        VOO: hist([
          ['2024-01-02', 100],
          ['2024-01-03', 110],
          ['2024-01-04', 99],
        ]),
      },
    );
    expect(series[1]).toEqual({ date: '2024-01-03', invested: 2100, value: 2200 });
    expect(series[2].value).toBeCloseTo(1980);
  });

  it('carries the last close forward when a symbol skips a date', () => {
    const series = portfolioSeries(
      [buy('2024-01-02', 'VOO', 1000, 100), buy('2024-01-02', 'SCHD', 500, 50)],
      {
        VOO: hist([
          ['2024-01-02', 100],
          ['2024-01-03', 110],
        ]),
        SCHD: hist([['2024-01-02', 50]]),
      },
    );
    // 2024-01-03: VOO re-priced at 110, SCHD holds its last close (50).
    expect(series[1]).toEqual({ date: '2024-01-03', invested: 1500, value: 1600 });
  });
});
