import { createLogger } from "../lib/logger.js";
import { config } from "../lib/config.js";
import type { NewsItem, EventCategory } from "../lib/types.js";

const logger = createLogger("cryptopanic");
const BASE = "https://cryptopanic.com/api/v1";

interface CPPost {
  id: number;
  title: string;
  published_at: string;
  url: string;
  source: { title: string };
  votes: { negative: number; positive: number; important: number };
  currencies?: Array<{ code: string }>;
}

interface CPResponse {
  results: CPPost[];
}

export async function fetchCryptoPanicNews(limit = 50): Promise<NewsItem[]> {
  if (!config.CRYPTOPANIC_API_KEY) {
    logger.warn("No CryptoPanic API key — skipping");
    return [];
  }

  try {
    const params = new URLSearchParams({
      auth_token: config.CRYPTOPANIC_API_KEY,
      kind: "news",
      filter: "hot",
      public: "true",
    });

    const res = await fetch(`${BASE}/posts/?${params}`);
    if (!res.ok) throw new Error(`CryptoPanic ${res.status}`);
    const data = await res.json() as CPResponse;

    return (data.results ?? []).slice(0, limit).map((p) => {
      const tokens = (p.currencies ?? []).map((c) => c.code.toUpperCase());
      const sentiment =
        p.votes.positive > 0 || p.votes.negative > 0
          ? (p.votes.positive - p.votes.negative) /
            (p.votes.positive + p.votes.negative)
          : 0;

      return {
        id: `cp_${p.id}`,
        title: p.title,
        summary: p.title,
        source: "cryptopanic",
        url: p.url,
        publishedAt: new Date(p.published_at).getTime(),
        tokens,
        category: classifyCategory(p.title),
        rawSentiment: sentiment,
      };
    });
  } catch (err) {
    logger.error("CryptoPanic fetch failed", err);
    return [];
  }
}

function classifyCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  if (t.includes("hack") || t.includes("exploit") || t.includes("stolen")) return "hack";
  if (t.includes("list") || t.includes("trading pair")) return "listing";
  if (t.includes("partner") || t.includes("integrat")) return "integration";
  if (t.includes("regulat") || t.includes("sec ") || t.includes("ban")) return "regulation";
  if (t.includes("upgrade") || t.includes("v2") || t.includes("launch")) return "upgrade";
  if (t.includes("fund") || t.includes("raise") || t.includes("million")) return "funding";
  if (t.includes("fed") || t.includes("cpi") || t.includes("inflation") || t.includes("rate")) return "macro";
  if (t.includes("unlock") || t.includes("vesting")) return "unlock";
  if (t.includes("governance") || t.includes("vote") || t.includes("proposal")) return "governance";
  return "other";
}
