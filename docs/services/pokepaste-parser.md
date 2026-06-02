# Pokepaste parser

## Purpose

Parse Pokémon Showdown / Pokepaste team export text into structured `ParsedPokemon` objects for team import.

## Output type: `ParsedPokemon`

| Field | Type |
|-------|------|
| name | string — species (from nickname line logic) |
| item | optional string |
| ability | optional string |
| level | number (default 50) |
| nature | optional string |
| evs, ivs | `Record<string, number>` |
| moves | string[] |

## Block splitting

Teams split on blank lines (`\n\s*\n`). Each block is one Pokémon.

## Header line

Formats supported:

```
Nickname (Species) (M/F) @ Item
Species (M/F) @ Item
Species @ Item
```

Logic:

- If third parenthetical is gender → `name = Species` (middle group).
- If second group is `M` or `F` → `name = first group`.
- If second group is species → `name = second group` (nickname case).
- Else `name = first group`.

## Body lines

| Prefix | Field |
|--------|-------|
| `Ability:` | ability |
| `Level:` | level |
| `EVs:` | parsed per `stat value` segments separated by `/` |
| `IVs:` | same pattern |
| `- Move` | moves array |
| other non-empty | treated as nature line |

## Limitations

- Does not validate move/ability legality.
- Species name must match DB/Pikalytics naming for import resolution.
- EV format expects Showdown-style `252 HP / 4 Spe` (Champions may use 32 max in battle calc, paste can still contain any values).

## Related files

- `src/services/pokepaste-parser.ts`
- `src/services/team-service.ts`

*Last verified against code: 2026-06-01*
