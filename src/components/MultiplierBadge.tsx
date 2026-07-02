import { multiplierMeta } from '../utils/multiplier';

interface Props {
  multiplier: number;
}

export const MultiplierBadge = ({ multiplier }: Props): JSX.Element => {
  const meta = multiplierMeta(multiplier);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-100">
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
};
