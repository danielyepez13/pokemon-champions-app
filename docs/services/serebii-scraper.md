# Serebii scraper

## Purpose

Optional HTML scraping of Serebii Pokémon Champions pages using cheerio for supplemental data (when integrated by callers).

## Configuration

- `SEREBII_BASE_URL`: `https://www.serebii.net/pokemonchampions`

## Stack

- **cheerio** — server-style DOM parsing in React Native
- **axios** — HTTP fetch

## Usage notes

- Respect Serebii terms of service and rate limits in production.
- Scraping is fragile if page HTML changes; prefer PokeAPI/Pikalytics for core sync.
- Not part of `SyncOrchestrator` main path — consult call sites in codebase when extending.

## Related files

- `src/services/serebii-scraper.ts`
- `src/config/constants.ts`

*Last verified against code: 2026-06-01*
