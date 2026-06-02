# Pokémon store

## Purpose

Pokédex list, search, and type filters for the main index screen.

## State

| Field | Type | Description |
|-------|------|-------------|
| `pokemons` | `Pokemon[]` | Full list from DB |
| `filteredPokemons` | `Pokemon[]` | After filters |
| `isLoading` | boolean | Load in progress |
| `filters` | `{ search, types, statMin, statMax }` | Filter state |

## Actions

- **`loadPokemons`** — `PokemonDAO.getAllByUsageRank()`
- **`setSearch`** — updates query, calls `applyFilters`
- **`toggleTypeFilter`** — add/remove type in filter array
- **`clearFilters`** — reset and show full list
- **`applyFilters`** — if `search.length > 2`, uses `PokemonDAO.search` then type filter; else local name/type filter

## Related files

- `src/stores/pokemon-store.ts`
- `app/(tabs)/index.tsx`

*Last verified against code: 2026-06-01*
