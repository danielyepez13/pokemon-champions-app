# Teams screen

## Route

`app/(tabs)/teams.tsx` — tab title **Teams**.

## Purpose

List user teams, set active team, import from Pokepaste modal, open team detail.

## Data

- `TeamDAO` for list/create/active flag
- `TeamService.importFromPokepaste` for paste import
- Navigation to `team-detail` with team id

## Edge cases

- Import may require network for missing species (see [team-import.md](../services/team-import.md))
- Only one team should be active for battle preview

## Related files

- `app/(tabs)/teams.tsx`
- `src/services/team-service.ts`
- `app/team-detail.tsx`

*Last verified against code: 2026-06-01*
