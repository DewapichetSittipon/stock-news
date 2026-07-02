export interface PricePoint {
  date: string; // ISO YYYY-MM-DD
  close: number;
}

export interface TickerConfig {
  symbol: string;
  name: string;
  baseTHB: number;
}

export interface TickerAnalytics {
  symbol: string;
  name: string;
  baseTHB: number;
  latestDate: string;
  latestClose: number;
  high52: number;
  drawdownPct: number; // <= 0
  multiplier: number; // 1..5
  recommendedTHB: number;
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
