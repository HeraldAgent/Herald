export type NewsSource = "cryptopanic" | "rss" | "twitter" | "coindesk" | "theblock";
export type SignalDirection = "bullish" | "bearish" | "neutral";
export type EventCategory =
  | "partnership"
  | "listing"
  | "hack"
  | "regulation"
  | "upgrade"
  | "funding"
  | "macro"
  | "liquidation"
  | "whale"
  | "other";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: NewsSource;
  url: string;
  publishedAt: number;
  tokens: string[];           // mentioned token symbols
  category: EventCategory;
  rawSentiment: number;       // -1 to +1 from source metadata
}

export interface TradeSignal {
  id: string;
  newsId: string;
  headline: string;
  token: string;
  direction: SignalDirection;
  confidence: number;         // 0-1
  expectedMovesPct: number;   // estimated price impact %
  timeHorizon: "immediate" | "1h" | "4h" | "24h";
  rationale: string;
  entryNotes: string;
  riskNotes: string;
  generatedAt: number;
  expired: boolean;
}

export interface NewsSignalPair {
  news: NewsItem;
  signal: TradeSignal;
}

export interface ScanCycle {
  startedAt: number;
  itemsScanned: number;
  signalsGenerated: number;
  topSignal?: TradeSignal;
}
