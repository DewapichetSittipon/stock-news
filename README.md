# 📊 Smart DCA Dashboard

Pure-frontend dashboard for four ETFs/stocks (VOO, SCHD, QQQM, SNDK) with a
daily LINE notification recommending how aggressively to buy each, using a
drawdown-driven **Smart DCA** strategy.

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
[{ "symbol": "VOO", "name": "Vanguard S&P 500 ETF", "baseTHB": 2000 }]
```

The drawdown → multiplier bands live in `src/utils/dcaCalculator.ts` (not config).

## Daily LINE notification

The Action (`.github/workflows/daily-line-noti.yml`) runs at 00:00 UTC
(~07:00 Bangkok):

1. Fetches EOD prices from Stooq and computes each ticker's Buy Multiplier.
2. Fetches Google News RSS per ticker and commits `public/news.json`.
3. Skips sending if there is no new EOD close since `.state/last-sent.json`
   (covers weekends and US holidays without a calendar).
4. Otherwise pushes one LINE message and commits the new state.

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
