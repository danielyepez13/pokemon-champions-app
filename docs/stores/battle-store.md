# Battle store

## Purpose

Session state for Battle Preview: active team, enemy slots, and computed analysis.

## State

| Field | Description |
|-------|-------------|
| `myTeam` | `MyTeamMember[]` — includes `moves`, `ability` from team row |
| `myTeamLoaded` | boolean |
| `enemyTeam` | `(Pokemon \| null)[]` length 6 |
| `heatmap` | `HeatmapCell[][]` |
| `speedComparisons` | `SpeedComparison[]` |
| `alerts` | `TacticalAlert[]` |
| `analysisLoading` | boolean |

## Actions

- **`loadMyTeam`** — `TeamDAO.getActiveTeam()`, map members to `MyTeamMember`, then `recompute()`
- **`setEnemySlot(index, pokemon)`** — update slot, `recompute()`
- **`clearEnemyTeam`** — reset slots and analysis arrays

## Internal `recompute`

1. `buildHeatmap` (sync)
2. `MetaUsageDAO.getTopMetaForPokemonIds` once for all filled enemy slots
3. For each my×enemy pair: Scarf check from cached items → `compareSpeed`
4. `generateAlerts` with the same prefetched meta map (no per-enemy DB round-trips)
5. On error, logs and clears loading flag

## Related files

- `src/stores/battle-store.ts`
- `app/(tabs)/battle.tsx`

*Last verified against code: 2026-06-01*
