# Contributing

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Contribution Rules

- keep feed parsing, scoring, and board copy in separate changes
- update tests when half-life or contamination logic changes
- keep all documentation focused on tradeable catalyst timing

## Pull Request Notes

- explain which catalyst category changed
- include a sample tape ticket when ranking behavior changes
- update the runbook if operator actions changed
