---
status: accepted (supersedes the send-cadence part of ADR-0002)
---

# LINE notification fires monthly, not daily

The user dollar-cost-averages **once a month**, so a daily "buy today" push
does not match their behaviour — they would get 20+ messages a month but act
once. ADR-0002 assumed a daily send.

New decision:

- **The workflow still runs daily** at 00:00 UTC to refresh `prices.json` +
  `news.json` so the dashboard stays current.
- **The LINE push is gated to once per calendar month.** It sends on the first
  daily run on/after `BUY_DAY_OF_MONTH` (currently the 1st) where the current
  month differs from `.state/last-sent.json`'s `lastSentMonth`.
- `baseTHB` in `config/tickers.json` is therefore the user's **monthly** base
  contribution per ticker; the Buy Multiplier scales that month's buy.

Consequences / notes:

- The month/day are evaluated in **Asia/Bangkok**, and the recommendation uses
  the latest available EOD close. If the 1st is a weekend/holiday there is no
  new US close, but the monthly gate does not care — it sends anyway using the
  freshest close, so a weekend 1st never skips the month.
- Running daily but sending monthly also makes the send **resilient**: if the
  1st's run fails, the 2nd/3rd's run still sends (month not yet marked).
- `FORCE_SEND=1` bypasses the gate (used by manual `workflow_dispatch` runs for
  testing); `DRY_RUN=1` prints the message without sending or touching state.
- To change the buy day, edit `BUY_DAY_OF_MONTH` in `scripts/dailyNoti.ts`.
