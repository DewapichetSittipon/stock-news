import type { LedgerEntry } from '../types';

// Reads the ledger.json the Action appends to on each monthly DCA buy.
export const fetchLedger = async (): Promise<LedgerEntry[]> => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}ledger.json`, {
      cache: 'no-cache',
    });
    if (!response.ok) return [];
    return (await response.json()) as LedgerEntry[];
  } catch {
    return [];
  }
};
