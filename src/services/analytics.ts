import type { TickerAnalytics } from '../types';
import { TICKERS } from '../config';
import { analyzeTicker } from '../utils/dcaCalculator';
import { generateMockHistory } from './mockData';
import { fetchPricesFile } from './prices';

// Analyze every ticker from the committed snapshot. If a ticker is missing
// from prices.json (e.g. before the Action's first run in local dev), fall
// back to deterministic mock history so the UI still renders.
export const loadAllAnalytics = async (): Promise<TickerAnalytics[]> => {
  const prices = await fetchPricesFile();
  return TICKERS.map((config) => {
    const history = prices.data[config.symbol];
    const usable =
      history && history.length > 0 ? history : generateMockHistory(config.symbol);
    return analyzeTicker(config, usable);
  });
};
