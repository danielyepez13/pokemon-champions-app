# AGENTS.md — Pokémon Champions App

Mobile **React Native + Expo** app for competitive Pokémon (VGC / Champions): offline Pokédex, team import from Showdown paste, item catalog, battle preview, and speed tiers. Data lives in **SQLite**; sync uses **Pikalytics AI** (index + meta) enriched with **PokeAPI**. Module details are in [`docs/`](docs/) — do not duplicate long specs here.

## Stack

- **Expo** ~54.0.33 · **React Native** 0.81.5 · **React** 19.1.0
- **expo-router** ~6.0.23 · **TypeScript** ~5.9.2
- **expo-sqlite** ~16.0.10 (FTS5 when supported)
- **Zustand** ^5.0.12 · **axios** + **axios-rate-limit**
- **cheerio** (Serebii) · **reanimated** / **gesture-handler** · **expo-image**

## Documentation

Full index and code→doc mapping: [`docs/README.md`](docs/README.md).

### Architecture

- [Overview](docs/architecture/overview.md)
- [Data flow](docs/architecture/data-flow.md)
- [Navigation](docs/architecture/navigation.md)

### Operations

- [Dev setup](docs/operations/dev-setup.md)
- [Troubleshooting](docs/operations/troubleshooting.md)

### App (expo-router)

- [Routing](docs/app/routing.md)
- [Pokedex screen](docs/app/screens-pokedex.md)
- [Teams screen](docs/app/screens-teams.md)
- [Items screen](docs/app/screens-items.md)
- [Battle screen](docs/app/screens-battle.md)
- [Speed Tiers screen](docs/app/screens-speed-tiers.md)
- [Pokémon detail](docs/app/screen-pokemon-detail.md)
- [Team detail](docs/app/screen-team-detail.md)
- [Settings](docs/app/screen-settings.md)

### Database

- [Schema](docs/database/schema.md)
- [Migrations](docs/database/migrations.md)
- [DAOs](docs/database/daos.md)

### Services

- [Sync overview](docs/services/sync-overview.md)
- [Sync phase: items](docs/services/sync-phase-items.md)
- [Sync phase: Pokédex](docs/services/sync-phase-pokedex.md)
- [PokeAPI](docs/services/pokeapi.md)
- [Pikalytics](docs/services/pikalytics.md)
- [Pokepaste parser](docs/services/pokepaste-parser.md)
- [Team import](docs/services/team-import.md)
- [Serebii scraper](docs/services/serebii-scraper.md)
- [Images](docs/services/images.md)

### Battle engine

- [Overview](docs/battle/overview.md)
- [Battle analysis](docs/battle/battle-analysis.md)
- [Type chart](docs/battle/type-chart.md)
- [Stat calculator](docs/battle/stat-calculator.md)
- [Meta flags](docs/battle/meta-flags.md)
- [Battle UI components](docs/battle/ui-components.md)

### Stores

- [Overview](docs/stores/overview.md)
- [Pokémon store](docs/stores/pokemon-store.md)
- [Battle store](docs/stores/battle-store.md)
- [Sync store](docs/stores/sync-store.md)

### Models, UI, config

- [Domain models](docs/models/domain-models.md)
- [UI components](docs/ui/components.md)
- [Theming](docs/ui/theming.md)
- [Constants](docs/config/constants.md)

## Code conventions

- **Imports:** `@/` alias (`@/src/...`, `@/components/...`)
- **DAOs:** static methods on classes in `src/database/dao/`
- **UI:** `components/Themed.tsx` for themed `Text`/`View`; colors in `constants/Colors.ts`
- **Theme:** dark base `#050505`, gold accent `#d4af37`
- **User teams:** survive `resetDatabase()` — never drop `teams` / `team_members` without explicit product decision
- **Champions rules:** 32 max EVs per stat in battle/speed analysis (not 252 singles)
- **Meta threshold:** `MIN_USAGE_PCT` = 5 in full sync (see config doc)

## Scripts

```bash
npm run start    # Expo dev server
npm run android
npm run ios
npm run web
```

## Agent note

When changing behavior, update the matching files under `docs/` and links here if you add modules. See `.cursor/rules/documentation-sync.mdc`.
