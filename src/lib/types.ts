export type NewsSource = "cryptopanic" | "rss" | "twitter" | "coindesk" | "theblock";
export type SignalDirection = "bullish" | "bearish" | "neutral";
export type EventCategory =
  | "listing"
  | "hack"
  | "regulation"
  | "upgrade"
  | "funding"
  | "macro"
  | "governance"
  | "unlock"
  | "integration"
  | "other";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: NewsSource;
  url: string;
  publishedAt: number;
  tokens: string[];
  category: EventCategory;
  rawSentiment: number;
}

export interface TradeSignal {
  id: string;
  newsId: string;
  headline: string;
  token: string;
  direction: SignalDirection;
  confidence: number;
  expectedMovesPct: number;
  timeHorizon: "immediate" | "1h" | "4h" | "24h";
  eventHalfLifeMinutes: number;
  surpriseScore: number;
  contaminationScore: number;
  rationale: string;
  entryNotes: string;
  riskNotes: string;
  generatedAt: number;
  expired: boolean;
}
