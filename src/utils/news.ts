import type { NewsItem } from '../types';

// Google News RSS titles are "Headline - Source"; split off the trailing source
// so it can render as a compact label instead of cluttering the headline.
export const splitHeadline = (title: string): { headline: string; source: string } => {
  const idx = title.lastIndexOf(' - ');
  if (idx === -1) return { headline: title.trim(), source: '' };
  return { headline: title.slice(0, idx).trim(), source: title.slice(idx + 3).trim() };
};

// Preferred display headline: the Thai translation (populated at ingest) when
// present, otherwise the English headline with its source stripped.
export const displayHeadline = (item: NewsItem): string =>
  item.titleTh?.trim() || splitHeadline(item.title).headline;
