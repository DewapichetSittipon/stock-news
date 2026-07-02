export interface PricePoint {
  date: string; // ISO YYYY-MM-DD
  close: number;
}

// "dca"   → monthly Smart DCA buy recommendation
// "daily" → tracked daily for up/down movement (not a DCA holding)
export type TickerMode = 'dca' | 'daily';

export interface TickerConfig {
  symbol: string;
  name: string;
  mode: TickerMode;
  baseTHB?: number; // required for "dca", ignored for "daily"
}

export interface TickerAnalytics {
  symbol: string;
  name: string;
  mode: TickerMode;
  baseTHB: number;
  latestDate: string;
  latestClose: number;
  prevClose: number;
  dailyChangeUsd: number;
  dailyChangePct: number;
  high52: number;
  low52: number;
  drawdownPct: number; // <= 0
  multiplier: number; // 1..5
  recommendedTHB: number;
  sma50: number;
  sma200: number;
  rsi14: number;
  ytdPct: number;
  history: PricePoint[];
}

export interface NewsItem {
  title: string;
  link: string;
  date: string; // ISO, may be empty
}

export type NewsDigest = Record<string, NewsItem[]>;

export interface PricesFile {
  generatedAt: string;
  data: Record<string, PricePoint[]>;
}

export interface LedgerEntry {
  date: string; // ISO buy date
  symbol: string;
  amountTHB: number;
  priceUSD: number;
  units: number; // amountTHB / priceUSD
}
