# Team detail screen

## Route

`app/team-detail.tsx`

## Purpose

View and edit a saved team: member order, sets, moves; may use draggable list for reorder.

## Data

- `TeamDAO` load/update members
- `react-native-draggable-flatlist` for reorder UX (dependency in package.json)

## Navigation

From Teams screen with team identifier (query param or route param per implementation).

## Related files

- `app/team-detail.tsx`
- `src/database/dao/team.dao.ts`

*Last verified against code: 2026-06-01*
