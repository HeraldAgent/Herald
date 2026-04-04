<div align="center">

# Herald

**News-to-trade signal engine.**
Scans crypto news every 5 minutes. Extracts events. Generates actionable trade signals with confidence scores, entry notes, and risk factors.

[![Build](https://img.shields.io/github/actions/workflow/status/HeraldSignals/Herald/ci.yml?branch=main&style=flat-square&label=Build)](https://github.com/HeraldSignals/Herald/actions)
![License](https://img.shields.io/badge/license-MIT-blue)
[![Built with Claude Agent SDK](https://img.shields.io/badge/Built%20with-Claude%20Agent%20SDK-cc7800?style=flat-square)](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square)](https://www.typescriptlang.org/)

</div>

---

Most crypto moves are news-driven. ETF filings, exchange hacks, protocol upgrades, large funding rounds — the price reacts fast. The edge is in reading the event correctly before the market prices it in.

`Herald` pulls from CryptoPanic, CoinDesk, and TheDefiant on a 5-minute cycle. It classifies each event by category, scores its likely market impact, and asks Claude to generate a structured trade signal: direction, confidence, expected move, time horizon, and specific entry and risk notes.

```
FETCH → CLASSIFY → RANK → SIGNAL → TRACK
```

---

## Dashboard

![Herald Dashboard](assets/preview-dashboard.svg)

---

## Terminal Output

![Herald Terminal](assets/preview-terminal.svg)

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│              News Feeds                             │
│   CryptoPanic API · CoinDesk RSS · TheDefiant RSS  │
└───────────────────────┬────────────────────────────┘
                        ▼
┌────────────────────────────────────────────────────┐
│           Signal Filter Pipeline                    │
│   dedup → filter by token/category → rank impact  │
└───────────────────────┬────────────────────────────┘
                        ▼
┌────────────────────────────────────────────────────┐
│           Claude Signal Agent                       │
│   get_news_batch → get_token_context               │
│   → get_similar_past_events → submit_signal        │
└───────────────────────┬────────────────────────────┘
                        ▼
┌────────────────────────────────────────────────────┐
│           Signal Tracker                            │
│   Active signals · TTL expiry · live feed print   │
└────────────────────────────────────────────────────┘
```

---

## Signal Output

```
┌─ ↑ BULLISH  SOL   conf=0.91  horizon=immediate  est=+18%
│  "Coinbase announces SOL spot ETF filing"
│  Entry: buy on confirmation, 15m close above resistance
└  Risk: filing rejection invalidates signal

┌─ ↓ BEARISH  AAVE  conf=0.88  horizon=immediate  est=-22%
│  "AAVE v3 exploit reported — $47M drained from ETH mainnet"
│  Entry: short on confirmation
└  Risk: funds recovered or exploit overstated
```

---

## Supported Categories

| Category | Example | Default Bias |
|----------|---------|-------------|
| `listing` | Exchange listing, ETF filing | Bullish |
| `hack` | Protocol exploit, bridge drain | Bearish |
| `funding` | VC round, grant | Bullish |
| `regulation` | SEC action, ban | Bearish |
| `upgrade` | Protocol migration, v2 launch | Bullish |
| `partnership` | Integration, collaboration | Bullish |
| `macro` | Fed decision, CPI data | Contextual |
| `whale` | Large wallet movement | Contextual |

---

## Quick Start

```bash
git clone https://github.com/HeraldSignals/Herald
cd Herald && bun install
cp .env.example .env
# add your ANTHROPIC_API_KEY and optionally CRYPTOPANIC_API_KEY
bun run dev
```

---

## Configuration

```bash
ANTHROPIC_API_KEY=sk-ant-...
CRYPTOPANIC_API_KEY=...        # free at cryptopanic.com/developers
MIN_CONFIDENCE=0.65            # skip signals below this threshold
MAX_SIGNALS_PER_CYCLE=5        # cap per scan cycle
SIGNAL_TTL_MS=3600000          # expire signals after 1h
SCAN_INTERVAL_MS=300000        # scan every 5 minutes
TRACKED_TOKENS=SOL,BTC,ETH,JTO,AAVE,JUP,BONK,WIF,PYTH,W
```

---

## License

MIT

---

*read the news. catch the move.*
