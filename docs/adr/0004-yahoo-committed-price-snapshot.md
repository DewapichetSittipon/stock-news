---
status: accepted (supersedes ADR-0001)
---

# Price source: Yahoo Finance fetched server-side into a committed snapshot

ADR-0001 chose Stooq keyless EOD CSV, fetched directly by the browser. During
implementation this turned out to be unworkable: Stooq now gates its CSV
endpoints (both `stooq.com` and `stooq.pl`) behind a JavaScript proof-of-work
anti-bot challenge, returning an HTML wall instead of CSV even to a browser
User-Agent. That breaks both the browser fetch and the headless GitHub Action.

New decision:

- **Source:** Yahoo Finance chart API
  (`query1.finance.yahoo.com/v8/finance/chart/<symbol>?range=5y&interval=1d`) —
  keyless JSON, verified working server-side.
- **Delivery:** the GitHub Action fetches Yahoo (no CORS server-side), computes
  the signal, and commits `public/prices.json`. The browser reads that static
  snapshot — the exact "committed JSON snapshot" fallback ADR-0001 anticipated.

Why this is better than the original plan, not just a workaround:

- The dashboard and the LINE notification are computed from the **same** data,
  so they can never disagree.
- No CORS problem (same-origin static file), no API key, no proxy.

## Consequences

- `prices.json` holds ~5y of daily closes for 4 tickers (~280 KB) and is
  rewritten daily, so git history grows by roughly that much per trading day.
  If repo size becomes a concern, shorten the Yahoo `range` (e.g. `2y`) — only
  the chart's longest range button depends on it; the 52-week high needs 252.
- Yahoo is unofficial and may change response shape or throttle; `collectPrices`
  degrades per-ticker and the run fails loud if *all* tickers fail (ADR-0003).
- Data quality is Yahoo's: verify surprising values before trusting the signal.
