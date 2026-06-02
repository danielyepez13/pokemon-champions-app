# Domain models

## Purpose

TypeScript interfaces in `src/models/` shared by DAOs, stores, and UI.

## `pokemon.ts`

### `Stats`

`hp`, `attack`, `defense`, `spAttack`, `spDefense`, `speed`, `total`.

### `Pokemon`

Core entity for lists and battle: `id`, `dexNumber`, `name`, `form`, `description`, `isMega`, `stats`, dimensions, sprites, `category`, `types`, `usagePct`, `usageRank`.

### `Ability`, `Move`, `Item`

Catalog shapes aligned with SQLite columns; `Move.category` is `'physical' | 'special' | 'status'`.

## `item.ts`

Standalone `Item` type when imported separately from pokemon model bundle.

## Mapping from SQL

DAOs map snake_case columns to camelCase interfaces (e.g. `sp_attack` → `spAttack`).

## Related files

- `src/models/pokemon.ts`
- `src/models/item.ts`

*Last verified against code: 2026-06-01*
