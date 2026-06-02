# Sync phase 2: Pokédex (Pikalytics-driven)

## Purpose

Build the competitive Pokédex from the Pikalytics Champions tournament index, enriched with PokeAPI base data and offline sprites.

## Steps per index entry

1. **`PikalyticsService.fetchIndex()`** — ranked list with `name`, `usagePct`, `rank`. Abort if empty.
2. Clear `meta_usage`, `meta_teammates`, `featured_teams`.
3. For each entry:
   - `fetchPokemonMeta(entry.name)` — moves, abilities, items, teammates, featured teams, optional `baseStats`.
   - `PokeAPIService.getPokemonDetail(pokeApiName)` — types, stats, dimensions.
   - Species flavor text via `getPokemonSpeciesForDetail` or `getPokemonSpeciesByName` (es/en flavor).
   - `downloadPikalyticsSpriteAsBase64(entry.name)` — store in `sprite_default` / `sprite_icon`.
   - Derive `form` from hyphenated name; `is_mega` if name contains `mega`.
   - `PokemonDAO.upsert` with usage rank/pct from index.
   - Filter meta rows with `usage_pct >= META_SYNC_CONFIG.MIN_USAGE_PCT` (5%).
   - `MetaUsageDAO.bulkReplace` for move/ability/item.
   - `MetaTeammatesDAO.upsert`, `FeaturedTeamsDAO.upsert`.
4. Progress event: `phase: 'pokeapi'` (label retained for UI).
5. Rate limit delay between entries.
6. Periodic `SyncDAO.logUpdate` every 5 Pokémon.
7. Set `pikalytics_last_sync` metadata; `logComplete`.

## Fallbacks

| Failure | Fallback |
|---------|----------|
| PokeAPI detail missing | Stats from Pikalytics `baseStats` |
| Species missing | Empty description; counters increment `speciesFailed` |
| Sprite missing | Empty string; counters increment `spritesFailed` |

## Stats logged at end

`spritesOk`, `spritesResolvedViaFallback`, `spritesFailed`, `speciesOk`, `speciesResolvedViaFallback`, `speciesFailed`.

## Related files

- `src/services/sync-orchestrator.ts`
- `src/services/pikalytics-service.ts`
- `src/services/pokeapi-service.ts`
- `src/services/image-downloader.ts`

*Last verified against code: 2026-06-01*
