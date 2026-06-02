# Pokémon detail screen

## Route

`app/pokemon/[id].tsx` — dynamic segment `id` (SQLite primary key).

## Purpose

Show species stats, types, sprites, description, and Pikalytics meta usage (moves, abilities, items).

## Data

- `PokemonDAO.getById`
- `MetaUsageDAO` for competitive spreads
- `MetaTeammatesDAO` / `FeaturedTeamsDAO` for related meta
- `PokemonDAO.getByNames` for teammate and featured-team sprite lookup (targeted batch, not full Pokédex load)

## Navigation

Opened from Pokédex list tap.

## Related files

- `app/pokemon/[id].tsx`
- `src/database/dao/pokemon.dao.ts`
- `src/database/dao/meta-usage.dao.ts`

*Last verified against code: 2026-06-01*
