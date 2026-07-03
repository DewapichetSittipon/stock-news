import { STAT_HELP } from '../utils/plain';

interface Props {
  isDaily: boolean;
}

// Collapsed plain-Thai explanations of every stat on the card, for users who
// don't know the jargon. <details> keeps it zero-state and mobile-friendly.
export const StatGlossary = ({ isDaily }: Props): JSX.Element => (
  <details className="mt-3">
    <summary className="cursor-pointer select-none text-xs text-slate-500 transition-colors hover:text-slate-300">
      💡 ตัวเลขพวกนี้แปลว่าอะไร?
    </summary>
    <dl className="mt-2 space-y-2 rounded-xl bg-slate-800/40 p-3">
      {STAT_HELP.filter((help) => !(help.dcaOnly && isDaily)).map((help) => (
        <div key={help.term}>
          <dt className="text-xs font-semibold text-slate-300">{help.term}</dt>
          <dd className="text-xs leading-relaxed text-slate-500">{help.plain}</dd>
        </div>
      ))}
    </dl>
  </details>
);
