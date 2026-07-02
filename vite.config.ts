import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The browser reads the committed public/prices.json + public/news.json
// (produced daily by the GitHub Action), so no dev proxy or API key is needed.
// base is '/stock-news/' for the production build (served from GitHub Pages
// under that path) and '/' for local dev.
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [react()],
}));
