# Failures must be loud, because silence is a normal state

The daily Action deliberately sends nothing on weekends and US holidays (see
ADR-0002). That makes silence ambiguous: a genuinely broken pipeline (Stooq
down, RSS unreachable, LINE push rejected) looks identical to a normal
no-trading day, so an outage could go unnoticed for days.

Decision:

- **Unexpected errors exit the workflow non-zero**, triggering GitHub's built-in
  failure email. We do not swallow/try-catch these into silence.
- **Partial data degrades gracefully**: if some tickers fetch and others fail,
  send the recommendation for the ones that succeeded and name the failed ones
  in the message, rather than aborting the whole send.
- A LINE-push failure cannot be reported over LINE (that channel is the broken
  thing), so it is surfaced only via the GitHub failure email.

A "heartbeat" alert (warn if no successful send in N trading days) is deferred
to a later version.

## Consequence

Do not "clean up" the Action by wrapping the top level in a catch-all that
logs-and-continues — that would re-hide exactly the failures this design keeps
visible.
