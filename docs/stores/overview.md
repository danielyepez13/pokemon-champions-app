# Stores overview

## Purpose

Zustand stores bridge SQLite DAOs/services and React screens. No persistence layer inside stores except via DAO calls.

## Store map

| Store | File | Persistence |
|-------|------|-------------|
| Pokémon list/filters | `pokemon-store.ts` | Reads DB |
| Sync UI state | `sync-store.ts` | Ephemeral + orchestrator events |
| Battle analysis | `battle-store.ts` | My team from DB; enemy session-only |

## Pattern

```typescript
create<State>((set, get) => ({ ...actions }));
```

## When to add a new store

Prefer colocated `useState` for single-screen UI. Add a store when:

- Multiple screens share the same async dataset
- Long-running operations need global progress (sync)
- Expensive derived state should recompute centrally (battle)

## Related documentation

- [pokemon-store.md](pokemon-store.md)
- [battle-store.md](battle-store.md)
- [sync-store.md](sync-store.md)

*Last verified against code: 2026-06-01*
