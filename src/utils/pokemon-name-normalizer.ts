/**
 * Normalizes a Pokémon name from Pokepaste format to the Pikalytics slug format.
 *
 * Pokepaste format examples:
 *   "Jolteon @ Focus Sash"       → "Jolteon"
 *   "Arcanine-Hisui @ Chople"    → "Arcanine-Hisui"
 *   "Froslass (F) @ Froslassite" → "Froslass"
 *   "Garchomp @ Choice Scarf"    → "Garchomp"
 *
 * Pikalytics display name examples: "Jolteon", "Arcanine-Hisui", "Froslass"
 * Pikalytics slug (URL): "jolteon", "arcanine-hisui", "froslass"
 */

/**
 * Extracts the bare Pokémon name from a pokepaste line (the line starting with the name).
 * Handles gender markers `(M)` / `(F)`, item separators ` @ `, and trailing spaces.
 */
export function extractNameFromPokepaste(line: string): string {
  // Remove item part: "Arcanine-Hisui @ Chople Berry" → "Arcanine-Hisui"
  let name = line.split('@')[0].trim();

  // Remove gender markers: "Froslass (F)" → "Froslass"
  name = name.replace(/\s*\([MF]\)\s*/gi, '').trim();

  // Remove trailing whitespace and non-word chars (pokepaste sometimes has trailing spaces)
  name = name.trim();

  return name;
}

/**
 * Converts a display name (as returned by extractNameFromPokepaste or Pikalytics)
 * into the lowercase slug used in Pikalytics URLs.
 *
 * Examples:
 *   "Arcanine-Hisui" → "arcanine-hisui"
 *   "Rotom-Wash"     → "rotom-wash"
 *   "Jolteon"        → "jolteon"
 */
export function toSlug(displayName: string): string {
  return displayName.toLowerCase();
}

/**
 * Converts a pokepaste line to a Pikalytics slug.
 * This is the main entry point for the import flow.
 */
export function pokepasteLineToSlug(line: string): string {
  return toSlug(extractNameFromPokepaste(line));
}

/**
 * Parses a full pokepaste string and returns an array of display names.
 * Handles all standard pokepaste sections (items, abilities, EVs, moves, etc.)
 *
 * A Pokémon block starts with a line that does NOT start with "- ", "Ability:",
 * "Level:", "EVs:", "IVs:", "Shiny:", "Happiness:", "Nature", "Tera Type:",
 * "Dynamax Level:", a blank line, or a known formatting keyword.
 *
 * Example pokepaste lines that ARE Pokémon names:
 *   "Jolteon @ Focus Sash"
 *   "Arcanine-Hisui @ Chople Berry"
 *   "Froslass (F) @ Froslassite"
 */
export function parsePokepaste(pokepaste: string): string[] {
  const SKIP_PREFIXES = [
    '- ',          // move
    'ability:',
    'level:',
    'evs:',
    'ivs:',
    'shiny:',
    'happiness:',
    'nature',      // "Timid Nature", "Adamant Nature" etc.
    'tera type:',
    'dynamax level:',
    'gigantamax:',
  ];

  const names: string[] = [];
  const lines = pokepaste.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    const isSkip = SKIP_PREFIXES.some(p => lower.startsWith(p));
    if (isSkip) continue;

    // Remaining lines that don't match skipped patterns are assumed to be Pokémon name lines
    // (either "Name @ Item" or just "Name")
    const name = extractNameFromPokepaste(line);
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}
