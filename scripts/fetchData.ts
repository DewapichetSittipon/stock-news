import {
  collectPrices,
  fetchUsdThb,
  loadConfigs,
  refreshNews,
  writePricesFile,
} from './shared';

// Dev helper: refresh public/prices.json + public/news.json without sending
// LINE. Handy for populating real data locally (`npm run fetch`).
const main = async (): Promise<void> => {
  const configs = loadConfigs();
  const { history, dividends, failed } = await collectPrices(configs);
  if (Object.keys(history).length === 0) throw new Error('All ticker price fetches failed');
  const usdThb = await fetchUsdThb();
  writePricesFile(history, dividends, usdThb);
  await refreshNews(configs);
  if (failed.length > 0) console.warn(`Some tickers failed: ${failed.join(', ')}`);
  console.log('Wrote public/prices.json and public/news.json');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
