import { StockCard } from '../components/StockCard';
import { useStockAnalytics } from '../hooks/useStockAnalytics';
import { useWatchlistStore } from '../stores/useWatchlistStore';

export const Watchlist = (): JSX.Element => {
  const { data } = useStockAnalytics();
  const favorites = useWatchlistStore((state) => state.favorites);
  const filtered = data.filter((item) => favorites.includes(item.symbol));

  return (
    <div className="p-5 md:p-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Watchlist</h2>
      {filtered.length === 0 ? (
        <p className="text-slate-400">
          ยังไม่มีหุ้นใน Watchlist — กดรูปดาว ☆ บนการ์ดในหน้า Dashboard เพื่อเพิ่ม
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((analytics) => (
            <StockCard key={analytics.symbol} analytics={analytics} />
          ))}
        </div>
      )}
    </div>
  );
};
