import type { PricesFile } from '../types';

const EMPTY: PricesFile = { generatedAt: '', data: {} };

// Reads the static prices.json committed daily by the GitHub Action. This is
// the same data the LINE signal is computed from, so the dashboard and the
// notification never disagree.
export const fetchPricesFile = async (): Promise<PricesFile> => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}prices.json`, {
      cache: 'no-cache',
    });
    if (!response.ok) return EMPTY;
    return (await response.json()) as PricesFile;
  } catch {
    return EMPTY;
  }
};
