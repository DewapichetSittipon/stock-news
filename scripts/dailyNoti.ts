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
  formatSignedPct,
  formatSignedUSD,
  formatTHB,
  formatThaiDate,
  formatThaiMonth,
  formatUSD,
} from '../src/utils/format';
import type { TickerAnalytics } from '../src/types';

// The user DCAs once a month, on this day (or the first run on/after it). See
// docs/adr/0005.
const BUY_DAY_OF_MONTH = 1;

// Current month ("YYYY-MM") and day-of-month in the user's timezone.
const bangkokMonthDay = (): { month: string; day: number } => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = parts.split('-');
  return { month: `${year}-${month}`, day: Number(day) };
};

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
    `📊 Smart DCA รายเดือน — ${formatThaiMonth(latestDate)}`,
    `(อิงราคาปิดล่าสุด ${formatThaiDate(latestDate)})`,
    '',
    ...lines,
    '',
    `รวมเดือนนี้: ${formatTHB(total)}`,
  ];
  if (failed.length > 0) parts.push('', `⚠️ ดึงข้อมูลไม่สำเร็จ: ${failed.join(', ')}`);
  return parts.join('\n');
};

// Daily up/down alert for "daily" mode tickers (e.g. SNDK). See docs/adr/0006.
const buildDailyMessage = (
  analyses: TickerAnalytics[],
  latestDate: string,
): string => {
  const lines = analyses.map((item) => {
    const up = item.dailyChangePct >= 0;
    return [
      `${up ? '🟢' : '🔴'} ${item.symbol} — ${formatUSD(item.latestClose)}`,
      `   ${formatSignedPct(item.dailyChangePct)} (${formatSignedUSD(item.dailyChangeUsd)}) จากเมื่อวาน`,
    ].join('\n');
  });
  return [`📈 ติดตามรายวัน — ${formatThaiDate(latestDate)}`, '', ...lines].join('\n');
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

  // News — best effort, refreshed daily so the dashboard stays current.
  await refreshNews(configs);

  const latestDate = analyses
    .map((item) => item.latestDate)
    .sort((a, b) => b.localeCompare(a))[0];
  const dcaAnalyses = analyses.filter((item) => item.mode === 'dca');
  const dailyAnalyses = analyses.filter((item) => item.mode === 'daily');

  // FORCE_SEND bypasses both gates (manual test); DRY_RUN prints without sending.
  const force = process.env.FORCE_SEND === '1';
  const dryRun = process.env.DRY_RUN === '1';
  const { month, day } = bangkokMonthDay();
  const state = readJson<{ lastSentMonth?: string; lastDailyDate?: string }>(
    STATE_PATH,
    {},
  );
  const nextState = { ...state };
  let sent = false;

  // Daily alert: once per new EOD close (auto-skips weekends/holidays).
  const dailyDue = force || state.lastDailyDate !== latestDate;
  if (dailyAnalyses.length > 0 && dailyDue) {
    const message = buildDailyMessage(dailyAnalyses, latestDate);
    console.log(message);
    if (!dryRun) await pushLine(message);
    nextState.lastDailyDate = latestDate;
    sent = true;
  }

  // Monthly DCA: once per calendar month on/after BUY_DAY_OF_MONTH.
  const monthlyDue = force || (state.lastSentMonth !== month && day >= BUY_DAY_OF_MONTH);
  if (dcaAnalyses.length > 0 && monthlyDue) {
    const message = buildMessage(dcaAnalyses, failed, latestDate);
    console.log(message);
    if (!dryRun) await pushLine(message);
    nextState.lastSentMonth = month;
    sent = true;
  }

  if (dryRun) {
    console.log('\n(dry run — not sending, state unchanged)');
    return;
  }
  if (sent) {
    writeJson(STATE_PATH, { ...nextState, sentAt: new Date().toISOString() });
    console.log('Done.');
  } else {
    console.log('Nothing to send (no new EOD close, and monthly already sent).');
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
