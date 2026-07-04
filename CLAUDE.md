# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pure-frontend PWA "Smart DCA" dashboard for a handful of ETFs/stocks. There is
**no backend and no runtime API**: a daily GitHub Action fetches prices/news,
computes the signal, commits static JSON into `public/`, and the browser reads
those files directly. The dashboard and the LINE notification therefore share
one source of truth and can never disagree.

## Commands

```bash
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # tsc --noEmit && vite build
npm run typecheck  # tsc --noEmit (build runs this first)
npm test           # vitest run (Node env, only src/**/*.test.ts)
npm run test:watch # vitest watch
npx vitest run src/utils/dcaCalculator.test.ts   # single test file
npm run fetch      # regenerate public/prices.json + news.json locally (no LINE)
npm run noti       # run the daily LINE script locally (needs .env)
```

Local LINE test: copy `.env.example` → `.env` (`LINE_CHANNEL_ACCESS_TOKEN`,
`LINE_USER_ID`), then `DRY_RUN=1 npm run noti` to print without sending, or
`FORCE_SEND=1 npm run noti` to bypass the send-gates.

## Architecture / data flow

The core money logic lives in `src/utils/` and is **imported by both** the
browser and the Node scripts — that shared code is why the two never diverge.
Keep it DOM-free and Node-safe (that's also why the Vitest env is `node`).

1. **Ingest (Node, `scripts/shared.ts`).** `collectPrices` fetches ~5y of EOD
   closes + dividends per ticker from **Yahoo Finance** (`src/services/yahoo.ts`),
   plus the USD→THB rate (`THB=X`). `analyzeTicker` (`src/utils/dcaCalculator.ts`)
   turns each into a `TickerAnalytics`. Partial ticker failures are tolerated;
   total failure throws loudly (ADR-0003). Output is written to
   `public/prices.json` (closes + dividends + `usdThb`) and `public/news.json`.
2. **Notify (`scripts/dailyNoti.ts`).** Four independent LINE streams, each with
   its own gate in `.state/last-sent.json`: a **daily** up/down alert per new EOD
   close (`lastDailyDate`), a **monthly** Smart DCA message on/after
   `BUY_DAY_OF_MONTH` (`lastSentMonth`), a **mid-month dip** alert once per
   symbol per month (`dipAlerts`), and a **daily news digest** of recent
   per-ticker headlines, deduped by article link so a story is never re-sent
   (`sentNews`, the set of links currently in the feed). The monthly send also
   appends buys to `public/ledger.json` (dedup'd by `date|symbol`). The news
   digest is headline-only (Google News RSS has no article body); it groups the
   latest few headlines per ticker with Thai framing. Headlines are translated
   to Thai at ingest via a free, keyless translation endpoint
   (`translateHeadlines` in `shared.ts`), cached in `news.json`
   (`NewsItem.titleTh`, keyed by link) so each is translated once; the call is
   best-effort and falls back to the English headline on failure. Both the
   dashboard and LINE read `titleTh` (see `displayHeadline` in
   `src/utils/news.ts`).
3. **Render (browser).** `src/services/prices.ts` fetches the committed
   `prices.json`; `src/services/analytics.ts` (via `useStockAnalytics` +
   React Query) recomputes the **same** `analyzeTicker` output client-side. The
   Backtest tab and Portfolio view read the same static files.

### Live-quote overlay (optional, `worker/`)

`worker/` is a standalone, read-only Cloudflare Worker (Yahoo-backed) that serves
a live intraday price for `mode: "daily"` tickers **only** — the browser can't
call Yahoo directly (CORS). `useLiveQuote` polls it (`GET /quote?symbol=`) while
the US market is open and `StockCard` overlays the price with a LIVE badge. It is
purely additive: the Smart DCA signal, `prices.json`, and the LINE notification
stay end-of-day, and when `VITE_QUOTE_PROXY_URL` is unset the dashboard silently
falls back to the committed EOD snapshot. Deploy + wiring in `worker/README.md`;
keep `ALLOWED_SYMBOLS` (in `worker/wrangler.jsonc`) in sync with the daily-mode
tickers in `config/tickers.json`.

### The Smart DCA signal

Drawdown = latest close vs trailing-252-day high. Drawdown bands map to a Buy
Multiplier 1–5 in `multiplierForDrawdown` (`src/utils/dcaCalculator.ts`):
`0→-5%`=1x, `-5→-10%`=2x, `-10→-15%`=3x, `-15→-20%`=4x, `≤-20%`=5x. Monthly
recommendation = `baseTHB × multiplier`. `baseTHB` is a THB budget only — no
share/USD conversion is done (the broker handles that). Multiplier colors/labels
live in `src/utils/multiplier.ts`.

### Ticker config

`config/tickers.json` is the single source of truth, imported by both the UI
(`src/config.ts`) and the scripts. Each ticker's `mode` is `dca` (monthly Smart
DCA, needs `baseTHB`) or `daily` (day-over-day tracking, no buy). The drawdown→
multiplier bands are **code, not config**.

## CI / deploy

- `.github/workflows/daily-line-noti.yml` runs `dailyNoti.ts` four times each
  morning (00:17–03:17 UTC, ~07:17–10:17 Bangkok), commits refreshed
  `public/*.json` + state, and pushes. The repeated fires are redundancy against
  GitHub dropping scheduled crons; the send-gates make every run past the first
  a no-op. `workflow_dispatch` runs set `FORCE_SEND=1`.
- `.github/workflows/deploy-pages.yml` deploys to GitHub Pages on human pushes
  **and** on completion of the daily workflow (its `GITHUB_TOKEN` push can't
  trigger `push` events, so the deploy listens on `workflow_run`). Build runs
  `npm test` before `npm run build`.
- Served from a custom domain at root (`base: '/'`). PWA uses `registerType:
  'prompt'` — new SW waits and `ReloadPrompt` asks the user to refresh; `.json`
  data is served NetworkFirst so it updates without a version bump.

## Conventions & gotchas

- **Terminology matters.** `CONTEXT.md` defines the ubiquitous language (EOD
  Close, Drawdown, Buy Multiplier, Ledger, FX Rate, etc.) with explicit _Avoid_
  synonyms. Match it in code and messages.
- **Design decisions live in `docs/adr/`** (0001–0007). Consult/extend these
  rather than re-deciding. Note the price source migrated Stooq→Yahoo (ADR-0004
  supersedes ADR-0001) — all ingest is now Yahoo Finance.
- LINE messages are **Thai** and use LINE Flex bubbles (`altText` reuses the
  plain-text builder). Formatting helpers are in `src/utils/format.ts`.
- Ledger entries written after FX tracking carry `fxRate`; legacy ones don't, so
  Portfolio valuation must handle both (ADR-0007).
- Tests cover the money logic and user-facing copy helpers: `dcaCalculator`,
  `backtest`, `indicators`, `multiplier`, `format`, `portfolio`, `ledger`,
  `plain`.
</content>
</invoke>
