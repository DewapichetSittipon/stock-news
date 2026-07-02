import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Served from a custom domain (smart-dca.appstg.site) at the site root, so
// base is '/'. The browser reads the committed public/*.json produced by the
// GitHub Action — no dev proxy or API key needed.
export default defineConfig({
  base: '/',
  plugins: [react()],
});
