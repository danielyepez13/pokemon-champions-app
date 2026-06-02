# Meta flags

## Purpose

Classify moves and abilities into tactical categories for automated battle alerts when combined with Pikalytics usage data.

## Move flags (`META_MOVE_FLAGS`)

Categories include:

- `speed_control` — Tailwind, Trick Room, Icy Wind, etc.
- `spread_protection` — Wide Guard, Quick Guard
- `redirection` — Follow Me, Rage Powder, Ally Switch
- `priority` — Fake Out, Extreme Speed, etc.
- `status`, `setup`, `protection`, weather moves, and more

`getMoveFlags(moveName)` normalizes name and returns flag keys.

`MOVE_FLAG_ICONS` supplies UI icon and label per flag.

## Ability flags

Examples:

- `anti_intimidate` — Clear Body, Inner Focus, etc.
- `weather_setter`, `terrain_setter` — for synergy alerts

`getAbilityFlags(abilityName)` returns matching flags.

`ABILITY_FLAG_ICONS` for alert presentation.

## Alert integration

`generateAlerts` ignores `protection` move flag (too common). Severity:

- `speed_control`, `redirection` → `warning`
- others often `info`
- `anti_intimidate` → `danger`

## Naming

Registry uses lowercase hyphenated names aligned with PokeAPI/Pikalytics.

## Related files

- `src/utils/meta-flags.ts`
- `src/utils/battle-analysis.ts`

*Last verified against code: 2026-06-01*
