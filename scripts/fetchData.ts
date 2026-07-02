import { collectPrices, loadConfigs, refreshNews, writePricesFile } from './shared';

// Dev helper: refresh public/prices.json + public/news.json without sending
// LINE. Handy for populating real data locally (`npm run fetch`).
const main = async (): Promise<void> => {
  const configs = loadConfigs();
  const { history, failed } = await collectPrices(configs);
  if (Object.keys(history).length === 0) throw new Error('All ticker price fetches failed');
  writePricesFile(history);
  await refreshNews(configs);
  if (failed.length > 0) console.warn(`Some tickers failed: ${failed.join(', ')}`);
  console.log('Wrote public/prices.json and public/news.json');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
