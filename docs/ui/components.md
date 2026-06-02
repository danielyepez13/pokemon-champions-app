# UI components

## Purpose

Reusable presentation components outside the battle-specific folder.

## Shared components

| Component | Path | Role |
|-----------|------|------|
| `pokemon-card` | `src/components/pokemon-card.tsx` | List tile for Pokédex |
| `type-badge` | `src/components/type-badge.tsx` | Type chips with colors from `src/utils/colors.ts` |
| `Themed` | `components/Themed.tsx` | Themed `Text` / `View` (Expo template) |
| `useColorScheme` | `components/useColorScheme.ts` | Light/dark detection |
| `useClientOnlyValue` | `components/useClientOnlyValue.ts` | SSR-safe defaults for web |

## Battle components

Documented in [battle/ui-components.md](../battle/ui-components.md).

## Images

Prefer `expo-image` for sprite rendering (performance vs. legacy `Image`).

## Related files

- `src/components/*.tsx`
- `components/Themed.tsx`

*Last verified against code: 2026-06-01*
