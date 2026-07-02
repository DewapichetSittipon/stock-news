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
The per-ticker baht amount representing a 1x buy, defined in a repo config file
(read by both the UI and the Action). The daily recommendation is Base
Contribution × Buy Multiplier. Treated as a budget only — no USD conversion or
share count is computed; the notification shows the USD price alongside for
reference, and the user's broker handles the actual conversion.
_Avoid_: base amount, unit, lot

**Ticker Config**:
The committed repo file listing which tickers the system tracks and each one's
Base Contribution. The single source of truth for both the dashboard's default
view and the set the Action notifies on. Default: VOO, SCHD, QQQM, SNDK.
_Avoid_: symbols list, universe

**News Digest**:
A per-ticker list of recent headlines (title, link, date) sourced from Google
News RSS. Because RSS is not CORS-accessible from the browser, the Action
fetches and parses it server-side and commits `news.json`; the dashboard reads
that static file. Refreshed once daily, not real-time.
_Avoid_: feed, articles, headlines (as the canonical noun)

**Watchlist**:
The user's persisted client-side selection (LocalStorage via Zustand) that
filters which Ticker Config entries the dashboard displays. Purely a UI view
preference — it does NOT affect which tickers the notification covers.
_Avoid_: favorites, portfolio, holdings
