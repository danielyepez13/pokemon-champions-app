# Theming

## Purpose

Visual consistency: dark competitive aesthetic with gold accents.

## Colors

`constants/Colors.ts` — light/dark palettes; tab tint from `Colors[colorScheme].tint`.

## Brand tokens (convention)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#050505` | App dark base |
| Accent | `#d4af37` | Highlights, competitive gold |

## Navigation theme

Root layout uses `@react-navigation/native` `DarkTheme` / `DefaultTheme` based on `useColorScheme()`.

## Components

Use `Themed.Text` and `Themed.View` from `@/components/Themed` for automatic color role (`text`, `background`).

## Type colors

`src/utils/colors.ts` maps Pokémon types to display colors for badges.

## Related files

- `constants/Colors.ts`
- `components/Themed.tsx`
- `app/_layout.tsx`
- `src/utils/colors.ts`

*Last verified against code: 2026-06-01*
