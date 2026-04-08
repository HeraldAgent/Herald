import { config, getTrackedTokens } from "./src/lib/config.js";
import { createLogger } from "./src/lib/logger.js";
import { fetchCryptoPanicNews } from "./src/feeds/cryptopanic.js";
import { fetchRssNews } from "./src/feeds/rss.js";
import { deduplicateNews, filterRelevantNews, rankNewsByImpact, getContaminationScore, getHalfLifeMinutes } from "./src/signals/filter.js";
import { generateSignals } from "./src/agent/loop.js";
import { addSignals, getSignalStats, printSignalBoard } from "./src/execution/tracker.js";

const logger = createLogger("herald");

async function scan() {
  logger.info("─── Catalyst tape scan ───────────────────────────────");

  const [cpNews, rssNews] = await Promise.all([
    fetchCryptoPanicNews(100),
    fetchRssNews(),
  ]);

  const all = deduplicateNews([...cpNews, ...rssNews]);
  const relevant = filterRelevantNews(all);
  const ranked = rankNewsByImpact(relevant);

  logger.info(`Fetched ${all.length} items -> ${relevant.length} relevant -> top ${Math.min(ranked.length, 10)} queued`);

  const lead = ranked[0];
  if (lead) {
    logger.info(`Lead catalyst: ${lead.category} | half-life ${getHalfLifeMinutes(lead)}m | contamination ${getContaminationScore(lead).toFixed(2)}`);
  }

  const topItems = ranked.slice(0, 10);
  if (topItems.length === 0) {
    logger.info("No relevant catalysts this cycle");
    return;
  }

  const signals = await generateSignals(topItems);
  addSignals(signals);

  const stats = getSignalStats();
  logger.info(`Signals: ${stats.active} active | ${stats.bullish} bullish | ${stats.bearish} bearish | avg conf ${stats.avgConfidence.toFixed(2)}`);

  printSignalBoard();
}

async function main() {
  logger.info("Herald starting...");
  logger.info(`Tracking: ${getTrackedTokens().join(", ")} | Interval: ${config.SCAN_INTERVAL_MS / 60000}m`);

  await scan();
  setInterval(scan, config.SCAN_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
