# Navigation

## Purpose

Describe the expo-router file-based route tree and how users move between tabs and stack screens.

## Route tree

```mermaid
flowchart TD
  Root[app/_layout Stack]
  Tabs[app/(tabs) Tabs]
  Root --> Tabs
  Root --> PokemonDetail["app/pokemon/[id]"]
  Root --> TeamDetail[app/team-detail]
  Root --> Settings[app/settings]
  Tabs --> Pokedex["index.tsx Pokedex"]
  Tabs --> Teams[teams.tsx]
  Tabs --> Battle[battle.tsx]
  Tabs --> SpeedTiers[speed-tiers.tsx]
```

## Tab bar order

Defined in `app/(tabs)/_layout.tsx` (display order):

1. **Pokedex** — `index.tsx`, icon search
2. **Teams** — `teams.tsx`, icon group
3. **Battle** — `battle.tsx`, MaterialCommunityIcons pokeball
4. **Speed Tiers** — `speed-tiers.tsx`, icon tachometer

Each tab header includes a **Settings** link (`/settings`) via `headerRight`.

## Root layout

- `app/_layout.tsx`: fonts, `initDatabase()`, `ThemeProvider`, `Stack` with `(tabs)` as primary child.
- `unstable_settings.initialRouteName`: `'(tabs)'`.
- Stack currently registers only `(tabs)` explicitly; other routes are file-discovered by expo-router.

## Deep links and params

| Route | Params |
|-------|--------|
| `/pokemon/[id]` | `id` — Pokémon primary key in SQLite |
| `/team-detail` | Query params for team id (see screen implementation) |

## Platform notes

- `useClientOnlyValue` toggles `headerShown` on tabs to avoid web hydration issues.
- `react-native-reanimated` imported at root for gesture/animation support.

## Related files

- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/*.tsx`
- `app/pokemon/[id].tsx`
- `app/team-detail.tsx`
- `app/settings.tsx`

See also [app/routing.md](../app/routing.md).

*Last verified against code: 2026-06-01*
