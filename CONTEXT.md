# Stock Dashboard

A pure-frontend dashboard for four ETFs/stocks (VOO, SCHD, QQQM, SNDK) that
also sends a daily LINE notification recommending how aggressively to buy each,
based on a drawdown-driven "Smart DCA" strategy.

## Language

**EOD Close**:
The official end-of-day closing price for a ticker, sourced from Yahoo Finance.
All analytics are computed from EOD closes only — no intraday data.

**Prices Snapshot**:
The committed `public/prices.json` holding ~5y of EOD closes per ticker,
regenerated daily by the Action. The browser reads it directly (no live API
call), so the dashboard and the LINE signal share one source of truth. See
[[Ticker Config]] for what to track and docs/adr/0004 for why it is committed.
_Avoid_: cache, price feed

**52-Week High**:
The highest EOD close over the trailing 252 trading days. Serves as the
reference price for measuring how far a ticker has fallen.
_Avoid_: peak, all-time high

**Drawdown**:
How far the latest EOD close sits below the 52-Week High, expressed as a
negative percentage. Drives the Buy Multiplier.
_Avoid_: dip, decline, loss

**Buy Multiplier**:
An integer 1–5 telling the user how many units of their base contribution to
buy today. Determined by the Drawdown band: 0→-5% = 1x, -5→-10% = 2x,
-10→-15% = 3x, -15→-20% = 4x, ≤-20% = 5x.
_Avoid_: signal strength, weight

**Smart DCA**:
The strategy of always buying (never zero) but scaling the amount up via the
Buy Multiplier as Drawdown deepens. Distinct from plain DCA, which buys a fixed
amount regardless of price.
_Avoid_: DCA (unqualified), averaging in

**Base Contribution**:
The per-ticker **monthly** baht amount representing a 1x buy, for `dca`-mode
tickers only, defined in a repo config file (read by both the UI and the Action). The monthly recommendation is
Base Contribution × Buy Multiplier. Treated as a budget only — no USD conversion
or share count is computed; the notification shows the USD price alongside for
reference, and the user's broker handles the actual conversion. The LINE push
fires once a month (see docs/adr/0005).
_Avoid_: base amount, unit, lot

**Ticker Config**:
The committed repo file listing which tickers the system tracks, each one's
Ticker Mode, and (for DCA tickers) its Base Contribution. The single source of
truth for both the dashboard and the Action. Default: VOO, SCHD, QQQM (dca) +
SNDK (daily).
_Avoid_: symbols list, universe

**Ticker Mode**:
Whether a ticker is a `dca` holding (monthly Smart DCA buy recommendation) or a
`daily` one (tracked for day-over-day movement, not a DCA buy). Set per ticker
in Ticker Config. See docs/adr/0006.
_Avoid_: kind, category

**Daily Change**:
A `daily`-mode ticker's move versus the previous EOD close, as a signed percent
and dollar amount. Shown on the dashboard and pushed to LINE once per new EOD
close. Distinct from Drawdown (which is vs the 52-Week High).
_Avoid_: delta, movement

**Ledger**:
The committed `public/ledger.json` — an append-only record of each monthly DCA
buy (`date, symbol, amountTHB, priceUSD, units`) written by the Action. The
dashboard's Portfolio view aggregates it into invested / current value / P&L.
Valuation is ฿-ratio only (see docs/adr/0007).
_Avoid_: transactions, history, journal

**News Digest**:
A per-ticker list of recent headlines (title, link, date) sourced from Google
News RSS. Because RSS is not CORS-accessible from the browser, the Action
fetches and parses it server-side and commits `news.json`; the dashboard reads
that static file. Refreshed once daily, not real-time.
_Avoid_: feed, articles, headlines (as the canonical noun)
