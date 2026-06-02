# Sync store

## Purpose

Expose sync progress to Settings/Items UI by subscribing to `syncEvents` from `SyncOrchestrator`.

## State

| Field | Values |
|-------|--------|
| `status` | `'idle' \| 'syncing' \| 'done' \| 'error'` |
| `phase` | `'items' \| 'pokeapi' \| 'pikalytics' \| null` |
| `progress` | `{ current, total }` |
| `error` | string \| null |

## Actions

- **`startSync`** — sets syncing, calls `SyncOrchestrator.startSync()`

## Event wiring

Registered at store creation:

- `progress` → update status, phase, progress
- `complete` → `status: 'done'`, `phase: null`
- `error` → `status: 'error'`, message

Note: `syncPikalytics` also emits `phase: 'pikalytics'` but is not wired through `startSync` — invoke orchestrator directly from Settings if implemented.

## Related files

- `src/stores/sync-store.ts`
- `src/services/sync-orchestrator.ts`
- `app/settings.tsx`

*Last verified against code: 2026-06-01*
