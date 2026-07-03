import { useQuery } from '@tanstack/react-query';
import { fetchLiveQuote, liveQuoteEnabled, type LiveQuote } from '../services/liveQuote';

// Live price for a single `daily` ticker. Returns null (and never fetches) for
// dca tickers or when no proxy URL is configured, so it's safe to call
// unconditionally from StockCard. Polls fast only while the US market is open;
// backs right off otherwise (US regular hours ≈ 20:30–03:00 Bangkok).
export const useLiveQuote = (symbol: string, active: boolean): LiveQuote | null => {
  const query = useQuery({
    queryKey: ['liveQuote', symbol],
    queryFn: () => fetchLiveQuote(symbol),
    enabled: active && liveQuoteEnabled,
    staleTime: 20_000,
    refetchInterval: (q) => (q.state.data?.marketState === 'REGULAR' ? 30_000 : 300_000),
    refetchIntervalInBackground: false,
  });
  return query.data ?? null;
};
