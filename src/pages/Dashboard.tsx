import { NewsCard } from '../components/NewsCard';
import { StockCard } from '../components/StockCard';
import { useNews } from '../hooks/useNews';
import { useStockAnalytics } from '../hooks/useStockAnalytics';
import { formatTHB, formatThaiDate } from '../utils/format';

export const Dashboard = (): JSX.Element => {
  const { data, isLoading } = useStockAnalytics();
  const news = useNews();

  const totalToday = data.reduce((sum, item) => sum + item.recommendedTHB, 0);
  const latestDate = data[0]?.latestDate;

  return (
    <div className="p-5 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          {latestDate && (
            <p className="text-sm text-slate-400">
              อิงราคาปิด {formatThaiDate(latestDate)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">รวมแนะนำวันนี้</p>
          <p className="text-xl font-bold text-emerald-400">{formatTHB(totalToday)}</p>
        </div>
      </header>

      {isLoading && data.length === 0 ? (
        <p className="text-slate-400">กำลังโหลดข้อมูล…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.map((analytics) => (
            <StockCard key={analytics.symbol} analytics={analytics} />
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-10 text-xl font-bold text-white">ข่าวล่าสุด</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {data.map((analytics) => (
          <NewsCard
            key={analytics.symbol}
            symbol={analytics.symbol}
            items={news.data?.[analytics.symbol] ?? []}
          />
        ))}
      </div>
    </div>
  );
};
