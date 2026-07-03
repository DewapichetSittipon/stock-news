import type { LedgerEntry } from '../types';

const monthKey = (entry: LedgerEntry): string =>
  `${entry.date.slice(0, 7)}|${entry.symbol}`;

// Monthly DCA buys are one per symbol per calendar month (ADR-0005), so new
// entries dedup against the ledger by month — not exact date. A second monthly
// send inside an already-recorded month (state loss, FORCE_SEND dispatch, dev
// seeds) arrives with a different EOD date and must not double-record the buy.
export const filterNewMonthlyBuys = (
  existing: LedgerEntry[],
  incoming: LedgerEntry[],
): LedgerEntry[] => {
  const seen = new Set(existing.map(monthKey));
  return incoming.filter((entry) => !seen.has(monthKey(entry)));
};
