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
  const toExpire = activeSignals.filter((signal) => now - signal.generatedAt > config.SIGNAL_TTL_MS);
  for (const signal of toExpire) {
    signal.expired = true;
    expiredSignals.push(signal);
    activeSignals.splice(activeSignals.indexOf(signal), 1);
    logger.debug(`Signal expired: ${signal.token} ${signal.direction}`);
  }
}

export function getActiveSignals(): TradeSignal[] {
  expireOldSignals();
  return [...activeSignals];
}

export function getSignalStats() {
  const allSignals = [...activeSignals, ...expiredSignals];
  return {
    active: activeSignals.length,
    expired: expiredSignals.length,
    bullish: allSignals.filter((signal) => signal.direction === "bullish").length,
    bearish: allSignals.filter((signal) => signal.direction === "bearish").length,
    avgConfidence: allSignals.length > 0
      ? allSignals.reduce((sum, signal) => sum + signal.confidence, 0) / allSignals.length
      : 0,
  };
}

export function printSignalBoard() {
  const active = getActiveSignals();
  if (active.length === 0) {
    logger.info("No active catalyst signals");
    return;
  }

  logger.info("─── Active Catalyst Tape ─────────────────────────────");
  for (const signal of active.sort((left, right) => right.confidence - left.confidence)) {
    const arrow = signal.direction === "bullish" ? "↑" : signal.direction === "bearish" ? "↓" : "→";
    const age = Math.round((Date.now() - signal.generatedAt) / 60000);
    logger.info(`  ${arrow} ${signal.token.padEnd(8)} ${signal.direction.toUpperCase().padEnd(8)} conf=${signal.confidence.toFixed(2)} half-life=${signal.eventHalfLifeMinutes}m contam=${signal.contaminationScore.toFixed(2)} age=${age}m`);
    logger.info(`     ${signal.entryNotes}`);
  }
}
