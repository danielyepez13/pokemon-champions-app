# Troubleshooting

## Sync fails immediately

**Symptom:** Error event from `syncEvents`, log shows empty Pikalytics index.

**Cause:** `PikalyticsService.fetchIndex()` returned no entries; Phase 2 aborts.

**Actions:**

- Verify network and `PIKALYTICS_AI_INDEX_URL` in `src/config/constants.ts`.
- Retry from Settings; check console `[Sync]` logs.

## Sync slow or timing out

**Cause:** Per-Pokémon delay `META_SYNC_CONFIG.RATE_LIMIT_DELAY` (300 ms) between index entries.

**Actions:** Expected for full index; use `syncPikalytics` for meta-only refresh when Pokédex already exists.

## Pokédex search returns nothing

**Cause:** FTS5 virtual table may not be created on some environments.

**Behavior:** `initDatabase` catches FTS errors; search falls back depending on DAO implementation.

**Actions:** Use name substring filter (queries ≤2 chars use local filter in `pokemon-store`).

## Team import requires internet

**Symptom:** Error listing missing Pokémon names.

**Cause:** `TeamService` pre-flight found species not in DB and `isOnline()` is false.

**Actions:** Connect device, run full sync or import again (on-demand fetch per missing name).

## Battle heatmap empty

**Cause:** No active team or `myTeam` not loaded.

**Actions:** Set an active team in Teams tab, open Battle, call `loadMyTeam`.

## Database reset without losing teams

Use `resetDatabase()` or `SyncOrchestrator.cleanSync()` — drops Pokédex/meta tables, **not** `teams`, `team_members`, `member_moves`.

## Clean reinstall of game data

`SyncOrchestrator.cleanSync()` → `resetDatabase()` then `startSync()`.

## Related files

- `src/services/sync-orchestrator.ts`
- `src/database/database.ts`
- `src/services/team-service.ts`
- `src/stores/pokemon-store.ts`

*Last verified against code: 2026-06-01*
