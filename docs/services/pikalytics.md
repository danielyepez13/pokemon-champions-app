# Pikalytics AI service

## Purpose

Fetch competitive meta for Pokémon Champions tournaments from Pikalytics AI endpoints (markdown/structured responses).

## URLs (`src/config/constants.ts`)

| Constant | Value |
|----------|-------|
| `PIKALYTICS_AI_BASE_URL` | `https://www.pikalytics.com/ai/pokedex/championstournaments` |
| `PIKALYTICS_AI_INDEX_URL` | Same as base (meta index) |
| `PIKALYTICS_CDN_BASE` | `https://cdn.pikalytics.com/images/championssprites` |

## Key methods

| Method | Description |
|--------|-------------|
| `fetchIndex()` | Ranked Pokémon list for full sync Phase 2 |
| `fetchPokemonMeta(name)` | Per-species moves, abilities, items, teammates, featured teams |
| `fetchAllMeta(onProgress?)` | Bulk meta for `syncPikalytics` |

## Consumed data

- **Moves / abilities / items:** `name`, `usagePct`
- **Teammates:** paired usage
- **Featured teams:** tournament team strings and focus sets
- **baseStats:** fallback when PokeAPI fails

## Meta-only sync

`SyncOrchestrator.syncPikalytics`:

- Respects 7-day cooldown via `sync_metadata.pikalytics_last_sync`
- Clears and repopulates meta tables only
- Matches local Pokémon by **exact Pikalytics display name**
- Skips species not already in DB (warns in log)
- Does not re-download sprites

## Related files

- `src/services/pikalytics-service.ts`
- `src/services/sync-orchestrator.ts`

*Last verified against code: 2026-06-01*
