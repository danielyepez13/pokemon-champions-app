# Speed Tiers screen

## Route

`app/(tabs)/speed-tiers.tsx` — tab title **Speed Tiers**.

## Purpose

Compare speed stat lines across meta or team Pokémon using Champions EV rules (`calcStat` with 32 EV cap).

## Data

Typically reads from `pokemon` table and/or active team; uses `stat-calculator` and nature helpers.

## Related documentation

- [stat-calculator.md](../battle/stat-calculator.md)

## Related files

- `app/(tabs)/speed-tiers.tsx`
- `src/utils/stat-calculator.ts`

*Last verified against code: 2026-06-01*
