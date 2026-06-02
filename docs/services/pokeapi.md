# PokeAPI service

## Purpose

Fetch canonical Pokémon data from [PokeAPI v2](https://pokeapi.co/api/v2) to supplement Pikalytics-driven records.

## Configuration

- `POKEAPI_BASE_URL`: `https://pokeapi.co/api/v2`
- Rate limiting via `SYNC_CONFIG.RATE_LIMIT_DELAY` (250 ms) and retry attempts (3) where implemented

## Key methods

| Method | Use |
|--------|-----|
| `getPokemonDetail(name, form?)` | Stats, types, id, height/weight |
| `getPokemonSpeciesForDetail(detail, displayName)` | Flavor text with fallback name resolution |
| `getPokemonSpeciesByName(name)` | Species when detail unavailable |

## Name resolution

Sync passes **lowercased Pikalytics display name** as slug (e.g. `rotom-wash`). Fallback paths track `resolvedViaFallback` for logging.

## Data mapping

- Stats: `base_stat` array indices 0–5 → hp, atk, def, spa, spd, spe
- Height/weight: API units converted (`/ 10`) to meters/kg display scale
- Types: `detail.types[].type.name`

## Related files

- `src/services/pokeapi-service.ts`
- `src/services/sync-orchestrator.ts`

*Last verified against code: 2026-06-01*
