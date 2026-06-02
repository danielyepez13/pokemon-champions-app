# Sync store

## Purpose

Single source of truth for sync progress and triggers. Subscribes to `syncEvents` from `SyncOrchestrator`; screens read state and call store actions — they do not subscribe to `syncEvents` directly.

## State

| Field | Values |
|-------|--------|
| `status` | `'idle' \| 'syncing' \| 'done' \| 'error'` |
| `mode` | `'full' \| 'meta' \| null` — operation running or last completed |
| `phase` | `'pokeapi' \| 'pikalytics' \| null` |
| `progress` | `{ current, total }` |
| `error` | string \| null |

## Actions

| Action | Description |
|--------|-------------|
| `startSync` | Full Pokédex sync via `SyncOrchestrator.startSync()` |
| `cleanSync` | `resetDatabase()` then full sync |
| `syncMeta(force?)` | Pikalytics meta-only refresh (`syncPikalytics`) |
| `resetStatus` | Return to idle after UI acknowledges done/error |

## Event wiring

Registered at store creation:

- `progress` → update status, phase, progress
- `complete` → `status: 'done'`, preserve `mode` for success alerts
- `error` → `status: 'error'`, message

## Consumers

- **Settings** — `cleanSync`, `syncMeta`; progress modal bound to `status === 'syncing'`
- **Pokédex empty state** — `startSync`; reloads list when `status === 'done'`

## Related files

- `src/stores/sync-store.ts`
- `src/services/sync-orchestrator.ts`
- `app/settings.tsx`
- `app/(tabs)/index.tsx`

*Last verified against code: 2026-06-01*
