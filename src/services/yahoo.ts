import type { PricePoint } from '../types';

// Keyless EOD source. Fetched server-side (in the GitHub Action); the browser
// never calls this directly — it reads the committed prices.json snapshot.
export const yahooChartUrl = (symbol: string, range = '5y'): string =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${range}&interval=1d`;

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
}

export const parseYahooChart = (json: YahooChartResponse): PricePoint[] => {
  const result = json.chart?.result?.[0];
  if (!result) return [];
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: PricePoint[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const close = closes[i];
    if (close == null || !Number.isFinite(close)) continue;
    points.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      close: Number(close.toFixed(2)),
    });
  }
  return points;
};
