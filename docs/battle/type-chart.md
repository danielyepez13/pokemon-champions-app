# Type chart

## Purpose

`src/utils/type-chart.ts` computes defensive/offensive matchup scores between Pokémon type arrays for the battle heatmap.

## Key exports

| Export | Role |
|--------|------|
| `getMatchupScore(attackingTypes, defendingTypes)` | Numeric score from type effectiveness |
| `getMatchupLabel(score)` | Maps score to `MatchupLabel` |
| `MatchupLabel` | Union of qualitative buckets |

## Usage

Called synchronously from `buildHeatmap` for each my/enemy pair with both slots filled.

## Design

Considers dual typings on both sides; aggregates effectiveness into a single comparative score for UI coloring.

## Related files

- `src/utils/type-chart.ts`
- `src/utils/battle-analysis.ts`

*Last verified against code: 2026-06-01*
