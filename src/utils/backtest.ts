import type { PricePoint } from '../types';
import {
  compute52WeekHigh,
  computeDrawdownPct,
  multiplierForDrawdown,
} from './dcaCalculator';

export interface BacktestResult {
  invested: number;
  units: number;
  finalValue: number;
  returnPct: number;
  months: number;
}

// Index of the first trading day of each month.
const monthlyBuyIndices = (points: PricePoint[]): number[] => {
  const indices: number[] = [];
  let lastMonth = '';
  for (let i = 0; i < points.length; i += 1) {
    const month = points[i].date.slice(0, 7);
    if (month !== lastMonth) {
      indices.push(i);
      lastMonth = month;
    }
  }
  return indices;
};

// Simulate buying `baseAmount` (× Smart DCA multiplier if smart) on the first
// trading day of every month across the given history.
export const runBacktest = (
  points: PricePoint[],
  baseAmount: number,
  smart: boolean,
): BacktestResult => {
  const indices = monthlyBuyIndices(points);
  let invested = 0;
  let units = 0;
  for (const i of indices) {
    const price = points[i].close;
    if (price <= 0) continue;
    let multiplier = 1;
    if (smart) {
      const high = compute52WeekHigh(points.slice(0, i + 1));
      multiplier = multiplierForDrawdown(computeDrawdownPct(price, high));
    }
    const amount = baseAmount * multiplier;
    invested += amount;
    units += amount / price;
  }
  const finalPrice = points[points.length - 1]?.close ?? 0;
  const finalValue = units * finalPrice;
  return {
    invested,
    units,
    finalValue,
    returnPct: invested > 0 ? (finalValue / invested - 1) * 100 : 0,
    months: indices.length,
  };
};
