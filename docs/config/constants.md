# Configuration constants

## Purpose

Central URLs and sync thresholds in `src/config/constants.ts`.

## Database

| Constant | Value |
|----------|-------|
| `DB_NAME` | `champions_dex.db` |

## External URLs

| Constant | Purpose |
|----------|---------|
| `POKEAPI_BASE_URL` | PokeAPI v2 root |
| `SEREBII_BASE_URL` | Serebii Champions pages |
| `PIKALYTICS_AI_BASE_URL` | Pikalytics AI pokedex |
| `PIKALYTICS_AI_INDEX_URL` | Meta index (same path as base) |
| `PIKALYTICS_CDN_BASE` | Sprite CDN |

## `SYNC_CONFIG`

| Field | Value | Notes |
|-------|-------|-------|
| `RATE_LIMIT_DELAY` | 250 ms | PokeAPI pacing |
| `RETRY_ATTEMPTS` | 3 | Fetch retries |

## `META_SYNC_CONFIG`

| Field | Value | Notes |
|-------|-------|-------|
| `SYNC_INTERVAL_DAYS` | 7 | Skip automatic meta sync |
| `MIN_USAGE_PCT` | 5 | Store meta rows at or above this % in full sync |
| `RATE_LIMIT_DELAY` | 300 ms | Between Pokémon in Phase 2 |

## Related files

- `src/config/constants.ts`
- All services reading API bases

*Last verified against code: 2026-06-01*
