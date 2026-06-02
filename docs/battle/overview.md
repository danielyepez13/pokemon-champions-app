# Battle preview overview

## Purpose

Real-time tactical analysis when the user enters an opponent team (up to six species). Combines type matchups, speed tiers with Choice Scarf warnings, and Pikalytics-driven alerts.

## User flow

1. Open **Battle** tab.
2. Active user team loads from SQLite (`battle-store`).
3. User selects enemy Pokémon per slot (keyboard-focused UX).
4. Heatmap, speed comparisons, and alerts update on each slot change.

## Engine modules

| Module | Doc |
|--------|-----|
| `battle-analysis.ts` | [battle-analysis.md](battle-analysis.md) |
| `type-chart.ts` | [type-chart.md](type-chart.md) |
| `stat-calculator.ts` | [stat-calculator.md](stat-calculator.md) |
| `meta-flags.ts` | [meta-flags.md](meta-flags.md) |
| Battle UI | [ui-components.md](ui-components.md) |

## Format assumptions

- Level **50** (VGC standard formulas in stat calculator).
- Max **32 EVs** per stat in speed comparisons (`MAX_EV = 32`).
- Max IV **31** unless specified.

## Session state

Enemy roster is **not** persisted — only held in `useBattleStore`.

## Related files

- `app/(tabs)/battle.tsx`
- `src/stores/battle-store.ts`
- `src/utils/battle-analysis.ts`
- `src/components/battle/*`

*Last verified against code: 2026-06-01*
