# Settings screen

## Route

`app/settings.tsx` — linked from all tab headers.

## Purpose

App configuration: trigger full sync, clean sync, Pikalytics-only meta refresh, display last sync metadata.

## Data

- `useSyncStore.cleanSync`, `syncMeta`, `resetStatus`
- Progress modal bound to `status === 'syncing'` from store
- `SyncDAO.getMetadata` for last sync time (loaded locally on mount)

## Sync UX

Settings watches `status` transitions from `syncing` to show success/error alerts, then calls `resetStatus()` on dismiss.

## Related documentation

- [sync-overview.md](../services/sync-overview.md)
- [sync-store.md](../stores/sync-store.md)
- [troubleshooting.md](../operations/troubleshooting.md)

## Related files

- `app/settings.tsx`
- `src/stores/sync-store.ts`

*Last verified against code: 2026-06-01*
