import type { PricePoint } from '../types';

// Deterministic mock EOD history so dev / offline mode renders realistically.
const BASE_PRICE: Record<string, number> = {
  VOO: 500,
  SCHD: 28,
  QQQM: 195,
  SNDK: 45,
};

const hashSeed = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

export const generateMockHistory = (symbol: string, days = 400): PricePoint[] => {
  const random = mulberry32(hashSeed(symbol));
  let price = BASE_PRICE[symbol] ?? 100;
  const points: PricePoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const drift = 0.0003;
    const shock = (random() - 0.5) * 0.03;
    price = Math.max(1, price * (1 + drift + shock));
    points.push({ date: toISODate(day), close: Number(price.toFixed(2)) });
  }
  return points;
};
