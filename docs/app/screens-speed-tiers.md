# Speed Tiers screen

## Route

`app/(tabs)/speed-tiers.tsx` — tab title **Speed Tiers**.

## Purpose

Meta speed ladder: all synced competitive Pokémon ranked by maximum Speed at Level 50 with Champions rules (32 EV, +Spe nature, 31 IV). Active team members are highlighted.

## Data flow

1. `PokemonDAO.getAllByUsageRank()` — filter to `usageRank > 0`
2. `TeamDAO.getActiveTeam()` — collect member names for highlight
3. `calcStat('Spe', base, 32, 31, { up: 'Spe', down: null })` per Pokémon
4. Sort by max Speed descending, then `usageRank`

## UI

- Header with formula summary and count
- `FlatList` rows: rank, sprite, name, base Spe, usage %, computed max Spe
- Active team rows: gold left border + "YOUR TEAM" badge
- Empty state links to Settings when no meta data
- Row tap opens Pokémon detail

## Related documentation

- [stat-calculator.md](../battle/stat-calculator.md)

## Related files

- `app/(tabs)/speed-tiers.tsx`
- `src/utils/stat-calculator.ts`
- `src/database/dao/pokemon.dao.ts`
- `src/database/dao/team.dao.ts`

*Last verified against code: 2026-06-01*
