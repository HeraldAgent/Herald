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

Catalyst Board • Tape Ticket • Operating Surfaces • Real Edge • Technical Spec • Quick Start

## At a Glance

- `Use case`: convert crypto headlines into time-sensitive catalyst signals
- `Primary input`: surprise, category half-life, contamination, freshness
- `Primary failure mode`: promoting headlines after the edge has already been distributed
- `Best for`: operators who need to know whether a story still has anything left to do

## Catalyst Board

![Herald catalyst board](assets/preview-dashboard.svg)

## Tape Ticket

![Herald terminal](assets/preview-terminal.svg)

## Operating Surfaces

- `Catalyst Board`: organizes headlines by freshness, surprise, and contamination
- `Tape Ticket`: prints the exact event, half-life, and action bias
- `Decay Model`: tracks how fast each category loses edge after publication
- `Contamination Filter`: blocks rumor loops and over-distributed stories from ranking too high

## What Herald Does Better Than A News Feed

Herald is not meant to tell you what happened. It is meant to tell you whether what happened still has any tradable life left in it.

That requires a stricter view of timing than most crypto news products take. A headline can be real and still be useless if it has already been distributed through too many channels, repeated by too many low-quality accounts, or delayed too long for the category.

## What Herald Treats As Real Edge

Herald is built around a simple idea: not every headline deserves to become a trading input. The system is stricter with stories that already spent their edge on social media and more generous with structurally important catalysts that still sit inside a usable half-life window.

That makes the tape useful during the part of the cycle where traders need speed, not a recap feed.

## When The Tape Stays Quiet

Herald should often do nothing.

- if a story is already over-distributed, it gets demoted
- if sourcing is weak, contamination rises quickly
- if the event category decays fast, the half-life window closes

A silent tape is better than a noisy one that promotes dead edge.

## How It Works

Herald keeps the workflow simple:

1. ingest fresh market headlines from the enabled feeds
2. classify the event into a category with its own expected half-life
3. measure surprise and contamination at the story level
4. downgrade stories that are weakly sourced, recycled, or late
5. rank the remaining catalysts into a tape the operator can actually act on

The goal is not full news coverage. The goal is clean timing.

## How The Board Should Be Read

### Freshness

The same headline means different things at 3 minutes, 30 minutes, and 3 hours depending on category. Herald keeps that timing discipline explicit.

### Surprise

A genuinely surprising event can still matter after social media has seen it. A routine headline with no real surprise usually should not.

### Contamination

This is where most junk gets filtered out. Rumor phrasing, anonymous sourcing, repetitive token stuffing, and social echo loops all raise contamination fast.

## Example Output

```text
HERALD // CATALYST TAPE

event            JUP fee vote passes
category         governance
surprise         high
half-life        240m
contamination    low
state            actionable

operator note: structural token-economics change still inside edge window
```

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

## Example Categories Herald Cares About

- exchange listings that materially change access
- unlock schedules that alter supply pressure
- governance or fee changes that affect token economics
- hacks and security failures with immediate repricing impact
- regulatory or macro headlines that change the market regime

## Risk Controls

- `half-life decay`: prevents stale headlines from staying live too long
- `contamination score`: demotes rumor loops and low-quality social repetition
- `category weighting`: keeps structural catalysts above low-value hype
- `freshness requirement`: blocks late stories even when the headline sounds dramatic

Herald should bias toward silence when timing is compromised. A dead catalyst with a strong headline is still dead.

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
