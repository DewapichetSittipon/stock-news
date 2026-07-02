import { DataStatus } from '../components/DataStatus';
import { NewsCard } from '../components/NewsCard';
import { Portfolio } from '../components/Portfolio';
import { StockCard } from '../components/StockCard';
import { useLedger } from '../hooks/useLedger';
import { useNews } from '../hooks/useNews';
import { useStockAnalytics } from '../hooks/useStockAnalytics';
import { bangkokMonth, formatTHB, formatThaiDate } from '../utils/format';

export const Dashboard = (): JSX.Element => {
  const { data, generatedAt, usdThb, isLoading } = useStockAnalytics();
  const news = useNews();
  const ledger = useLedger();

  const dcaData = data.filter((item) => item.mode === 'dca');
  const dailyData = data.filter((item) => item.mode === 'daily');
  const monthlyTotal = dcaData.reduce((sum, item) => sum + item.recommendedTHB, 0);
  const latestDate = data[0]?.latestDate;

  // Whether this calendar month's DCA buy is already recorded in the ledger.
  const thisMonth = bangkokMonth();
  const boughtThisMonth = (ledger.data ?? []).some((entry) =>
    entry.date.startsWith(thisMonth),
  );

  return (
    <div className="px-4 py-5 sm:px-6">
      <Portfolio ledger={ledger.data ?? []} analytics={data} usdThb={usdThb} />

      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white sm:text-2xl">แนะนำเดือนนี้</h2>
            {dcaData.length > 0 &&
              (boughtThisMonth ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  ✓ DCA เดือนนี้แล้ว
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
                  ● ยังไม่ได้ DCA เดือนนี้
                </span>
              ))}
          </div>
          {latestDate && (
            <p className="text-sm text-slate-400">
              อิงราคาปิดล่าสุด {formatThaiDate(latestDate)}
            </p>
          )}
          <DataStatus generatedAt={generatedAt} />
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
            <StockCard key={analytics.symbol} analytics={analytics} usdThb={usdThb} />
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
              <StockCard key={analytics.symbol} analytics={analytics} usdThb={usdThb} />
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
