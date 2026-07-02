import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Served from a custom domain (smart-dca.appstg.site) at the site root, so
// base is '/'. The browser reads the committed public/*.json produced by the
// GitHub Action — no dev proxy or API key needed.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      // Ship SW updates automatically so an installed home-screen app always
      // picks up the latest daily data + code on next launch.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Smart DCA Dashboard',
        short_name: 'Smart DCA',
        description: 'Dollar-cost-averaging dashboard with prices, news and backtests.',
        lang: 'th',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell; the *.json data files are large + refreshed
        // daily, so serve them network-first and fall back to cache offline.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dca-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
});
