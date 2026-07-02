import type { TickerConfig } from './types';
import tickers from '../config/tickers.json';

// Ticker Config — the single source of truth (see CONTEXT.md).
export const TICKERS: TickerConfig[] = tickers as TickerConfig[];
