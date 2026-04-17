import { config, getTrackedTokens } from "./src/lib/config.js";
import { createLogger } from "./src/lib/logger.js";
import { fetchCryptoPanicNews } from "./src/feeds/cryptopanic.js";
import { fetchRssNews } from "./src/feeds/rss.js";
import {
  deduplicateNews,
  filterRelevantNews,
  rankNewsByImpact,
  getContaminationScore,
  getHalfLifeMinutes,
} from "./src/signals/filter.js";
import { generateSignals } from "./src/agent/loop.js";
import { addSignals, getSignalStats, printSignalBoard } from "./src/execution/tracker.js";

const logger = createLogger("herald");

async function scan() {
  const startedAt = Date.now();
  logger.info("Catalyst tape scan starting");

  try {
    const sourceResults = await Promise.allSettled([fetchCryptoPanicNews(100), fetchRssNews()]);
    const [cpResult, rssResult] = sourceResults;
    const cpNews = cpResult.status === "fulfilled" ? cpResult.value : [];
    const rssNews = rssResult.status === "fulfilled" ? rssResult.value : [];

    if (cpResult.status === "rejected") {
      logger.error("CryptoPanic fetch failed", {
        error: cpResult.reason instanceof Error ? cpResult.reason.message : String(cpResult.reason),
      });
    }

    if (rssResult.status === "rejected") {
      logger.error("RSS fetch failed", {
        error: rssResult.reason instanceof Error ? rssResult.reason.message : String(rssResult.reason),
      });
    }

    const all = deduplicateNews([...cpNews, ...rssNews]);
    if (all.length === 0) {
      logger.warn("No news items available from any source this cycle");
      return;
    }

    const relevant = filterRelevantNews(all);
    const ranked = rankNewsByImpact(relevant);
    logger.info(`Fetched ${all.length} items -> ${relevant.length} relevant -> top ${Math.min(ranked.length, 10)} queued`);

    const lead = ranked[0];
    if (lead) {
      logger.info(
        `Lead tape item: ${lead.category} | half-life ${getHalfLifeMinutes(lead)}m | contamination ${getContaminationScore(lead).toFixed(2)}`,
      );
    }

    const topItems = ranked.slice(0, 10);
    if (topItems.length === 0) {
      logger.info("No relevant catalysts this cycle");
      return;
    }

    const signals = await generateSignals(topItems);
    if (signals.length === 0) {
      logger.info("No trade signals were generated from the current catalyst set");
      return;
    }

    addSignals(signals);

    const stats = getSignalStats();
    logger.info(
      `Signals: ${stats.active} active | ${stats.bullish} bullish | ${stats.bearish} bearish | avg conf ${stats.avgConfidence.toFixed(2)}`,
    );

    printSignalBoard();
  } finally {
    const durationMs = Date.now() - startedAt;
    logger.info("Herald scan complete", { durationMs });

    if (durationMs > config.SCAN_INTERVAL_MS) {
      logger.warn("Herald scan exceeded configured interval", {
        durationMs,
        intervalMs: config.SCAN_INTERVAL_MS,
      });
    }
  }
}

async function main() {
  logger.info("Herald starting...");
  logger.info(`Tracking: ${getTrackedTokens().join(", ")} | Interval: ${config.SCAN_INTERVAL_MS / 60000}m`);

  let scanInFlight = false;
  let skippedScans = 0;

  const tick = async () => {
    if (scanInFlight) {
      skippedScans++;
      logger.warn("Skipping catalyst scan because the previous cycle is still running", {
        skippedScans,
      });
      return;
    }

    scanInFlight = true;
    try {
      await scan();
    } catch (err) {
      logger.error("Catalyst scan failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      scanInFlight = false;
    }
  };

  await tick();
  setInterval(() => {
    void tick();
  }, config.SCAN_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
