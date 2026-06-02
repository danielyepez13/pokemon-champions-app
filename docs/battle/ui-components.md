# Battle UI components

## Purpose

Present heatmap, tactical alerts, and enemy selection in the Battle tab.

## Components (`src/components/battle/`)

| Component | Role |
|-----------|------|
| `HeatmapMatrix.tsx` | Renders `heatmap` grid with color-coded cells |
| `TacticalAlerts.tsx` | Lists `TacticalAlert` items by severity |
| `EnemySelectionModal.tsx` | Pick Pokémon for enemy slots (search/list) |

## Data binding

Consumes `useBattleStore`:

- `heatmap`, `speedComparisons`, `alerts`
- `enemyTeam`, `setEnemySlot`, `clearEnemyTeam`
- `analysisLoading`

## UX notes

- Battle screen emphasizes quick enemy entry (auto-focused input where implemented).
- Sprites from `spriteDefault` / stored Base64.

## Related files

- `src/components/battle/*.tsx`
- `app/(tabs)/battle.tsx`
- `src/stores/battle-store.ts`

*Last verified against code: 2026-06-01*
