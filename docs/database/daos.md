# Data access objects (DAOs)

## Purpose

Static DAO classes encapsulate SQL for each domain. Screens and services should prefer DAOs over raw SQL.

## DAO map

| File | Responsibility |
|------|----------------|
| `pokemon.dao.ts` | `PokemonDAO`, `ItemDAO` — species CRUD, upsert with types, `getAllByUsageRank`, FTS `search` |
| `team.dao.ts` | Teams, members, moves, active team queries with joins |
| `meta-usage.dao.ts` | `meta_usage` bulk replace, getTopMoves/Abilities/Items |
| `meta-pokedex.dao.ts` | `MetaTeammatesDAO`, `FeaturedTeamsDAO` |
| `ability.dao.ts` | Ability lookup and upsert |
| `item.dao.ts` | Item-specific helpers if split from pokemon.dao |
| `move.dao.ts` | Move stubs and lookup |
| `sync.dao.ts` | `sync_log` start/update/complete/failure, `sync_metadata` get/set |

## PokemonDAO highlights

- **`upsert`:** Insert or update by `name`; writes types, stats, sprites, usage fields.
- **`getByName`:** Lookup by Pikalytics display name (team import, on-demand sync).
- **`getAllByUsageRank`:** Pokédex list ordered by meta rank.
- **`search`:** FTS5 when available.

## TeamDAO highlights

- **`getActiveTeam`:** Team with `is_active = 1` and member rows for battle store.
- **`createTeam` / add members:** Used by `TeamService.importFromPokepaste`.
- **`team_order`:** Display order distinct from battle `slot`.

## MetaUsageDAO highlights

- **`bulkReplace`:** Delete category rows for Pokémon then insert filtered meta entries.
- **`clearAll`:** Called at start of full/meta sync.
- **`getTopItems`:** Used for Choice Scarf detection in battle store.

## SyncDAO highlights

- **`logStart(phase)`** → sync id for progress updates.
- **`setMetadata` / `getMetadata`:** Cooldown for `syncPikalytics`.

## Conventions

- Static methods only.
- Async/await with `expo-sqlite` `runAsync`, `getAllAsync`, `getFirstAsync`.
- Upsert patterns avoid duplicate unique keys (`name` on pokemon/items).

## Related files

- `src/database/dao/*.ts`
- `src/database/index.ts` (re-exports if any)

*Last verified against code: 2026-06-01*
