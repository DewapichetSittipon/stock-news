import type { NewsDigest } from '../types';

// Reads the static news.json produced daily by the GitHub Action.
export const fetchNewsDigest = async (): Promise<NewsDigest> => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}news.json`, {
      cache: 'no-cache',
    });
    if (!response.ok) return {};
    return (await response.json()) as NewsDigest;
  } catch {
    return {};
  }
};
