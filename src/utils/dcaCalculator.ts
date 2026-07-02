import type { DividendPoint, PricePoint, TickerAnalytics, TickerConfig } from '../types';
import { multiplierMeta } from './multiplier';
import {
  low52Week,
  rsiLatest,
  smaLatest,
  ttmDividendPerShare,
  ytdReturnPct,
} from './indicators';
import type { LinePoint } from './indicators';

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

// Historical Buy Multiplier per day, coloured for chart overlays. At each day
// the drawdown is measured against the trailing-252-day high up to that point,
// so it mirrors what the signal would have said on that date.
export interface MultiplierBand extends LinePoint {
  color: string;
  multiplier: number;
}

export const multiplierSeries = (history: PricePoint[]): MultiplierBand[] => {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const bands: MultiplierBand[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const window = sorted.slice(Math.max(0, i - TRADING_DAYS_PER_YEAR + 1), i + 1);
    const high = window.reduce((max, p) => Math.max(max, p.close), 0);
    const drawdown = computeDrawdownPct(sorted[i].close, high);
    const multiplier = multiplierForDrawdown(drawdown);
    bands.push({
      time: sorted[i].date,
      value: 1,
      color: multiplierMeta(multiplier).hex,
      multiplier,
    });
  }
  return bands;
};

export const analyzeTicker = (
  config: TickerConfig,
  history: PricePoint[],
  dividends: DividendPoint[] = [],
): TickerAnalytics => {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) throw new Error(`No price history for ${config.symbol}`);

  const latest = sorted[sorted.length - 1];
  const prevClose = sorted.length >= 2 ? sorted[sorted.length - 2].close : latest.close;
  const dailyChangeUsd = latest.close - prevClose;
  const dailyChangePct = prevClose > 0 ? (dailyChangeUsd / prevClose) * 100 : 0;

  const closes = sorted.map((point) => point.close);
  const high52 = compute52WeekHigh(sorted);
  const drawdownPct = computeDrawdownPct(latest.close, high52);
  const multiplier = multiplierForDrawdown(drawdownPct);
  const baseTHB = config.baseTHB ?? 0;
  const ttmDividend = ttmDividendPerShare(dividends, latest.date);
  const dividendYieldPct = latest.close > 0 ? (ttmDividend / latest.close) * 100 : 0;

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
    low52: low52Week(sorted),
    drawdownPct,
    multiplier,
    recommendedTHB: baseTHB * multiplier,
    sma50: smaLatest(closes, 50),
    sma200: smaLatest(closes, 200),
    rsi14: rsiLatest(closes),
    ytdPct: ytdReturnPct(sorted),
    ttmDividend,
    dividendYieldPct,
    history: sorted,
  };
};
