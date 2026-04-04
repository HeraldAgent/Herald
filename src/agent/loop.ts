import Anthropic from "@anthropic-ai/sdk";
import { config } from "../lib/config.js";
import { createLogger } from "../lib/logger.js";
import type { NewsItem, TradeSignal } from "../lib/types.js";
import { HERALD_SYSTEM } from "./prompts.js";
import { randomUUID } from "crypto";

const logger = createLogger("agent");
const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: "get_news_batch",
    description: "Returns the current batch of filtered, ranked news items to analyze",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_token_context",
    description: "Returns basic context for a token — recent trend, market cap tier, volatility",
    input_schema: {
      type: "object" as const,
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
  },
  {
    name: "get_similar_past_events",
    description: "Returns historical examples of similar news events and their price impact",
    input_schema: {
      type: "object" as const,
      properties: {
        category: { type: "string" },
        token: { type: "string" },
      },
      required: ["category"],
    },
  },
  {
    name: "submit_signal",
    description: "Submit a trading signal generated from a news event",
    input_schema: {
      type: "object" as const,
      properties: {
        newsId: { type: "string" },
        headline: { type: "string" },
        token: { type: "string" },
        direction: { type: "string", enum: ["bullish", "bearish", "neutral"] },
        confidence: { type: "number" },
        expectedMovesPct: { type: "number" },
        timeHorizon: { type: "string", enum: ["immediate", "1h", "4h", "24h"] },
        rationale: { type: "string" },
        entryNotes: { type: "string" },
        riskNotes: { type: "string" },
      },
      required: ["newsId", "headline", "token", "direction", "confidence",
        "expectedMovesPct", "timeHorizon", "rationale", "entryNotes", "riskNotes"],
    },
  },
];

export async function generateSignals(newsItems: NewsItem[]): Promise<TradeSignal[]> {
  if (newsItems.length === 0) return [];

  const signals: TradeSignal[] = [];

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `${newsItems.length} news items queued. Analyze each one and submit trading signals for events with confidence >= ${config.MIN_CONFIDENCE}. Skip noise. Max ${config.MAX_SIGNALS_PER_CYCLE} signals this cycle.`,
    },
  ];

  for (let i = 0; i < 14; i++) {
    const response = await client.messages.create({
      model: config.CLAUDE_MODEL,
      max_tokens: 2048,
      system: HERALD_SYSTEM,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      let result: unknown;

      switch (block.name) {
        case "get_news_batch":
          result = newsItems.map((n) => ({
            id: n.id,
            title: n.title,
            summary: n.summary,
            source: n.source,
            category: n.category,
            tokens: n.tokens,
            sentiment: n.rawSentiment,
            age: `${Math.round((Date.now() - n.publishedAt) / 60000)}m ago`,
          }));
          break;

        case "get_token_context": {
          const input = block.input as { symbol: string };
          result = {
            symbol: input.symbol,
            note: "Live price data not available — reason based on news content and category",
            tier: ["BTC", "ETH", "SOL", "BNB"].includes(input.symbol) ? "large-cap" : "mid-small-cap",
          };
          break;
        }

        case "get_similar_past_events": {
          const input = block.input as { category: string; token?: string };
          const examples: Record<string, string> = {
            hack: "Typical immediate drop of 15-40% on exploit news, partial recovery over 24-72h if funds recovered",
            listing: "Binance listing historically +20-60% in first hour, Coinbase +10-30%",
            regulation: "SEC action -10-25% immediate, recovery depends on jurisdiction and scope",
            funding: "Large VC round +5-15% over 24h, higher for early-stage projects",
            macro: "Fed hawkish surprise: BTC -3-8%, alts -5-15% within 1h of announcement",
            partnership: "Depends on partner tier — Tier 1 company +10-20%, unknown entity <2%",
          };
          result = { category: input.category, historicalContext: examples[input.category] ?? "Limited historical data" };
          break;
        }

        case "submit_signal": {
          const input = block.input as Omit<TradeSignal, "id" | "generatedAt" | "expired">;
          if (input.confidence >= config.MIN_CONFIDENCE && signals.length < config.MAX_SIGNALS_PER_CYCLE) {
            const signal: TradeSignal = {
              ...input,
              id: randomUUID(),
              generatedAt: Date.now(),
              expired: false,
            };
            signals.push(signal);
            const arrow = signal.direction === "bullish" ? "↑" : signal.direction === "bearish" ? "↓" : "→";
            logger.info(`[SIGNAL] ${arrow} ${signal.token} | ${signal.direction.toUpperCase()} | conf ${signal.confidence.toFixed(2)} | ${signal.timeHorizon} | est ${signal.expectedMovesPct > 0 ? "+" : ""}${signal.expectedMovesPct}%`);
            logger.info(`  → ${signal.rationale}`);
          }
          result = { accepted: true };
          break;
        }

        default:
          result = { error: "unknown tool" };
      }

      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
    }

    messages.push({ role: "user", content: toolResults });
    if (signals.length >= config.MAX_SIGNALS_PER_CYCLE) break;
  }

  return signals;
}
