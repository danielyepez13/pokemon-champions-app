# App routing

## Purpose

expo-router file-based routes under `app/`. See [architecture/navigation.md](../architecture/navigation.md) for the route diagram.

## Root (`app/_layout.tsx`)

- Loads fonts (SpaceMono, FontAwesome)
- `initDatabase()` on mount
- `Stack` with `(tabs)` — `headerShown: false` for tab group
- `ErrorBoundary` re-exported from expo-router
- `unstable_settings.initialRouteName`: `(tabs)`

## Tab group (`app/(tabs)/_layout.tsx`)

`Tabs` navigator with five screens — see individual screen docs.

## Stack screens (siblings to tabs)

| File | Route |
|------|-------|
| `pokemon/[id].tsx` | `/pokemon/:id` |
| `team-detail.tsx` | `/team-detail` |
| `settings.tsx` | `/settings` |

## Conventions

- Settings linked from tab `headerRight` via `<Link href="/settings">`
- Use `@/` imports for shared code

## Related files

- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`

*Last verified against code: 2026-06-01*
