import { describe, it, expect } from "vitest";
import { filterRelevantNews, rankNewsByImpact, deduplicateNews } from "../src/signals/filter.js";
import type { NewsItem } from "../src/lib/types.js";

const base: NewsItem = {
  id: "test_1",
  title: "Binance lists SOL perpetual futures",
  summary: "Binance has announced...",
  source: "cryptopanic",
  url: "https://example.com/1",
  publishedAt: Date.now() - 30 * 60000,
  tokens: ["SOL"],
  category: "listing",
  rawSentiment: 0.8,
};

describe("filterRelevantNews", () => {
  it("keeps recent items with tracked tokens", () => {
    const result = filterRelevantNews([base]);
    expect(result).toHaveLength(1);
  });

  it("removes items older than 2 hours", () => {
    const old = { ...base, id: "old_1", publishedAt: Date.now() - 3 * 3600000 };
    expect(filterRelevantNews([old])).toHaveLength(0);
  });

  it("keeps high-impact categories even without tracked tokens", () => {
    const macro = { ...base, id: "macro_1", tokens: [], category: "macro" as const };
    expect(filterRelevantNews([macro])).toHaveLength(1);
  });

  it("removes untracked tokens with low-impact categories", () => {
    const irrelevant = { ...base, id: "irr_1", tokens: ["SHIB"], category: "other" as const };
    expect(filterRelevantNews([irrelevant])).toHaveLength(0);
  });
});

describe("rankNewsByImpact", () => {
  it("ranks hacks above listings", () => {
    const hack = { ...base, id: "hack_1", category: "hack" as const };
    const listing = { ...base, id: "list_1", category: "listing" as const };
    const ranked = rankNewsByImpact([listing, hack]);
    expect(ranked[0].category).toBe("hack");
  });

  it("factors sentiment into ranking", () => {
    const highSentiment = { ...base, id: "hs_1", rawSentiment: 0.9 };
    const lowSentiment = { ...base, id: "ls_1", rawSentiment: 0.1 };
    const ranked = rankNewsByImpact([lowSentiment, highSentiment]);
    expect(ranked[0].id).toBe("hs_1");
  });
});

describe("deduplicateNews", () => {
  it("removes duplicate ids", () => {
    const result = deduplicateNews([base, base]);
    expect(result).toHaveLength(1);
  });

  it("passes through unique items", () => {
    const b2 = { ...base, id: "test_2" };
    const result = deduplicateNews([base, b2]);
    expect(result).toHaveLength(2);
  });
});
