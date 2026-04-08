import Anthropic from "@anthropic-ai/sdk";
import { config } from "../lib/config.js";
import { createLogger } from "../lib/logger.js";
import type { NewsItem, TradeSignal } from "../lib/types.js";
import { HERALD_SYSTEM } from "./prompts.js";
import { randomUUID } from "crypto";
import { getContaminationScore, getHalfLifeMinutes } from "../signals/filter.js";

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
    description: "Returns basic context for a token",
    input_schema: {
      type: "object" as const,
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
  },
  {
    name: "get_similar_past_events",
    description: "Returns historical examples of similar catalyst paths",
    input_schema: {
      type: "object" as const,
      properties: { category: { type: "string" }, token: { type: "string" } },
      required: ["category"],
    },
  },
  {
    name: "submit_signal",
    description: "Submit a trading signal generated from a catalyst event",
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
        surpriseScore: { type: "number" },
        rationale: { type: "string" },
        entryNotes: { type: "string" },
        riskNotes: { type: "string" },
      },
      required: ["newsId", "headline", "token", "direction", "confidence", "expectedMovesPct", "timeHorizon", "surpriseScore", "rationale", "entryNotes", "riskNotes"],
    },
  },
];

export async function generateSignals(newsItems: NewsItem[]): Promise<TradeSignal[]> {
  if (newsItems.length === 0) return [];

  const signals: TradeSignal[] = [];
  const byId = new Map(newsItems.map((item) => [item.id, item]));

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `${newsItems.length} catalyst items queued. Submit only signals with confidence >= ${config.MIN_CONFIDENCE}. Max ${config.MAX_SIGNALS_PER_CYCLE} signals this cycle.`,
    },
  ];

  for (let iteration = 0; iteration < 14; iteration++) {
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
          result = newsItems.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            tokens: item.tokens,
            contaminationScore: Number(getContaminationScore(item).toFixed(2)),
            halfLifeMinutes: getHalfLifeMinutes(item),
            ageMinutes: Math.round((Date.now() - item.publishedAt) / 60000),
          }));
          break;

        case "get_token_context": {
          const input = block.input as { symbol: string };
          result = {
            symbol: input.symbol,
            tier: ["BTC", "ETH", "SOL"].includes(input.symbol) ? "large-cap" : "mid-small-cap",
            note: "Reason from catalyst quality and category path, not generic sentiment.",
          };
          break;
        }

        case "get_similar_past_events": {
          const input = block.input as { category: string };
          const examples: Record<string, string> = {
            hack: "Immediate shock usually hits in the first 10-30 minutes, then reflex bounce if loss scope shrinks.",
            listing: "Impact is front-loaded; confirmation plus first pullback often matter more than headline itself.",
            regulation: "Half-life is longer because positioning reprices over hours, not seconds.",
            unlock: "Supply overhang often bleeds before and after the event unless offset by strong demand.",
            governance: "Token reaction depends on whether the vote changes fees, emissions, or treasury use.",
          };
          result = { category: input.category, historicalContext: examples[input.category] ?? "Limited historical analogs." };
          break;
        }

        case "submit_signal": {
          const input = block.input as Omit<TradeSignal, "id" | "generatedAt" | "expired" | "eventHalfLifeMinutes" | "contaminationScore">;
          const news = byId.get(input.newsId);
          if (!news) {
            result = { accepted: false, reason: "news item missing" };
            break;
          }
          if (input.confidence >= config.MIN_CONFIDENCE && signals.length < config.MAX_SIGNALS_PER_CYCLE) {
            const signal: TradeSignal = {
              ...input,
              id: randomUUID(),
              generatedAt: Date.now(),
              expired: false,
              eventHalfLifeMinutes: getHalfLifeMinutes(news),
              contaminationScore: Number(getContaminationScore(news).toFixed(2)),
            };
            signals.push(signal);
            const arrow = signal.direction === "bullish" ? "↑" : signal.direction === "bearish" ? "↓" : "→";
            logger.info(`[SIGNAL] ${arrow} ${signal.token} | conf ${signal.confidence.toFixed(2)} | half-life ${signal.eventHalfLifeMinutes}m | surprise ${signal.surpriseScore.toFixed(2)}`);
            logger.info(`  -> ${signal.rationale}`);
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
