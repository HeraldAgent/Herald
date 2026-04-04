import { createLogger } from "../lib/logger.js";
import { config } from "../lib/config.js";
import type { TradeSignal } from "../lib/types.js";

const logger = createLogger("tracker");
const activeSignals: TradeSignal[] = [];
const expiredSignals: TradeSignal[] = [];

export function addSignals(signals: TradeSignal[]) {
  activeSignals.push(...signals);
  expireOldSignals();
}

export function expireOldSignals() {
  const now = Date.now();
  const toExpire = activeSignals.filter((s) => now - s.generatedAt > config.SIGNAL_TTL_MS);
  for (const s of toExpire) {
    s.expired = true;
    expiredSignals.push(s);
    activeSignals.splice(activeSignals.indexOf(s), 1);
    logger.debug(`Signal expired: ${s.token} ${s.direction}`);
  }
}

export function getActiveSignals(): TradeSignal[] {
  expireOldSignals();
  return [...activeSignals];
}

export function getSignalStats() {
  const all = [...activeSignals, ...expiredSignals];
  return {
    active: activeSignals.length,
    expired: expiredSignals.length,
    bullish: all.filter((s) => s.direction === "bullish").length,
    bearish: all.filter((s) => s.direction === "bearish").length,
    avgConfidence: all.length > 0
      ? all.reduce((s, sig) => s + sig.confidence, 0) / all.length
      : 0,
  };
}

export function printSignalBoard() {
  const active = getActiveSignals();
  if (active.length === 0) {
    logger.info("No active signals");
    return;
  }

  logger.info("─── Active Signals ───────────────────────────────");
  for (const s of active.sort((a, b) => b.confidence - a.confidence)) {
    const arrow = s.direction === "bullish" ? "↑" : "↓";
    const age = Math.round((Date.now() - s.generatedAt) / 60000);
    logger.info(`  ${arrow} ${s.token.padEnd(8)} ${s.direction.toUpperCase().padEnd(8)} conf=${s.confidence.toFixed(2)} ${s.timeHorizon.padEnd(10)} ${age}m ago`);
    logger.info(`     ${s.entryNotes}`);
  }
}
