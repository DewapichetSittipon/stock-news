import {
  STATE_PATH,
  collectPrices,
  loadConfigs,
  readJson,
  refreshNews,
  writeJson,
  writePricesFile,
} from './shared';
import { multiplierMeta } from '../src/utils/multiplier';
import {
  formatDrawdown,
  formatTHB,
  formatThaiDate,
  formatUSD,
} from '../src/utils/format';
import type { TickerAnalytics } from '../src/types';

const buildMessage = (
  analyses: TickerAnalytics[],
  failed: string[],
  latestDate: string,
): string => {
  const lines = analyses.map((item) => {
    const meta = multiplierMeta(item.multiplier);
    return [
      `${meta.emoji} ${item.symbol} — ${formatTHB(item.recommendedTHB)} (${meta.label})`,
      `   ${formatUSD(item.latestClose)} · ${formatDrawdown(item.drawdownPct)} จาก 52wk high`,
    ].join('\n');
  });
  const total = analyses.reduce((sum, item) => sum + item.recommendedTHB, 0);
  const parts = [
    `📊 Smart DCA — ${formatThaiDate(latestDate)}`,
    '',
    ...lines,
    '',
    `รวมวันนี้: ${formatTHB(total)}`,
  ];
  if (failed.length > 0) parts.push('', `⚠️ ดึงข้อมูลไม่สำเร็จ: ${failed.join(', ')}`);
  return parts.join('\n');
};

const pushLine = async (message: string): Promise<void> => {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;
  if (!token || !userId) {
    throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN or LINE_USER_ID');
  }
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: userId, messages: [{ type: 'text', text: message }] }),
  });
  if (!response.ok) {
    throw new Error(`LINE push failed HTTP ${response.status}: ${await response.text()}`);
  }
};

const main = async (): Promise<void> => {
  const configs = loadConfigs();

  // Prices — partial failures tolerated; total failure is loud (see ADR-0003).
  const { analyses, failed, history } = await collectPrices(configs);
  if (analyses.length === 0) throw new Error('All ticker price fetches failed');
  writePricesFile(history);

  // News — best effort, refreshed daily regardless of whether we send.
  await refreshNews(configs);

  // Dedupe — silence on days with no new EOD close (weekends, US holidays).
  const latestDate = analyses
    .map((item) => item.latestDate)
    .sort((a, b) => b.localeCompare(a))[0];
  const state = readJson<{ lastSentDate?: string }>(STATE_PATH, {});
  if (state.lastSentDate && latestDate <= state.lastSentDate) {
    console.log(
      `No new EOD close (latest ${latestDate}, last sent ${state.lastSentDate}); skipping send.`,
    );
    return;
  }

  const message = buildMessage(analyses, failed, latestDate);
  console.log(message);
  await pushLine(message);
  writeJson(STATE_PATH, { lastSentDate: latestDate, sentAt: new Date().toISOString() });
  console.log(`Sent LINE notification for ${latestDate}.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
