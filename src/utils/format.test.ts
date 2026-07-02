import { describe, expect, it } from 'vitest';
import {
  formatDrawdown,
  formatSignedPct,
  formatSignedUSD,
  formatTHB,
  formatUSD,
} from './format';

describe('formatTHB', () => {
  it('rounds to whole baht with a grouped thousands separator', () => {
    expect(formatTHB(1234.6)).toBe('฿1,235');
    expect(formatTHB(0)).toBe('฿0');
  });
});

describe('formatUSD', () => {
  it('always shows two decimals', () => {
    expect(formatUSD(1234.5)).toBe('$1,234.50');
    expect(formatUSD(9)).toBe('$9.00');
  });
});

describe('formatDrawdown', () => {
  it('uses a down arrow for a decline and up for a gain', () => {
    expect(formatDrawdown(-3.14)).toBe('↓3.1%');
    expect(formatDrawdown(2)).toBe('↑2.0%');
    expect(formatDrawdown(0)).toBe('↓0.0%'); // 0 counts as "not above the high"
  });
});

describe('formatSignedPct', () => {
  it('picks the arrow from the sign and shows two decimals', () => {
    expect(formatSignedPct(1.5)).toBe('↑1.50%');
    expect(formatSignedPct(-10.626)).toBe('↓10.63%');
  });
});

describe('formatSignedUSD', () => {
  it('prefixes an explicit sign before the dollar amount', () => {
    expect(formatSignedUSD(241.5)).toBe('+$241.50');
    expect(formatSignedUSD(-241.51)).toBe('-$241.51');
  });
});
