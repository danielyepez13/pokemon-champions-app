# Pokémon detail screen

## Route

`app/pokemon/[id].tsx` — dynamic segment `id` (SQLite primary key).

## Purpose

Show species stats, types, sprites, description, and Pikalytics meta usage (moves, abilities, items).

## Data

- `PokemonDAO.getById`
- `MetaUsageDAO` for competitive spreads
- Optional links to teammates / featured teams from meta tables

## Navigation

Opened from Pokédex list tap.

## Related files

- `app/pokemon/[id].tsx`
- `src/database/dao/pokemon.dao.ts`
- `src/database/dao/meta-usage.dao.ts`

*Last verified against code: 2026-06-01*
