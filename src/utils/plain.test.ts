import { describe, expect, it } from 'vitest';
import { plainMonthlyPlan, plainReason } from './plain';
import type { PlanInput } from './plain';

const ticker = (overrides: Partial<PlanInput> & { symbol: string }): PlanInput => ({
  multiplier: 1,
  drawdownPct: -2,
  recommendedTHB: 1000,
  ...overrides,
});

describe('plainReason', () => {
  it('reads as "normal price" at 1x', () => {
    expect(plainReason(1, -3.2)).toBe('ราคาปกติ ซื้อตามแผนเดิม');
  });

  it('frames deeper drawdown as a rounded discount with the multiplier', () => {
    expect(plainReason(3, -12.4)).toBe(
      'ถูกลง 12% จากจุดสูงสุดในรอบปี → ซื้อเพิ่มเป็น 3 เท่า',
    );
  });
});

describe('plainMonthlyPlan', () => {
  const dca = [
    ticker({ symbol: 'VOO', recommendedTHB: 2000 }),
    ticker({ symbol: 'QQQM', multiplier: 3, drawdownPct: -12.4, recommendedTHB: 3000 }),
  ];

  it('sums the month total and keeps one line per ticker', () => {
    const plan = plainMonthlyPlan(dca, false);
    expect(plan.headline).toBe('เดือนนี้ใช้เงินซื้อรวม ฿5,000');
    expect(plan.lines).toHaveLength(2);
    expect(plan.lines[1]).toEqual({
      symbol: 'QQQM',
      amount: '฿3,000',
      reason: 'ถูกลง 12% จากจุดสูงสุดในรอบปี → ซื้อเพิ่มเป็น 3 เท่า',
      multiplier: 3,
    });
  });

  it('mentions the discount only when some multiplier exceeds 1x', () => {
    expect(plainMonthlyPlan(dca, false).detail).toContain('ราคาลดลง');
    expect(
      plainMonthlyPlan([ticker({ symbol: 'VOO' })], false).detail,
    ).toContain('ราคาปกติ');
  });

  it('switches to "already bought" once the ledger has this month', () => {
    const plan = plainMonthlyPlan(dca, true);
    expect(plan.headline).toBe('เดือนนี้ซื้อเรียบร้อยแล้ว ✓');
    expect(plan.lines).toHaveLength(2);
  });
});
