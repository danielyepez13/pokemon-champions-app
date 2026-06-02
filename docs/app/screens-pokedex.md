# Pokedex screen

## Route

`app/(tabs)/index.tsx` — tab title **Pokedex**.

## Purpose

Browse synced Pokémon ordered by meta usage rank; search and filter by type.

## Data

- `usePokemonStore`: `loadPokemons`, `filteredPokemons`, `setSearch`, `toggleTypeFilter`
- Navigate to detail: `/pokemon/[id]`

## UI patterns

- List/cards via `pokemon-card` component
- Type badges, sprites from DB (often Base64)

## Related files

- `app/(tabs)/index.tsx`
- `src/stores/pokemon-store.ts`
- `src/components/pokemon-card.tsx`

*Last verified against code: 2026-06-01*
