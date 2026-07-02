import type { DividendPoint, PricePoint } from '../types';

// Keyless EOD source. Fetched server-side (in the GitHub Action); the browser
// never calls this directly — it reads the committed prices.json snapshot.
// `events=div` also returns the dividend history in the same response.
export const yahooChartUrl = (symbol: string, range = '5y'): string =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${range}&interval=1d&events=div`;

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      events?: { dividends?: Record<string, { amount?: number; date?: number }> };
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

// Dividend cash-per-share events, sorted oldest→newest.
export const parseYahooDividends = (json: YahooChartResponse): DividendPoint[] => {
  const events = json.chart?.result?.[0]?.events?.dividends ?? {};
  const points: DividendPoint[] = [];
  for (const event of Object.values(events)) {
    if (event.date == null || event.amount == null || !Number.isFinite(event.amount)) continue;
    points.push({
      date: new Date(event.date * 1000).toISOString().slice(0, 10),
      amount: Number(event.amount.toFixed(4)),
    });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
};

// Latest USD→THB rate via the same chart endpoint (symbol "THB=X" is USD/THB,
// i.e. how many baht one dollar buys). Returns null if unavailable.
export const parseUsdThb = (json: YahooChartResponse): number | null => {
  const points = parseYahooChart(json);
  const latest = points[points.length - 1];
  return latest ? latest.close : null;
};
