import type { TickerAnalytics } from '../types';
import { TICKERS } from '../config';
import { analyzeTicker } from '../utils/dcaCalculator';
import { generateMockHistory } from './mockData';
import { fetchPricesFile } from './prices';

export interface AnalyticsResult {
  analytics: TickerAnalytics[];
  generatedAt: string; // when the Action last wrote prices.json ('' if unknown)
  usdThb: number | null; // THB per 1 USD, null if unavailable
}

// Analyze every ticker from the committed snapshot. If a ticker is missing
// from prices.json (e.g. before the Action's first run in local dev), fall
// back to deterministic mock history so the UI still renders.
export const loadAllAnalytics = async (): Promise<AnalyticsResult> => {
  const prices = await fetchPricesFile();
  const analytics = TICKERS.map((config) => {
    const history = prices.data[config.symbol];
    const usable =
      history && history.length > 0 ? history : generateMockHistory(config.symbol);
    const dividends = prices.dividends?.[config.symbol] ?? [];
    return analyzeTicker(config, usable, dividends);
  });
  return {
    analytics,
    generatedAt: prices.generatedAt,
    usdThb: prices.usdThb ?? null,
  };
};
