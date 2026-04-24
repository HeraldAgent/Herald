import { getTrackedTokens } from "../lib/config.js";
import type { NewsItem } from "../lib/types.js";

const seen = new Set<string>();
const CATEGORY_WEIGHT: Record<NewsItem["category"], number> = {
  hack: 10,
  regulation: 9,
  listing: 8,
  unlock: 8,
  governance: 7,
  macro: 7,
  funding: 5,
  integration: 5,
  upgrade: 4,
  other: 1,
};

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
  const tracked = new Set(getTrackedTokens().map((token) => token.toUpperCase()));
  const cutoff = Date.now() - 3 * 3600 * 1000;

  return items.filter((item) => {
    if (item.publishedAt < cutoff) return false;
    const hasTrackedToken = item.tokens.some((token) => tracked.has(token.toUpperCase()));
    const structuralEvent = ["hack", "regulation", "macro", "unlock", "governance"].includes(item.category);
    return hasTrackedToken || structuralEvent;
  });
}

export function getContaminationScore(item: NewsItem): number {
  const lowered = `${item.title} ${item.summary}`.toLowerCase();
  let score = 0;
  if (lowered.includes("rumor") || lowered.includes("speculation")) score += 0.35;
  if (lowered.includes("anonymous") || lowered.includes("unconfirmed")) score += 0.25;
  if (item.source === "twitter") score += 0.2;
  if (item.tokens.length > 2) score += 0.15;
  return Math.min(1, score);
}

export function getHalfLifeMinutes(item: NewsItem): number {
  switch (item.category) {
    case "hack": return 45;
    case "listing": return 90;
    case "regulation": return 240;
    case "unlock": return 360;
    case "macro": return 120;
    case "governance": return 240;
    default: return 180;
  }
}

export function rankNewsByImpact(items: NewsItem[]): NewsItem[] {
  return [...items].sort((left, right) => {
    const leftScore = (CATEGORY_WEIGHT[left.category] ?? 1) + Math.abs(left.rawSentiment) * 2 - getContaminationScore(left) * 3;
    const rightScore = (CATEGORY_WEIGHT[right.category] ?? 1) + Math.abs(right.rawSentiment) * 2 - getContaminationScore(right) * 3;
    return rightScore - leftScore;
  });
}
