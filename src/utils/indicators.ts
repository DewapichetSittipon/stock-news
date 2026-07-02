import type { PricePoint } from '../types';

export interface LinePoint {
  time: string;
  value: number;
}

// Latest simple moving average over `period` closes (0 if not enough data).
export const smaLatest = (closes: number[], period: number): number => {
  if (closes.length < period) return 0;
  const slice = closes.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
};

// Full SMA series (starts once `period` points exist) — for chart overlays.
export const smaSeries = (points: PricePoint[], period: number): LinePoint[] => {
  const out: LinePoint[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    sum += points[i].close;
    if (i >= period) sum -= points[i - period].close;
    if (i >= period - 1) out.push({ time: points[i].date, value: sum / period });
  }
  return out;
};

// Classic 14-day RSI on the latest window (50 as a neutral fallback).
export const rsiLatest = (closes: number[], period = 14): number => {
  if (closes.length <= period) return 50;
  let gain = 0;
  let loss = 0;
  for (let i = closes.length - period; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  const avgLoss = loss / period;
  if (avgLoss === 0) return 100;
  const rs = gain / period / avgLoss;
  return 100 - 100 / (1 + rs);
};

export const low52Week = (points: PricePoint[]): number => {
  const window = points.slice(-252);
  return window.reduce((min, point) => Math.min(min, point.close), Infinity);
};

// Year-to-date return: latest close vs the last close of the previous year.
export const ytdReturnPct = (points: PricePoint[]): number => {
  if (points.length === 0) return 0;
  const latest = points[points.length - 1];
  const year = latest.date.slice(0, 4);
  const firstOfYear = points.findIndex((point) => point.date.slice(0, 4) === year);
  if (firstOfYear <= 0) return 0;
  const base = points[firstOfYear - 1].close;
  return base > 0 ? ((latest.close - base) / base) * 100 : 0;
};
