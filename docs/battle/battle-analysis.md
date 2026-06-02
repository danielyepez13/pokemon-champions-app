# Battle analysis engine

## Purpose

`src/utils/battle-analysis.ts` implements heatmap generation, speed tier comparison, and tactical alert generation.

## Heatmap: `buildHeatmap`

- Input: `myTeam: Pokemon[]`, `enemyTeam: (Pokemon | null)[]`
- Output: 2D `HeatmapCell[][]` aligned to team indices
- Empty enemy slot → neutral cell, color `#1f2937`
- Filled slot → `getMatchupScore(my.types, enemy.types)` → `getMatchupLabel` → color from `LABEL_COLORS`

### Labels

`dominant`, `favorable`, `neutral`, `unfavorable`, `dangerous` — see [type-chart.md](type-chart.md).

## Speed: `compareSpeed`

Assumes max investment for enemy:

- `calcStat('Spe', base, MAX_EV=32, MAX_IV=31, nature { up: 'Spe' })`
- Scarf speed = `floor(enemyMaxSpeed * 1.5)`
- Compares to user's speed at same EV/IV assumptions
- `hasScarfWarning` from Pikalytics top items (Choice Scarf usage)

## Alerts: `generateAlerts` (async)

Reads `MetaUsageDAO` per enemy for top moves, abilities, items.

### Alert types

1. **Anti-Intimidate** — danger if enemy ability has `anti_intimidate` flag and user has Intimidate
2. **Move flags** — speed_control, redirection, etc. from `getMoveFlags` (skips `protection`)
3. **Weather/terrain synergy** — warning/info if ≥2 enemies share same setter ability

Deduplication by alert `id`.

## Constants

```typescript
const MAX_EV = 32;
const MAX_IV = 31;
```

## Related files

- `src/utils/battle-analysis.ts`
- `src/stores/battle-store.ts` (`recompute`)
- `src/database/dao/meta-usage.dao.ts`

*Last verified against code: 2026-06-01*
