# Settings screen

## Route

`app/settings.tsx` — linked from all tab headers.

## Purpose

App configuration: trigger full sync, clean sync, optional Pikalytics-only refresh, display last sync metadata.

## Data

- `useSyncStore.startSync`
- Direct `SyncOrchestrator.cleanSync` / `syncPikalytics(force)` where wired
- `SyncDAO.getMetadata` for last sync time

## Related documentation

- [sync-overview.md](../services/sync-overview.md)
- [troubleshooting.md](../operations/troubleshooting.md)

## Related files

- `app/settings.tsx`
- `src/stores/sync-store.ts`

*Last verified against code: 2026-06-01*
