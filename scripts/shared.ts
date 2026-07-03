import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { analyzeTicker } from '../src/utils/dcaCalculator';
import {
  parseUsdThb,
  parseYahooChart,
  parseYahooDividends,
  yahooChartUrl,
} from '../src/services/yahoo';
import type {
  DividendPoint,
  LedgerEntry,
  NewsDigest,
  NewsItem,
  PricePoint,
  PricesFile,
  TickerAnalytics,
  TickerConfig,
} from '../src/types';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_PATH = resolve(ROOT, 'config/tickers.json');
export const PRICES_PATH = resolve(ROOT, 'public/prices.json');
export const NEWS_PATH = resolve(ROOT, 'public/news.json');
export const LEDGER_PATH = resolve(ROOT, 'public/ledger.json');
export const STATE_PATH = resolve(ROOT, '.state/last-sent.json');

// Browser-like UA — Yahoo throttles the default Node fetch agent.
const UA = 'Mozilla/5.0 (compatible; SmartDCA/1.0)';

export const readJson = <T>(path: string, fallback: T): T => {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
};

export const writeJson = (path: string, value: unknown): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

export const loadConfigs = (): TickerConfig[] => {
  const configs = readJson<TickerConfig[]>(CONFIG_PATH, []);
  if (configs.length === 0) throw new Error('config/tickers.json is empty or missing');
  return configs;
};

export interface Collected {
  analyses: TickerAnalytics[];
  failed: string[];
  history: Record<string, PricePoint[]>;
  dividends: Record<string, DividendPoint[]>;
}

export const collectPrices = async (configs: TickerConfig[]): Promise<Collected> => {
  const analyses: TickerAnalytics[] = [];
  const failed: string[] = [];
  const history: Record<string, PricePoint[]> = {};
  const dividends: Record<string, DividendPoint[]> = {};

  for (const config of configs) {
    try {
      const response = await fetch(yahooChartUrl(config.symbol), {
        headers: { 'User-Agent': UA },
      });
      if (!response.ok) throw new Error(`Yahoo ${config.symbol} HTTP ${response.status}`);
      const json = await response.json();
      const points = parseYahooChart(json);
      if (points.length === 0) throw new Error(`Yahoo ${config.symbol} returned no points`);
      const divs = parseYahooDividends(json);
      history[config.symbol] = points;
      dividends[config.symbol] = divs;
      analyses.push(analyzeTicker(config, points, divs));
    } catch (error) {
      console.error(`[price] ${config.symbol}`, error);
      failed.push(config.symbol);
    }
  }
  return { analyses, failed, history, dividends };
};

// Latest USD→THB rate, best-effort (null if the fetch/parse fails).
export const fetchUsdThb = async (): Promise<number | null> => {
  try {
    const response = await fetch(yahooChartUrl('THB=X', '5d'), {
      headers: { 'User-Agent': UA },
    });
    if (!response.ok) throw new Error(`Yahoo THB=X HTTP ${response.status}`);
    return parseUsdThb(await response.json());
  } catch (error) {
    console.error('[fx] THB=X', error);
    return null;
  }
};

export const writePricesFile = (
  history: Record<string, PricePoint[]>,
  dividends: Record<string, DividendPoint[]> = {},
  usdThb: number | null = null,
): void => {
  const file: PricesFile = {
    generatedAt: new Date().toISOString(),
    data: history,
    dividends,
    ...(usdThb != null ? { usdThb } : {}),
  };
  writeJson(PRICES_PATH, file);
};

export const refreshNews = async (configs: TickerConfig[]): Promise<NewsDigest> => {
  const digest = readJson<NewsDigest>(NEWS_PATH, {});
  const parser = new XMLParser();

  for (const config of configs) {
    try {
      const query = encodeURIComponent(`${config.symbol} ETF stock`);
      const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
      const response = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!response.ok) throw new Error(`News ${config.symbol} HTTP ${response.status}`);
      const parsed = parser.parse(await response.text());
      const raw = parsed?.rss?.channel?.item ?? [];
      const list = Array.isArray(raw) ? raw : [raw];
      digest[config.symbol] = list
        .slice(0, 6)
        .map((item: Record<string, unknown>): NewsItem => ({
          title: String(item.title ?? ''),
          link: String(item.link ?? ''),
          date: item.pubDate ? new Date(String(item.pubDate)).toISOString() : '',
        }));
    } catch (error) {
      console.error(`[news] ${config.symbol}`, error);
    }
  }
  writeJson(NEWS_PATH, digest);
  return digest;
};

// Append monthly buys to the ledger, skipping any (date, symbol) already there
// so re-runs / manual FORCE_SEND on the same day don't create duplicates.
export const appendLedger = (entries: LedgerEntry[]): void => {
  const ledger = readJson<LedgerEntry[]>(LEDGER_PATH, []);
  const seen = new Set(ledger.map((entry) => `${entry.date}|${entry.symbol}`));
  const fresh = entries.filter((entry) => !seen.has(`${entry.date}|${entry.symbol}`));
  if (fresh.length === 0) return;
  writeJson(LEDGER_PATH, [...ledger, ...fresh]);
};
