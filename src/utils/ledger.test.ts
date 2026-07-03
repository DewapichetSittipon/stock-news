import { describe, expect, it } from 'vitest';
import { filterNewMonthlyBuys } from './ledger';
import type { LedgerEntry } from '../types';

const entry = (date: string, symbol: string): LedgerEntry => ({
  date,
  symbol,
  amountTHB: 1000,
  priceUSD: 100,
  units: 10,
});

describe('filterNewMonthlyBuys', () => {
  it('drops a buy whose symbol is already recorded that month, even on another date', () => {
    const existing = [entry('2026-07-01', 'VOO')];
    expect(filterNewMonthlyBuys(existing, [entry('2026-07-02', 'VOO')])).toEqual([]);
  });

  it('keeps buys for a new month', () => {
    const existing = [entry('2026-07-01', 'VOO')];
    const incoming = [entry('2026-08-01', 'VOO')];
    expect(filterNewMonthlyBuys(existing, incoming)).toEqual(incoming);
  });

  it('keeps other symbols in the same month', () => {
    const existing = [entry('2026-07-01', 'VOO')];
    const incoming = [entry('2026-07-02', 'SCHD')];
    expect(filterNewMonthlyBuys(existing, incoming)).toEqual(incoming);
  });

  it('handles an empty ledger', () => {
    const incoming = [entry('2026-07-01', 'VOO'), entry('2026-07-01', 'SCHD')];
    expect(filterNewMonthlyBuys([], incoming)).toEqual(incoming);
  });
});
