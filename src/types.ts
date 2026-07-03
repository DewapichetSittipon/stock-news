export interface PricePoint {
  date: string; // ISO YYYY-MM-DD
  close: number;
}

export interface DividendPoint {
  date: string; // ISO YYYY-MM-DD (ex-dividend date)
  amount: number; // cash dividend per share, in USD
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
  ttmDividend: number; // sum of dividends/share over the trailing 12 months (USD)
  dividendYieldPct: number; // ttmDividend / latestClose * 100
  history: PricePoint[];
}

export interface NewsItem {
  title: string; // English, as fetched from Google News ("Headline - Source")
  titleTh?: string; // Thai translation of the headline, added at ingest (best-effort)
  link: string;
  date: string; // ISO, may be empty
}

export type NewsDigest = Record<string, NewsItem[]>;

export interface PricesFile {
  generatedAt: string;
  data: Record<string, PricePoint[]>;
  dividends?: Record<string, DividendPoint[]>;
  usdThb?: number; // THB per 1 USD at generatedAt (for display + valuation)
}

export interface LedgerEntry {
  date: string; // ISO buy date
  symbol: string;
  amountTHB: number;
  priceUSD: number;
  units: number; // amountTHB / priceUSD
  fxRate?: number; // THB per 1 USD at buy time; absent on legacy entries
}
