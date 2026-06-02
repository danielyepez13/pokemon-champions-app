# Battle screen

## Route

`app/(tabs)/battle.tsx` — tab title **Battle**.

## Purpose

Battle Preview: enemy slot entry, heatmap matrix, speed insights, tactical alerts.

## Data

- `useBattleStore` — load on mount/focus
- Components: `HeatmapMatrix`, `TacticalAlerts`, `EnemySelectionModal`

## UX

Keyboard-forward enemy entry for fast tournament prep.

## Related documentation

- [battle/overview.md](../battle/overview.md)
- [battle/ui-components.md](../battle/ui-components.md)

## Related files

- `app/(tabs)/battle.tsx`
- `src/stores/battle-store.ts`

*Last verified against code: 2026-06-01*
