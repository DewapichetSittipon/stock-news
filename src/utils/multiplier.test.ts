import { describe, expect, it } from 'vitest';
import { multiplierMeta } from './multiplier';

describe('multiplierMeta', () => {
  it('returns distinct labels/colours for each 1..5 band', () => {
    for (let m = 1; m <= 5; m += 1) {
      expect(multiplierMeta(m).label).toBe(`${m}x`);
      expect(multiplierMeta(m).hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('falls back to the 1x meta for out-of-range values', () => {
    expect(multiplierMeta(0)).toEqual(multiplierMeta(1));
    expect(multiplierMeta(99)).toEqual(multiplierMeta(1));
  });
});
