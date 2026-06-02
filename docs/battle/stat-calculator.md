# Stat calculator

## Purpose

Level 50 stat formulas for VGC/Champions analysis, used by battle speed comparisons and speed tier screens.

## `calcStat(statKey, base, ev, iv?, nature?)`

### HP

```
floor((2 * base + iv + floor(ev / 4)) * 50 / 100) + 50 + 10
```

### Other stats

```
floor((floor((2 * base + iv + floor(ev / 4)) * 50 / 100) + 5) * nature_modifier)
```

Nature modifier: 1.1 if `nature.up === statKey`, 0.9 if `nature.down === statKey`.

## Champions format

Battle analysis passes **32 EVs** and **31 IVs** when computing enemy max Speed — reflects Pokémon Champions rules (not 252 EV singles).

Paste import may store arbitrary EV strings; calculator accepts any `ev` argument.

## Helpers

- `DB_STAT_MAP` — EV key to column name
- `STAT_ORDER`, `STAT_LABELS` — UI display

## Related files

- `src/utils/stat-calculator.ts`
- `src/utils/natures.ts`
- `src/utils/battle-analysis.ts`
- `app/(tabs)/speed-tiers.tsx`

*Last verified against code: 2026-06-01*
