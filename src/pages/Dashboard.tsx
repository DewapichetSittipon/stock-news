import { NewsCard } from '../components/NewsCard';
import { StockCard } from '../components/StockCard';
import { useNews } from '../hooks/useNews';
import { useStockAnalytics } from '../hooks/useStockAnalytics';
import { formatTHB, formatThaiDate } from '../utils/format';

export const Dashboard = (): JSX.Element => {
  const { data, isLoading } = useStockAnalytics();
  const news = useNews();

  const dcaData = data.filter((item) => item.mode === 'dca');
  const dailyData = data.filter((item) => item.mode === 'daily');
  const monthlyTotal = dcaData.reduce((sum, item) => sum + item.recommendedTHB, 0);
  const latestDate = data[0]?.latestDate;

  return (
    <div className="px-4 py-5 sm:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">แนะนำเดือนนี้</h2>
          {latestDate && (
            <p className="text-sm text-slate-400">
              อิงราคาปิดล่าสุด {formatThaiDate(latestDate)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">รวม DCA/เดือน</p>
          <p className="text-lg font-bold text-emerald-400 sm:text-xl">
            {formatTHB(monthlyTotal)}
          </p>
        </div>
      </header>

      {isLoading && data.length === 0 ? (
        <p className="text-slate-400">กำลังโหลดข้อมูล…</p>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {dcaData.map((analytics) => (
            <StockCard key={analytics.symbol} analytics={analytics} />
          ))}
        </div>
      )}

      {dailyData.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 text-lg font-bold text-white sm:text-xl">
            ติดตามรายวัน
          </h2>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {dailyData.map((analytics) => (
              <StockCard key={analytics.symbol} analytics={analytics} />
            ))}
          </div>
        </>
      )}

      <h2 className="mb-4 mt-8 text-lg font-bold text-white sm:text-xl">ข่าวล่าสุด</h2>
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
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
