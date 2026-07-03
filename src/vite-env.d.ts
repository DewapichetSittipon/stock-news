/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  // Base URL of the Cloudflare live-quote proxy (see /worker). Unset/empty =
  // no live overlay; the dashboard falls back to the committed EOD prices.json.
  readonly VITE_QUOTE_PROXY_URL?: string;
}
/// <reference types="vite-plugin-pwa/react" />
