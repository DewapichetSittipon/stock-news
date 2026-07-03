import {
  STATE_PATH,
  appendLedger,
  collectPrices,
  fetchUsdThb,
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
import { displayHeadline, splitHeadline } from '../src/utils/news';
import type { NewsItem, TickerAnalytics } from '../src/types';

// The user DCAs once a month, on this day (or the first run on/after it). See
// docs/adr/0005.
const BUY_DAY_OF_MONTH = 1;

// A dca ticker at/below this drawdown triggers a mid-month "buy more" alert.
const DIP_THRESHOLD = -10;

// Daily news digest. Only headlines newer than this window are candidates —
// this guards the first run from dumping a stale backlog; after that, dedup by
// link (state.sentNews) does the work so a story is never re-sent. At most this
// many headlines per ticker keep the card short.
const NEWS_LOOKBACK_DAYS = 3;
const NEWS_PER_SYMBOL = 3;

// Today's date ("YYYY-MM-DD") in the user's timezone — i.e. when this run
// fetched the data. Shown in every message so a stale snapshot (data date <
// fetch date, e.g. over a market holiday) is obvious at a glance.
const bangkokDate = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

// Current month ("YYYY-MM") and day-of-month in the user's timezone.
const bangkokMonthDay = (): { month: string; day: number } => {
  const [year, month, day] = bangkokDate().split('-');
  return { month: `${year}-${month}`, day: Number(day) };
};

// Footer line appended to every message: when this run pulled the data.
const fetchedLine = (fetchedDate: string): string =>
  `🕐 ดึงข้อมูลเมื่อ ${formatThaiDate(fetchedDate)}`;

const buildMessage = (
  analyses: TickerAnalytics[],
  failed: string[],
  latestDate: string,
  fetchedDate: string,
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
  parts.push('', fetchedLine(fetchedDate));
  return parts.join('\n');
};

// Daily up/down alert for "daily" mode tickers (e.g. SNDK). See docs/adr/0006.
const buildDailyMessage = (
  analyses: TickerAnalytics[],
  latestDate: string,
  fetchedDate: string,
): string => {
  const lines = analyses.map((item) => {
    const up = item.dailyChangePct >= 0;
    return [
      `${up ? '🟢' : '🔴'} ${item.symbol} — ${formatUSD(item.latestClose)}`,
      `   ${formatSignedPct(item.dailyChangePct)} (${formatSignedUSD(item.dailyChangeUsd)}) จากเมื่อวาน`,
    ].join('\n');
  });
  return [
    `📈 ติดตามรายวัน — ${formatThaiDate(latestDate)}`,
    '',
    ...lines,
    '',
    fetchedLine(fetchedDate),
  ].join('\n');
};

// Mid-month opportunistic dip alert for dca tickers (drawdown <= threshold).
const buildDipMessage = (
  analyses: TickerAnalytics[],
  latestDate: string,
  fetchedDate: string,
): string => {
  const lines = analyses.map((item) => {
    const meta = multiplierMeta(item.multiplier);
    return `${meta.emoji} ${item.symbol} — ${formatUSD(item.latestClose)} · ${formatDrawdown(item.drawdownPct)} (${meta.label})`;
  });
  return [
    `⚠️ จังหวะซื้อเพิ่ม — ${formatThaiDate(latestDate)}`,
    'ตัว DCA ต่อไปนี้ย่อลงแรง:',
    '',
    ...lines,
    '',
    fetchedLine(fetchedDate),
  ].join('\n');
};

// "Source · 1 ก.ค. 2026" sub-label for a headline (either part may be missing).
const newsMeta = (item: NewsItem): string => {
  const { source } = splitHeadline(item.title);
  const date = item.date ? formatThaiDate(item.date.slice(0, 10)) : '';
  return [source, date].filter(Boolean).join(' · ');
};

// Grouped per-ticker headline digest (once a day, deduped by link upstream).
const buildNewsMessage = (
  groups: { symbol: string; items: NewsItem[] }[],
  fetchedDate: string,
): string => {
  const blocks = groups.map(({ symbol, items }) => {
    const lines = items.map((item) => {
      const meta = newsMeta(item);
      return `• ${displayHeadline(item)}${meta ? `\n   ${meta}` : ''}`;
    });
    return [symbol, ...lines].join('\n');
  });
  return [
    `📰 ข่าวรายวัน — ${formatThaiDate(fetchedDate)}`,
    'สรุปข่าวล่าสุดของแต่ละตัว',
    '',
    blocks.join('\n\n'),
    '',
    fetchedLine(fetchedDate),
  ].join('\n');
};

// --- LINE Flex builders (visual cards; altText reuses the plain text above) ---
type Flex = Record<string, unknown>;
const SEP: Flex = { type: 'separator', margin: 'md', color: '#334155' };

const bubble = (altText: string, contents: Flex[]): Flex => ({
  type: 'flex',
  altText: altText.slice(0, 400),
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#0f172a',
      spacing: 'sm',
      contents,
    },
  },
});

const heading = (title: string, subtitle: string): Flex[] => [
  { type: 'text', text: title, weight: 'bold', size: 'lg', color: '#ffffff', wrap: true },
  { type: 'text', text: subtitle, size: 'xs', color: '#94a3b8', wrap: true },
];

const twoLineRow = (
  left: string,
  right: string,
  rightColor: string,
  sub: string,
): Flex => ({
  type: 'box',
  layout: 'vertical',
  margin: 'md',
  spacing: 'none',
  contents: [
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        { type: 'text', text: left, size: 'sm', weight: 'bold', color: '#e2e8f0' },
        { type: 'text', text: right, size: 'sm', align: 'end', weight: 'bold', color: rightColor },
      ],
    },
    { type: 'text', text: sub, size: 'xxs', color: '#94a3b8', wrap: true },
  ],
});

// Muted footer showing when the run fetched the data (mirrors fetchedLine in
// the plain-text/altText). Callers append [SEP, fetchedNote(...)] to the body.
const fetchedNote = (fetchedDate: string): Flex => ({
  type: 'text',
  text: fetchedLine(fetchedDate),
  size: 'xxs',
  color: '#64748b',
  margin: 'md',
  wrap: true,
});

const dcaFlex = (
  analyses: TickerAnalytics[],
  failed: string[],
  latestDate: string,
  fetchedDate: string,
): Flex => {
  const total = analyses.reduce((sum, item) => sum + item.recommendedTHB, 0);
  const contents: Flex[] = [
    ...heading('📊 Smart DCA รายเดือน', `${formatThaiMonth(latestDate)} · อิงปิด ${formatThaiDate(latestDate)}`),
    SEP,
    ...analyses.map((item) => {
      const meta = multiplierMeta(item.multiplier);
      return twoLineRow(
        `${meta.emoji} ${item.symbol}`,
        `${formatTHB(item.recommendedTHB)} (${meta.label})`,
        meta.hex,
        `${formatUSD(item.latestClose)} · ${formatDrawdown(item.drawdownPct)} จาก 52wk high`,
      );
    }),
    SEP,
    {
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      contents: [
        { type: 'text', text: 'รวมเดือนนี้', size: 'sm', color: '#94a3b8' },
        { type: 'text', text: formatTHB(total), size: 'sm', align: 'end', weight: 'bold', color: '#34d399' },
      ],
    },
  ];
  if (failed.length > 0) {
    contents.push({ type: 'text', text: `⚠️ พลาด: ${failed.join(', ')}`, size: 'xxs', color: '#f87171', margin: 'sm', wrap: true });
  }
  contents.push(SEP, fetchedNote(fetchedDate));
  return bubble(buildMessage(analyses, failed, latestDate, fetchedDate), contents);
};

const dailyFlex = (
  analyses: TickerAnalytics[],
  latestDate: string,
  fetchedDate: string,
): Flex => {
  const contents: Flex[] = [
    ...heading('📈 ติดตามรายวัน', formatThaiDate(latestDate)),
    SEP,
    ...analyses.map((item) => {
      const up = item.dailyChangePct >= 0;
      return twoLineRow(
        `${up ? '🟢' : '🔴'} ${item.symbol}`,
        formatSignedPct(item.dailyChangePct),
        up ? '#34d399' : '#f87171',
        `${formatUSD(item.latestClose)} · ${formatSignedUSD(item.dailyChangeUsd)} จากเมื่อวาน`,
      );
    }),
    SEP,
    fetchedNote(fetchedDate),
  ];
  return bubble(buildDailyMessage(analyses, latestDate, fetchedDate), contents);
};

const dipFlex = (
  analyses: TickerAnalytics[],
  latestDate: string,
  fetchedDate: string,
): Flex => {
  const contents: Flex[] = [
    ...heading('⚠️ จังหวะซื้อเพิ่ม', `${formatThaiDate(latestDate)} · ตัว DCA ย่อลงแรง`),
    SEP,
    ...analyses.map((item) => {
      const meta = multiplierMeta(item.multiplier);
      return twoLineRow(
        `${meta.emoji} ${item.symbol}`,
        meta.label,
        meta.hex,
        `${formatUSD(item.latestClose)} · ${formatDrawdown(item.drawdownPct)} จาก 52wk high`,
      );
    }),
    SEP,
    fetchedNote(fetchedDate),
  ];
  return bubble(buildDipMessage(analyses, latestDate, fetchedDate), contents);
};

// One tappable headline (opens the article) with its source · date sub-label.
const newsRow = (item: NewsItem): Flex => {
  const meta = newsMeta(item);
  const contents: Flex[] = [
    {
      type: 'text',
      text: `• ${displayHeadline(item)}`,
      size: 'sm',
      color: '#e2e8f0',
      wrap: true,
      ...(item.link ? { action: { type: 'uri', label: 'อ่าน', uri: item.link } } : {}),
    },
  ];
  if (meta) contents.push({ type: 'text', text: meta, size: 'xxs', color: '#94a3b8', wrap: true });
  return { type: 'box', layout: 'vertical', margin: 'md', spacing: 'none', contents };
};

const newsFlex = (
  groups: { symbol: string; items: NewsItem[] }[],
  fetchedDate: string,
): Flex => {
  const contents: Flex[] = [
    ...heading('📰 ข่าวรายวัน', `สรุปข่าวล่าสุด · ${formatThaiDate(fetchedDate)}`),
  ];
  groups.forEach(({ symbol, items }) => {
    contents.push(SEP, {
      type: 'text',
      text: symbol,
      weight: 'bold',
      size: 'sm',
      color: '#38bdf8',
      margin: 'md',
    });
    for (const item of items) contents.push(newsRow(item));
  });
  contents.push(SEP, fetchedNote(fetchedDate));
  return bubble(buildNewsMessage(groups, fetchedDate), contents);
};

const pushLine = async (message: Flex): Promise<void> => {
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
    body: JSON.stringify({ to: userId, messages: [message] }),
  });
  if (!response.ok) {
    throw new Error(`LINE push failed HTTP ${response.status}: ${await response.text()}`);
  }
};

const main = async (): Promise<void> => {
  const configs = loadConfigs();

  // Prices — partial failures tolerated; total failure is loud (see ADR-0003).
  const { analyses, failed, history, dividends } = await collectPrices(configs);
  if (analyses.length === 0) throw new Error('All ticker price fetches failed');
  const usdThb = await fetchUsdThb();
  writePricesFile(history, dividends, usdThb);

  // News — best effort, refreshed daily so the dashboard stays current. The
  // digest also feeds the daily news push below.
  const newsDigest = await refreshNews(configs);

  const latestDate = analyses
    .map((item) => item.latestDate)
    .sort((a, b) => b.localeCompare(a))[0];
  const dcaAnalyses = analyses.filter((item) => item.mode === 'dca');
  const dailyAnalyses = analyses.filter((item) => item.mode === 'daily');

  // FORCE_SEND bypasses both gates (manual test); DRY_RUN prints without sending.
  const force = process.env.FORCE_SEND === '1';
  const dryRun = process.env.DRY_RUN === '1';
  const { month, day } = bangkokMonthDay();
  const fetchedDate = bangkokDate();
  const state = readJson<{
    lastSentMonth?: string;
    lastDailyDate?: string;
    dipAlerts?: Record<string, string>;
    sentNews?: string[];
  }>(STATE_PATH, {});
  const nextState = { ...state };
  let sent = false;

  // Daily alert: once per new EOD close (auto-skips weekends/holidays).
  const dailyDue = force || state.lastDailyDate !== latestDate;
  if (dailyAnalyses.length > 0 && dailyDue) {
    const message = dailyFlex(dailyAnalyses, latestDate, fetchedDate);
    console.log(String(message.altText));
    if (!dryRun) await pushLine(message);
    nextState.lastDailyDate = latestDate;
    sent = true;
  }

  // Daily news digest: a short per-ticker headline summary. Dedup by link
  // (state.sentNews) so a story is never re-sent; a recency window keeps the
  // first run from dumping a stale backlog. FORCE_SEND shows the latest
  // headlines regardless of both gates.
  const sentNews = new Set(state.sentNews ?? []);
  const newsCutoff = Date.now() - NEWS_LOOKBACK_DAYS * 86_400_000;
  const isRecent = (iso: string): boolean => {
    if (!iso) return true; // no/odd date → don't silently hide the story
    const time = Date.parse(iso);
    return Number.isNaN(time) || time >= newsCutoff;
  };
  const currentLinks: string[] = [];
  const newsGroups: { symbol: string; items: NewsItem[] }[] = [];
  for (const config of configs) {
    const items = (newsDigest[config.symbol] ?? []).filter((item) => item.link);
    for (const item of items) currentLinks.push(item.link);
    // Newest first, then drop the same story reported by multiple outlets.
    const pool = (force ? items : items.filter((item) => !sentNews.has(item.link) && isRecent(item.date)))
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const seenHeadlines = new Set<string>();
    const picked: NewsItem[] = [];
    for (const item of pool) {
      const key = splitHeadline(item.title).headline.toLowerCase();
      if (seenHeadlines.has(key)) continue;
      seenHeadlines.add(key);
      picked.push(item);
      if (picked.length >= NEWS_PER_SYMBOL) break;
    }
    if (picked.length > 0) newsGroups.push({ symbol: config.symbol, items: picked });
  }
  if (newsGroups.length > 0) {
    const message = newsFlex(newsGroups, fetchedDate);
    console.log(String(message.altText));
    if (!dryRun) await pushLine(message);
    // Mark every headline now in the feed as seen (sent + skipped), so nothing
    // repeats; pruned to the current feed it stays bounded.
    nextState.sentNews = currentLinks;
    sent = true;
  }

  // Mid-month dip alert: dca tickers that dropped past the threshold, once per
  // symbol per month.
  const dipState: Record<string, string> = { ...(state.dipAlerts ?? {}) };
  const dips = dcaAnalyses.filter(
    (item) => item.drawdownPct <= DIP_THRESHOLD && (force || dipState[item.symbol] !== month),
  );
  if (dips.length > 0) {
    const message = dipFlex(dips, latestDate, fetchedDate);
    console.log(String(message.altText));
    if (!dryRun) await pushLine(message);
    for (const item of dips) dipState[item.symbol] = month;
    nextState.dipAlerts = dipState;
    sent = true;
  }

  // Monthly DCA: once per calendar month on/after BUY_DAY_OF_MONTH.
  const monthlyDue = force || (state.lastSentMonth !== month && day >= BUY_DAY_OF_MONTH);
  if (dcaAnalyses.length > 0 && monthlyDue) {
    const message = dcaFlex(dcaAnalyses, failed, latestDate, fetchedDate);
    console.log(String(message.altText));
    if (!dryRun) {
      await pushLine(message);
      appendLedger(
        dcaAnalyses.map((item) => ({
          date: latestDate,
          symbol: item.symbol,
          amountTHB: item.recommendedTHB,
          priceUSD: item.latestClose,
          units: item.recommendedTHB / item.latestClose,
          // Record the FX at buy time so the portfolio can value the currency
          // leg exactly later; omit if the rate fetch failed.
          ...(usdThb != null ? { fxRate: usdThb } : {}),
        })),
      );
    }
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
