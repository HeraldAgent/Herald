# Herald

Catalyst tape for crypto market events.

Catch the headlines that still have edge after the market sees them.

`bun run dev`

- watches surprise, event half-life, contamination risk, and category context
- ignores recycled rumor loops, thin sourcing, and late social echo
- promotes catalysts that are still early enough to matter to a trader

[![Build](https://img.shields.io/github/actions/workflow/status/HeraldAgent/Herald/ci.yml?branch=master&style=flat-square&label=Build)](https://github.com/HeraldAgent/Herald/actions)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square)

## Catalyst Board

![Herald catalyst board](assets/preview-dashboard.svg)

## Tape Ticket

![Herald terminal](assets/preview-terminal.svg)

## Operating Surfaces

- `Catalyst Board`: organizes headlines by freshness, surprise, and contamination
- `Tape Ticket`: prints the exact event, half-life, and action bias
- `Decay Model`: tracks how fast each category loses edge after publication
- `Contamination Filter`: blocks rumor loops and over-distributed stories from ranking too high

## What Herald Treats As Real Edge

Herald is built around a simple idea: not every headline deserves to become a trading input. The system is stricter with stories that already spent their edge on social media and more generous with structurally important catalysts that still sit inside a usable half-life window.

That makes the tape useful during the part of the cycle where traders need speed, not a recap feed.

## When The Tape Stays Quiet

Herald should often do nothing.

- if a story is already over-distributed, it gets demoted
- if sourcing is weak, contamination rises quickly
- if the event category decays fast, the half-life window closes

A silent tape is better than a noisy one that promotes dead edge.

## Technical Spec

Herald ranks news with three practical questions:

1. Is the event surprising?
2. How long does edge usually persist for this category?
3. How contaminated is the headline by rumor loops or recycled coverage?

### Event Half-Life

`hack = 45m`

`listing = 90m`

`regulation = 240m`

`unlock = 360m`

This governs how fast a signal decays in the tape.

### Contamination Score

Contamination rises when the item contains:
- rumor / unconfirmed language
- anonymous sourcing
- repeated social headlines
- too many token mentions in one story

Higher contamination reduces ranking and conviction.

### Ranking Heuristic

`impact = categoryWeight + abs(rawSentiment) * 2 - contaminationScore * 3`

This keeps strong structural catalysts above hype headlines.

## Why Operators Keep It Open

Most crypto news products are built to tell you what happened. Herald is built to tell you whether there is still anything left to do.

That difference is what makes it worth keeping on-screen.

## Quick Start

```bash
git clone https://github.com/HeraldAgent/Herald
cd Herald
npm install
cp .env.example .env
npm run dev
```

## Local Audit Docs

- [Commit sequence](docs/commit-sequence.md)
- [Issue drafts](docs/issue-drafts.md)

## Support Docs

- [Runbook](docs/runbook.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## License

MIT
