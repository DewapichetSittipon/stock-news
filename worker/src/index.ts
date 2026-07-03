// Cloudflare Worker — read-only live-quote proxy for `mode: "daily"` tickers.
//
// Why this exists: the browser can't call Yahoo directly (CORS), and the Smart
// DCA signal / LINE / prices.json all stay EOD by design. This adds ONLY a live
// price overlay on the dashboard's daily cards. It never writes anything.
//
// Regenerate `Env` with `npx wrangler types` after editing wrangler.jsonc.
interface Env {
  // Comma-separated allow-list of quotable symbols (the daily-mode tickers).
  ALLOWED_SYMBOLS?: string;
}

interface QuoteResponse {
  symbol: string;
  price: number;
  prevClose: number;
  changeUsd: number;
  changePct: number;
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED';
  time: number; // unix seconds of the last trade
}

// Public, read-only market data with no credentials, so `*` is safe and keeps
// the cached response valid for every origin (dashboard domain + localhost dev).
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });

// Same keyless host the daily EOD ingest uses, but the intraday granularity so
// meta.regularMarketPrice reflects the live price.
const yahooUrl = (symbol: string): string =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;

interface YahooMeta {
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketTime?: number;
  currentTradingPeriod?: {
    pre?: { start?: number; end?: number };
    regular?: { start?: number; end?: number };
    post?: { start?: number; end?: number };
  };
}

interface YahooChart {
  chart?: { error?: unknown; result?: Array<{ meta?: YahooMeta }> };
}

const inRange = (r: { start?: number; end?: number } | undefined, now: number): boolean =>
  r?.start != null && r?.end != null && now >= r.start && now < r.end;

const marketStateFrom = (meta: YahooMeta, now: number): QuoteResponse['marketState'] => {
  const p = meta.currentTradingPeriod;
  if (inRange(p?.regular, now)) return 'REGULAR';
  if (inRange(p?.pre, now)) return 'PRE';
  if (inRange(p?.post, now)) return 'POST';
  // Fallback when Yahoo omits the trading period: a very recent trade ≈ live.
  if (meta.regularMarketTime != null && now - meta.regularMarketTime < 120) return 'REGULAR';
  return 'CLOSED';
};

const round2 = (n: number): number => Number(n.toFixed(2));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

    const url = new URL(request.url);
    if (url.pathname !== '/quote') return json({ error: 'not_found' }, 404);

    const symbol = (url.searchParams.get('symbol') ?? '').toUpperCase();
    if (!/^[A-Z0-9.\-=]{1,12}$/.test(symbol)) return json({ error: 'invalid_symbol' }, 400);

    const allow = (env.ALLOWED_SYMBOLS ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (allow.length > 0 && !allow.includes(symbol)) {
      return json({ error: 'symbol_not_allowed' }, 403);
    }

    // Serve a briefly-cached copy so rapid client polling doesn't hammer Yahoo.
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      const upstream = await fetch(yahooUrl(symbol), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartDCA/1.0)' },
      });
      if (!upstream.ok) return json({ error: 'upstream_error', status: upstream.status }, 502);

      const data = (await upstream.json()) as YahooChart;
      const meta = data.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      const prevClose = meta?.chartPreviousClose ?? meta?.previousClose;
      if (
        meta == null ||
        price == null ||
        prevClose == null ||
        !Number.isFinite(price) ||
        !Number.isFinite(prevClose)
      ) {
        return json({ error: 'no_quote' }, 502);
      }

      const now = Math.floor(Date.now() / 1000);
      const changeUsd = price - prevClose;
      const body: QuoteResponse = {
        symbol,
        price: round2(price),
        prevClose: round2(prevClose),
        changeUsd: round2(changeUsd),
        changePct: round2(prevClose > 0 ? (changeUsd / prevClose) * 100 : 0),
        marketState: marketStateFrom(meta, now),
        time: meta.regularMarketTime ?? now,
      };

      const response = json(body, 200, { 'Cache-Control': 'public, max-age=30' });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (error) {
      return json({ error: 'proxy_failure', message: String(error) }, 502);
    }
  },
} satisfies ExportedHandler<Env>;
