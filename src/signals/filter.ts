import { config, getTrackedTokens } from "../lib/config.js";
import type { NewsItem } from "../lib/types.js";

const seen = new Set<string>();

export function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const fresh: NewsItem[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      fresh.push(item);
    }
  }
  return fresh;
}

export function filterRelevantNews(items: NewsItem[]): NewsItem[] {
  const tracked = new Set(getTrackedTokens());
  const cutoff = Date.now() - 2 * 3600 * 1000; // max 2h old

  return items.filter((item) => {
    if (item.publishedAt < cutoff) return false;
    // Keep if mentions a tracked token OR is a high-impact category
    const hasTrackedToken = item.tokens.some((t) => tracked.has(t));
    const highImpact = ["hack", "regulation", "macro", "listing"].includes(item.category);
    return hasTrackedToken || highImpact;
  });
}

export function rankNewsByImpact(items: NewsItem[]): NewsItem[] {
  const categoryWeight: Record<string, number> = {
    hack: 10,
    regulation: 9,
    macro: 8,
    listing: 7,
    funding: 6,
    partnership: 5,
    upgrade: 4,
    liquidation: 4,
    whale: 3,
    other: 1,
  };

  return [...items].sort((a, b) => {
    const scoreA = (categoryWeight[a.category] ?? 1) + Math.abs(a.rawSentiment) * 2;
    const scoreB = (categoryWeight[b.category] ?? 1) + Math.abs(b.rawSentiment) * 2;
    return scoreB - scoreA;
  });
}
