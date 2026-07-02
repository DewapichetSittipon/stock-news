import type { PricePoint, TickerAnalytics, TickerConfig } from '../types';

export const TRADING_DAYS_PER_YEAR = 252;

// Drawdown (a value <= 0) → Buy Multiplier band.
// See CONTEXT.md ("Buy Multiplier") and docs/adr for the rationale.
export const multiplierForDrawdown = (drawdownPct: number): number => {
  if (drawdownPct <= -20) return 5;
  if (drawdownPct <= -15) return 4;
  if (drawdownPct <= -10) return 3;
  if (drawdownPct <= -5) return 2;
  return 1;
};

export const compute52WeekHigh = (history: PricePoint[]): number => {
  const window = history.slice(-TRADING_DAYS_PER_YEAR);
  return window.reduce((max, point) => Math.max(max, point.close), 0);
};

export const computeDrawdownPct = (latestClose: number, high52: number): number =>
  high52 <= 0 ? 0 : ((latestClose - high52) / high52) * 100;

export const analyzeTicker = (
  config: TickerConfig,
  history: PricePoint[],
): TickerAnalytics => {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) throw new Error(`No price history for ${config.symbol}`);

  const latest = sorted[sorted.length - 1];
  const prevClose = sorted.length >= 2 ? sorted[sorted.length - 2].close : latest.close;
  const dailyChangeUsd = latest.close - prevClose;
  const dailyChangePct = prevClose > 0 ? (dailyChangeUsd / prevClose) * 100 : 0;

  const high52 = compute52WeekHigh(sorted);
  const drawdownPct = computeDrawdownPct(latest.close, high52);
  const multiplier = multiplierForDrawdown(drawdownPct);
  const baseTHB = config.baseTHB ?? 0;

  return {
    symbol: config.symbol,
    name: config.name,
    mode: config.mode,
    baseTHB,
    latestDate: latest.date,
    latestClose: latest.close,
    prevClose,
    dailyChangeUsd,
    dailyChangePct,
    high52,
    drawdownPct,
    multiplier,
    recommendedTHB: baseTHB * multiplier,
    history: sorted,
  };
};
