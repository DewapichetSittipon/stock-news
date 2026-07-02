---
status: send-cadence superseded by ADR-0005
---

# Daily notification: run at 00:00 UTC, skip days with no new EOD close

> **Send cadence superseded by [ADR-0005](./0005-monthly-notification-cadence.md).**
> The user DCAs monthly, so the push is now once a month, not per new EOD close.
> The 00:00 UTC daily run and the committed-state mechanism below still apply
> (the workflow runs daily to refresh the dashboard's data).

The GitHub Action runs on cron at **00:00 UTC** (≈07:00 Thailand). US markets
close 4pm ET (≈03:00–04:00 Thailand), so Stooq's fresh EOD close is always
available by run time regardless of US daylight-saving shifts. Sending in the
Thai morning gives the user the day to act on the latest real close.

On weekends and US market holidays there is **no new EOD close**. Rather than
maintain a holiday calendar, the Action is data-driven: it fetches the latest
EOD date from Stooq and compares it to the last date it notified. If unchanged,
it **sends nothing** (saves the LINE free-tier monthly push quota and avoids
re-sending stale numbers that look like a fresh signal).

The "last notified date" is persisted by **committing `.state/last-sent.json`
back to the repo**. This is self-contained (no DB/backend), gives an audit trail
in git history, and survives indefinitely (unlike Actions cache, which can be
evicted). Cost: the workflow needs `contents: write` permission and produces
automated commits.

## Consequences

- Effective cadence is ~5 sends/week (each US session's close is delivered the
  following Thai morning); Sunday and Monday Thai mornings normally skip.
- Automated `[skip ci]` commits will appear in history; keep them out of any
  build triggers.
