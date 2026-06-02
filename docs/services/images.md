# Image downloader

## Purpose

Download Pikalytics CDN sprites and store as Base64 in SQLite for offline display in Pokédex and battle UI.

## CDN

`PIKALYTICS_CDN_BASE` + resolved filename per display name.

## Key function

`downloadPikalyticsSpriteAsBase64(displayName)` returns:

| Field | Meaning |
|-------|---------|
| `sprite` | Base64 data URI or raw Base64 string for DB |
| `usedFallback` | true if alternate URL/form suffix was used |

## Integration

- Full sync Phase 2: every index Pokémon
- `fetchAndStoreSinglePokemon`: on-demand import
- `expo-image` consumes stored values in UI components

## Fallback behavior

When primary CDN path fails, resolver tries alternate form suffixes (documented in implementation — mega, regional, etc.).

## Related files

- `src/services/image-downloader.ts`
- `src/utils/image-mapping.ts`
- `src/utils/team-sprite-resolver.ts`
- `src/config/constants.ts`

*Last verified against code: 2026-06-01*
