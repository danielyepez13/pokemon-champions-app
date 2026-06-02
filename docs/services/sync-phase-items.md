# Sync phase 1: Items

## Purpose

Seed the local `items` table from the static Champions competitive list before Pokédex sync.

## Source

`CHAMPIONS_ITEMS_LIST` from `src/utils/items-champions.ts` (curated names, categories, effects).

## Behavior

1. Loop all list entries.
2. Emit `syncEvents` progress: `phase: 'items'`, `current`, `total`.
3. `ItemDAO.upsert` with:
   - `sprite_url` from `getItemSprite(name)` — lowercased, spaces and hyphens removed
   - `location: ''`

## No network

Phase 1 is entirely offline.

## Related files

- `src/services/sync-orchestrator.ts` (Phase 1 block)
- `src/utils/items-champions.ts`
- `src/database/dao/pokemon.dao.ts` (`ItemDAO`)

*Last verified against code: 2026-06-01*
