# Per-ticker mode: "dca" vs "daily"

Not every tracked ticker is a DCA holding. SNDK, for example, is watched as a
trade — the user wants its daily up/down movement, not a monthly "buy Nx"
recommendation.

Each entry in `config/tickers.json` therefore carries a `mode`:

- **`dca`** — part of the monthly Smart DCA recommendation. `baseTHB` required.
  Contributes to the monthly total and the monthly LINE message.
- **`daily`** — tracked for daily change (close vs previous close). Shown in the
  dashboard's "ติดตามรายวัน" section and pushed to LINE **once per new EOD
  close** (auto-skips weekends/holidays). Excluded from the DCA total; `baseTHB`
  is ignored.

Consequences:

- The Action can now send up to two messages in a run: a daily alert (new EOD
  close) and, on the 1st, the monthly DCA message. `.state/last-sent.json`
  tracks both `lastDailyDate` and `lastSentMonth`.
- Volume stays well within the LINE free tier (~22 daily + 1 monthly per month).
- To reclassify a ticker, change its `mode` in config — no code change.
