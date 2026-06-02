# Database migrations

## Purpose

Document schema evolution strategy: inline migrations in `initDatabase()` rather than a separate migration runner.

## Singleton connection

- `getDatabase()` opens `champions_dex.db` once and caches in module-level `db`.
- `PRAGMA foreign_keys = ON` on open.

## Runtime migrations (pokemon)

On init, `PRAGMA table_info(pokemon)` checks and adds if missing:

- `description`
- `form` (default `''`)
- `is_mega`
- `usage_pct`
- `usage_rank`

## Runtime migrations (team_members)

Adds `team_order` if missing, then:

```sql
UPDATE team_members SET team_order = slot WHERE team_order = 0;
```

## Table creation

All tables use `CREATE TABLE IF NOT EXISTS` in a statement array executed sequentially. Errors on individual statements are logged but do not stop the loop.

## FTS5

Created after base tables in a separate try/catch. Failure logs a warning — app continues without full-text search.

## resetDatabase()

**Drops:** pokemon graph, items, abilities, moves, meta_*, sync_*, FTS.

**Preserves:** `teams`, `team_members`, `member_moves`.

Flow:

1. `PRAGMA foreign_keys = OFF`
2. DROP listed tables
3. `PRAGMA foreign_keys = ON`
4. `initDatabase()` to recreate schema

Used by `SyncOrchestrator.cleanSync()`.

## Manual dev reset

Commented `DROP TABLE` lines in `getDatabase()` can be uncommented for destructive local debugging (not for production builds).

## Related files

- `src/database/database.ts`
- `src/services/sync-orchestrator.ts` (`cleanSync`)

*Last verified against code: 2026-06-01*
