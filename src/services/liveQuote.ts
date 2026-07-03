// Optional live-quote overlay for `mode: "daily"` tickers, served by the
// Cloudflare Worker in /worker (Yahoo-backed). This is display-only: the Smart
// DCA signal, prices.json and the LINE notification stay end-of-day.
//
// When VITE_QUOTE_PROXY_URL is unset the dashboard just uses the committed EOD
// prices.json — the overlay is purely additive and degrades silently.
export interface LiveQuote {
  symbol: string;
  price: number;
  prevClose: number;
  changeUsd: number;
  changePct: number;
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED';
  time: number; // unix seconds of the last trade
}

const BASE = (import.meta.env.VITE_QUOTE_PROXY_URL ?? '').replace(/\/$/, '');

export const liveQuoteEnabled = BASE.length > 0;

export const fetchLiveQuote = async (symbol: string): Promise<LiveQuote | null> => {
  if (!liveQuoteEnabled) return null;
  const response = await fetch(`${BASE}/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!response.ok) return null;
  const data = (await response.json()) as LiveQuote;
  return Number.isFinite(data.price) ? data : null;
};
