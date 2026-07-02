---
status: superseded by ADR-0004
---

# Use Stooq keyless EOD data as the single price source

> **Superseded by [ADR-0004](./0004-yahoo-committed-price-snapshot.md).** Stooq
> turned out to gate its CSV behind a JS anti-bot challenge; we switched to
> Yahoo Finance fetched server-side into a committed `prices.json`. Kept for
> the record.

The project is pure-frontend with no backend, but needs real end-of-day prices
for both the dashboard charts and the daily LINE DCA signal. A backend-less app
cannot hide an API key, and most stock APIs (Alpha Vantage, Twelve Data,
Finnhub) either block browser CORS or have punishing free limits (Alpha Vantage
free = 25 requests/day).

We chose Stooq's public CSV EOD endpoints because they require no API key and
are reachable from the browser, so nothing secret ships in the bundle and no
proxy/backend is needed. The same source is read by the GitHub Action that
computes the daily signal, keeping the dashboard and the notification consistent.

## Considered Options

- **Keyed API in browser** — rejected: leaks the key publicly.
- **Serverless proxy** — rejected: violates the no-backend constraint.
- **Committed daily prices.json from the Action** — viable fallback if Stooq
  becomes unreliable or rate-limits the browser; revisit then.
