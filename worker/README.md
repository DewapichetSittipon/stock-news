# Live-quote proxy (Cloudflare Worker)

A tiny **read-only** Worker that returns a live price for the dashboard's
`mode: "daily"` tickers. The browser can't call Yahoo directly (CORS), so it
calls this instead. It holds no secrets, writes nothing, and is independent of
the GitHub Pages deploy.

**Scope on purpose:** the Smart DCA signal, `public/prices.json`, and the LINE
notification stay end-of-day. This only adds a *live price overlay* on the daily
cards — nothing else changes.

## Endpoint

```
GET /quote?symbol=SNDK
→ { symbol, price, prevClose, changeUsd, changePct, marketState, time }
```

- `symbol` must be uppercase and on the `ALLOWED_SYMBOLS` list (see below).
- `marketState` is `REGULAR | PRE | POST | CLOSED` (from Yahoo's trading period).
- Responses are cached ~30s so client polling can't hammer Yahoo.

## Deploy

```bash
cd worker
npm install
npx wrangler login          # opens the browser; use your Cloudflare account
npm run deploy              # prints the https://smart-dca-quote-proxy.<sub>.workers.dev URL
```

Smoke-test it:

```bash
curl "https://smart-dca-quote-proxy.<sub>.workers.dev/quote?symbol=SNDK"
```

## Wire it into the dashboard

The dashboard reads the proxy URL from `VITE_QUOTE_PROXY_URL` at **build time**.

- **Local dev:** add to the repo-root `.env`
  ```
  VITE_QUOTE_PROXY_URL=https://smart-dca-quote-proxy.<sub>.workers.dev
  ```
- **Production (GitHub Pages):** add a repo **Variable** (Settings → Secrets and
  variables → Actions → Variables) named `VITE_QUOTE_PROXY_URL`. The deploy
  workflow already passes it into `npm run build`.

If the variable is unset, the dashboard silently falls back to the committed EOD
`prices.json` — the live overlay is purely additive.

## Changing the daily ticker

When you swap the `mode: "daily"` ticker in `config/tickers.json`, update
`ALLOWED_SYMBOLS` in `wrangler.jsonc` and redeploy (`npm run deploy`).
