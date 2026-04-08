import { describe, expect, it } from "vitest";
import { filterRelevantNews, rankNewsByImpact, deduplicateNews, getContaminationScore, getHalfLifeMinutes } from "../src/signals/filter.js";
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
    expect(filterRelevantNews([base])).toHaveLength(1);
  });

  it("removes items older than 3 hours", () => {
    const old = { ...base, id: "old_1", publishedAt: Date.now() - 4 * 3600000 };
    expect(filterRelevantNews([old])).toHaveLength(0);
  });
});

describe("rankNewsByImpact", () => {
  it("ranks hacks above listings", () => {
    const hack = { ...base, id: "hack_1", category: "hack" as const };
    const listing = { ...base, id: "list_1", category: "listing" as const };
    const ranked = rankNewsByImpact([listing, hack]);
    expect(ranked[0].category).toBe("hack");
  });

  it("penalizes contaminated rumor headlines", () => {
    const clean = { ...base, id: "clean_1", title: "JUP governance vote passes fee burn plan" };
    const rumor = { ...base, id: "rumor_1", title: "Rumor: unconfirmed SOL ETF speculation", summary: "anonymous sources say..." };
    const ranked = rankNewsByImpact([rumor, clean]);
    expect(ranked[0].id).toBe("clean_1");
  });
});

describe("helpers", () => {
  it("assigns short half-life to hacks", () => {
    expect(getHalfLifeMinutes({ ...base, category: "hack" })).toBe(45);
  });

  it("assigns a longer half-life to unlock paths", () => {
    expect(getHalfLifeMinutes({ ...base, category: "unlock" })).toBe(360);
  });

  it("scores rumors as contaminated", () => {
    const rumor = { ...base, title: "Rumor: unconfirmed BONK listing speculation", summary: "anonymous chatter" };
    expect(getContaminationScore(rumor)).toBeGreaterThan(0.4);
  });

  it("deduplicates repeated ids", () => {
    expect(deduplicateNews([base, base])).toHaveLength(1);
  });
});
