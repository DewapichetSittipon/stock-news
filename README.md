# 📊 Smart DCA Dashboard

**Live:** https://smart-dca.appstg.site/

Pure-frontend dashboard for four ETFs/stocks (VOO, SCHD, QQQM, SNDK) with a
LINE notification recommending how aggressively to buy each, using a
drawdown-driven **Smart DCA** strategy (monthly), plus a daily up/down alert for
`daily`-mode tickers.

**Features**

- Smart DCA buy multiplier (drawdown vs 52-week high) — monthly LINE + dashboard.
- Daily up/down tracking for `daily`-mode tickers, and a mid-month dip alert.
- **Backtest** tab: Smart DCA vs plain DCA over the full price history.
- **Portfolio**: cost basis + P&L from the committed ledger of monthly buys.
- Per-card analytics: SMA 50/200 overlay, RSI, YTD, 52-week high/low.
- LINE **Flex** messages; auto-deploy to GitHub Pages.

- Design & decisions: [`plan.md`](./plan.md), [`CONTEXT.md`](./CONTEXT.md), [`docs/adr/`](./docs/adr)
- No backend. Prices come from Stooq (keyless EOD). The daily signal + news run
  in a GitHub Action.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173  (Stooq is proxied via /stooq in dev)
npm run typecheck
npm run build
```

## Ticker config

`config/tickers.json` is the single source of truth for both the UI and the
Action:

```json
[
  { "symbol": "VOO", "name": "Vanguard S&P 500 ETF", "mode": "dca", "baseTHB": 2000 },
  { "symbol": "SNDK", "name": "SanDisk Corporation", "mode": "daily" }
]
```

Each ticker has a `mode`: `dca` (monthly Smart DCA buy, needs `baseTHB`) or
`daily` (tracked for day-over-day movement, no buy recommendation). The
drawdown → multiplier bands live in `src/utils/dcaCalculator.ts` (not config).

## LINE notifications

The Action (`.github/workflows/daily-line-noti.yml`) runs daily at 00:00 UTC
(~07:00 Bangkok) and refreshes `public/prices.json` + `public/news.json` for the
dashboard. It pushes LINE in two independent streams (state in `.state/last-sent.json`):

- **`daily` tickers** — an up/down alert once per new EOD close (`lastDailyDate`),
  auto-skipping weekends/holidays.
- **`dca` tickers** — one Smart DCA message per month, on the first run on/after
  the 1st (`lastSentMonth`).

`baseTHB` is the **monthly** base buy per DCA ticker. Change the buy day via
`BUY_DAY_OF_MONTH` in `scripts/dailyNoti.ts`. `FORCE_SEND=1` bypasses both gates;
`DRY_RUN=1` prints without sending.

### Setup

Add two repository secrets (Settings → Secrets and variables → Actions):

- `LINE_CHANNEL_ACCESS_TOKEN` — from the LINE Developers console (Messaging API channel)
- `LINE_USER_ID` — your own user id (obtain via a webhook or the console)

Local test: copy `.env.example` → `.env`, fill in the values, then:

```bash
npm run noti
```

> Note: `npm ci` in CI needs `package-lock.json` — run `npm install` once and
> commit the lockfile.
