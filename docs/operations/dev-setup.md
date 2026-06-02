# Development setup

## Prerequisites

- Node.js (LTS recommended)
- npm
- Expo Go or Android/iOS simulator for device testing
- Laragon or similar if serving web locally on Windows (optional)

## Install

```bash
cd pokemon-champions-app
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Expo dev server (QR / emulator) |
| `npm run android` | Expo start with Android target |
| `npm run ios` | Expo start with iOS target |
| `npm run web` | Expo start for web |

Entry point: `expo-router/entry` (`package.json` `main`).

## Path aliases

TypeScript paths use `@/` for:

- `@/src/...` — application source
- `@/components/...` — shared Expo template components

## First run

1. Start the dev server.
2. On first launch, root layout runs `initDatabase()` — creates `champions_dex.db`.
3. Open **Settings** or **Items** and run a full sync to populate Pokédex (requires network).

## Documentation for agents

- Index: [`AGENTS.md`](../../AGENTS.md)
- Module docs: [`docs/README.md`](../README.md)

## Related files

- `package.json`
- `app.json` / `tsconfig.json` (if present)
- `app/_layout.tsx`

*Last verified against code: 2026-06-01*
