# Documentation

English module documentation for the Pokémon Champions competitive app. The agent index lives in [`AGENTS.md`](../AGENTS.md) at the repository root.

## How to read

1. Start with [architecture/overview.md](architecture/overview.md) for stack and layers.
2. Follow [architecture/data-flow.md](architecture/data-flow.md) for sync and UI data paths.
3. Drill into the module folder that matches the code you are changing.

## Code → documentation mapping

| Code path | Primary documentation |
|-----------|------------------------|
| `app/_layout.tsx`, `app/+html.tsx` | [app/routing.md](app/routing.md) |
| `app/(tabs)/**` | [app/routing.md](app/routing.md), per-screen `app/screens-*.md` |
| `app/pokemon/[id].tsx` | [app/screen-pokemon-detail.md](app/screen-pokemon-detail.md) |
| `app/team-detail.tsx` | [app/screen-team-detail.md](app/screen-team-detail.md) |
| `app/settings.tsx` | [app/screen-settings.md](app/screen-settings.md) |
| `src/database/database.ts` | [database/schema.md](database/schema.md), [database/migrations.md](database/migrations.md) |
| `src/database/dao/**` | [database/daos.md](database/daos.md) |
| `src/services/sync-orchestrator.ts` | [services/sync-overview.md](services/sync-overview.md), [services/sync-phase-*.md](services/) |
| `src/services/pokeapi-service.ts` | [services/pokeapi.md](services/pokeapi.md) |
| `src/services/pikalytics-service.ts` | [services/pikalytics.md](services/pikalytics.md) |
| `src/services/pokepaste-parser.ts` | [services/pokepaste-parser.md](services/pokepaste-parser.md) |
| `src/services/team-service.ts` | [services/team-import.md](services/team-import.md) |
| `src/services/image-downloader.ts` | [services/images.md](services/images.md) |
| `src/utils/battle-analysis.ts` | [battle/battle-analysis.md](battle/battle-analysis.md) |
| `src/utils/type-chart.ts` | [battle/type-chart.md](battle/type-chart.md) |
| `src/utils/stat-calculator.ts` | [battle/stat-calculator.md](battle/stat-calculator.md) |
| `src/utils/meta-flags.ts` | [battle/meta-flags.md](battle/meta-flags.md) |
| `src/components/battle/**` | [battle/ui-components.md](battle/ui-components.md) |
| `src/stores/**` | [stores/*.md](stores/) |
| `src/models/**` | [models/domain-models.md](models/domain-models.md) |
| `src/components/*.tsx` (non-battle) | [ui/components.md](ui/components.md) |
| `constants/Colors.ts`, `components/Themed.tsx` | [ui/theming.md](ui/theming.md) |
| `src/config/constants.ts` | [config/constants.md](config/constants.md) |
| `package.json` scripts | [operations/dev-setup.md](operations/dev-setup.md) |

When adding a new top-level folder under `src/` or `app/`, add matching doc file(s), a row in this table, and links in `AGENTS.md`.

## Doc quality checklist

Each module doc should include where relevant:

1. **Purpose** — user-facing feature supported
2. **Entry points** — screens, stores, public APIs
3. **Data in/out** — tables, API shapes, events
4. **Sequence diagram** — mermaid for multi-step flows
5. **Edge cases** — failures, offline behavior, fallbacks
6. **Related files** — maintenance map
7. **Last verified** — date at bottom when updated against code
