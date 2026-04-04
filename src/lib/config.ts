import { z } from "zod";

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  CLAUDE_MODEL: z.string().default("claude-sonnet-4-5-20251001"),
  CRYPTOPANIC_API_KEY: z.string().optional(),
  SCAN_INTERVAL_MS: z.coerce.number().default(300000),      // 5 min
  MIN_CONFIDENCE: z.coerce.number().default(0.65),
  TRACKED_TOKENS: z.string().default("SOL,BTC,ETH,BNB,JTO,BONK,WIF,JUP"),
  SIGNAL_TTL_MS: z.coerce.number().default(3600000),        // signals expire after 1h
  MAX_SIGNALS_PER_CYCLE: z.coerce.number().default(5),
  ENABLE_CRYPTOPANIC: z.coerce.boolean().default(true),
  ENABLE_RSS: z.coerce.boolean().default(true),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(): Config {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid config: ${missing}`);
  }
  return result.data;
}

export const config = loadConfig();

export function getTrackedTokens(): string[] {
  return config.TRACKED_TOKENS.split(",").map((s) => s.trim()).filter(Boolean);
}
