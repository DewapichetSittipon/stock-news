export interface MultiplierMeta {
  emoji: string;
  label: string;
  dotClass: string; // tailwind background class
  hex: string; // used by charts and the LINE message
}

// Green (buy the base) → dark red (buy 5x). Shared by the UI badge and the
// LINE notification so both render the same colour language.
const META: Record<number, MultiplierMeta> = {
  1: { emoji: '🟢', label: '1x', dotClass: 'bg-emerald-500', hex: '#10b981' },
  2: { emoji: '🟡', label: '2x', dotClass: 'bg-yellow-400', hex: '#facc15' },
  3: { emoji: '🟠', label: '3x', dotClass: 'bg-orange-500', hex: '#f97316' },
  4: { emoji: '🔴', label: '4x', dotClass: 'bg-red-500', hex: '#ef4444' },
  5: { emoji: '🔴', label: '5x', dotClass: 'bg-red-700', hex: '#b91c1c' },
};

export const multiplierMeta = (multiplier: number): MultiplierMeta =>
  META[multiplier] ?? META[1];
