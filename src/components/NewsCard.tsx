import type { NewsItem } from '../types';
import { formatThaiDate } from '../utils/format';

interface Props {
  symbol: string;
  items: NewsItem[];
}

export const NewsCard = ({ symbol, items }: Props): JSX.Element => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">
      ข่าว {symbol}
    </h3>
    {items.length === 0 ? (
      <p className="text-sm text-slate-500">ยังไม่มีข่าว</p>
    ) : (
      <ul className="space-y-3">
        {items.slice(0, 5).map((item) => (
          <li key={item.link}>
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-200 hover:text-emerald-400"
            >
              {item.title}
            </a>
            {item.date && (
              <p className="text-xs text-slate-500">
                {formatThaiDate(item.date.slice(0, 10))}
              </p>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);
