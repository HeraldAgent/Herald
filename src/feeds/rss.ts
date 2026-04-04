import { createLogger } from "../lib/logger.js";
import type { NewsItem, EventCategory } from "../lib/types.js";
import { randomUUID } from "crypto";

const logger = createLogger("rss");

const FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "coindesk" as const },
  { url: "https://thedefiant.io/api/feed", source: "theblock" as const },
];

const CRYPTO_TOKENS = ["BTC","ETH","SOL","BNB","XRP","ADA","DOT","MATIC","AVAX","LINK",
  "UNI","AAVE","JTO","BONK","WIF","JUP","RAY","PENGU","PYTH","RENDER"];

export async function fetchRssNews(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HeraldBot/1.0)" },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const parsed = parseRssXml(xml, feed.source);
      items.push(...parsed);
    } catch (err) {
      logger.warn(`RSS fetch failed for ${feed.url}`, err);
    }
  }

  return items;
}

function parseRssXml(xml: string, source: NewsItem["source"]): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const description = extractTag(block, "description");

    if (!title || !link) continue;

    const tokens = extractMentionedTokens(title + " " + (description ?? ""));
    const publishedAt = pubDate ? new Date(pubDate).getTime() : Date.now();

    if (Date.now() - publishedAt > 3 * 3600 * 1000) continue; // skip items older than 3h

    items.push({
      id: `rss_${Buffer.from(link).toString("base64").slice(0, 12)}`,
      title,
      summary: description ? stripHtml(description).slice(0, 300) : title,
      source,
      url: link,
      publishedAt,
      tokens,
      category: classifyCategory(title),
      rawSentiment: 0,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? (match[1] ?? match[2] ?? "").trim() : null;
}

function extractMentionedTokens(text: string): string[] {
  const upper = text.toUpperCase();
  return CRYPTO_TOKENS.filter((t) => upper.includes(t));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function classifyCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  if (t.includes("hack") || t.includes("exploit")) return "hack";
  if (t.includes("list")) return "listing";
  if (t.includes("partner")) return "partnership";
  if (t.includes("regulat") || t.includes("sec ")) return "regulation";
  if (t.includes("upgrade") || t.includes("launch")) return "upgrade";
  if (t.includes("fund") || t.includes("raise")) return "funding";
  if (t.includes("fed") || t.includes("inflation")) return "macro";
  return "other";
}
