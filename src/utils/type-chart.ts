/**
 * Pokémon Type Effectiveness Chart (Gen 6+ / 18 types including Fairy).
 *
 * Only NON-1x multipliers are stored. Any lookup not found defaults to 1x.
 * Key = attacking type, Value = Record of defending type → multiplier.
 *
 * Multipliers: 2 = super effective, 0.5 = not very effective, 0 = immune.
 * For dual-type defenders, multiply the individual multipliers (can yield 4x, 0.25x, etc.).
 */

export const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type PokemonType = typeof ALL_TYPES[number];

/**
 * Effectiveness map: ATTACKING_TYPE → { DEFENDING_TYPE → multiplier }.
 * Only entries that differ from 1x are listed.
 */
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: {
    rock: 0.5, steel: 0.5, ghost: 0,
  },
  fire: {
    fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2,
  },
  water: {
    fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5,
  },
  electric: {
    water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5,
  },
  grass: {
    fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5,
  },
  ice: {
    fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5,
  },
  fighting: {
    normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5,
  },
  poison: {
    grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2,
  },
  ground: {
    fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2,
  },
  flying: {
    electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5,
  },
  psychic: {
    fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5,
  },
  bug: {
    fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5,
  },
  rock: {
    fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5,
  },
  ghost: {
    normal: 0, psychic: 2, ghost: 2, dark: 0.5,
  },
  dragon: {
    dragon: 2, steel: 0.5, fairy: 0,
  },
  dark: {
    fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5,
  },
  steel: {
    fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2,
  },
  fairy: {
    fire: 0.5, poison: 0.5, fighting: 2, dragon: 2, dark: 2, steel: 0.5,
  },
};

// ─── Core Functions ──────────────────────────────────────────────

/**
 * Returns the raw multiplier for a single attacking type vs a single defending type.
 */
export function getSingleTypeMultiplier(attackType: string, defendType: string): number {
  const atk = attackType.toLowerCase();
  const def = defendType.toLowerCase();
  return TYPE_CHART[atk]?.[def] ?? 1;
}

/**
 * Returns the combined multiplier for an attacking type vs a defender with 1-2 types.
 * Handles dual-type multiplication (e.g., Fire vs Grass/Steel = 2 × 2 = 4).
 *
 * @param attackType  - The type of the attacking move
 * @param defenderTypes - Array of 1 or 2 types of the defending Pokémon
 * @returns multiplier: 0, 0.25, 0.5, 1, 2, or 4
 */
export function getEffectiveness(attackType: string, defenderTypes: string[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    multiplier *= getSingleTypeMultiplier(attackType, defType);
  }
  return multiplier;
}

// ─── Defensive Analysis ──────────────────────────────────────────

export interface DefensiveProfile {
  /** Types that deal 2x or 4x damage */
  weakTo: { type: string; multiplier: number }[];
  /** Types that deal 0.5x or 0.25x damage */
  resistsTo: { type: string; multiplier: number }[];
  /** Types that deal 0x damage */
  immuneTo: string[];
  /** Types that deal 1x damage */
  neutralTo: string[];
}

/**
 * Computes the full defensive profile for a Pokémon with the given types.
 * Shows what types are super effective, resisted, or immune against it.
 *
 * @param defenderTypes - Array of 1 or 2 types
 */
export function getDefensiveProfile(defenderTypes: string[]): DefensiveProfile {
  const weakTo: DefensiveProfile['weakTo'] = [];
  const resistsTo: DefensiveProfile['resistsTo'] = [];
  const immuneTo: string[] = [];
  const neutralTo: string[] = [];

  for (const atkType of ALL_TYPES) {
    const mult = getEffectiveness(atkType, defenderTypes);
    if (mult === 0) {
      immuneTo.push(atkType);
    } else if (mult > 1) {
      weakTo.push({ type: atkType, multiplier: mult });
    } else if (mult < 1) {
      resistsTo.push({ type: atkType, multiplier: mult });
    } else {
      neutralTo.push(atkType);
    }
  }

  // Sort weaknesses by severity (4x before 2x)
  weakTo.sort((a, b) => b.multiplier - a.multiplier);
  // Sort resistances by strength (0.25x before 0.5x)
  resistsTo.sort((a, b) => a.multiplier - b.multiplier);

  return { weakTo, resistsTo, immuneTo, neutralTo };
}

// ─── Offensive Analysis ──────────────────────────────────────────

export interface OffensiveMatchup {
  /** The attacking type */
  type: string;
  /** The resulting multiplier against the target */
  multiplier: number;
}

/**
 * Given a set of attacking types (your STAB types), returns what each one
 * does against a specific defender's types.
 *
 * @param attackerTypes - Your Pokémon's types (STAB sources)
 * @param defenderTypes - The rival Pokémon's types
 */
export function getStabMatchup(
  attackerTypes: string[],
  defenderTypes: string[]
): OffensiveMatchup[] {
  return attackerTypes.map(atkType => ({
    type: atkType,
    multiplier: getEffectiveness(atkType, defenderTypes),
  }));
}

/**
 * Quick check: does at least one of the attacker's STAB types hit the
 * defender super-effectively (2x or 4x)?
 */
export function hasStabAdvantage(
  attackerTypes: string[],
  defenderTypes: string[]
): boolean {
  return attackerTypes.some(
    atkType => getEffectiveness(atkType, defenderTypes) >= 2
  );
}

/**
 * Quick check: is the defender super-effective against the attacker
 * with at least one STAB?
 */
export function isThreatenedBy(
  myTypes: string[],
  rivalTypes: string[]
): boolean {
  return rivalTypes.some(
    rivalType => getEffectiveness(rivalType, myTypes) >= 2
  );
}

// ─── Matchup Score ───────────────────────────────────────────────

/**
 * Computes a simple matchup score between two Pokémon based purely on types.
 *
 * Score > 0 = favorable, Score < 0 = unfavorable, Score ≈ 0 = neutral.
 *
 * Formula:
 *   bestOffensiveMultiplier - bestRivalOffensiveMultiplier
 *   (on a log2 scale so 4x = +2, 2x = +1, 1x = 0, 0.5x = -1, 0.25x = -2)
 *
 * @param myTypes    - Your Pokémon's types
 * @param rivalTypes - Rival Pokémon's types
 */
export function getMatchupScore(myTypes: string[], rivalTypes: string[]): number {
  // Best I can do to the rival (offensive)
  let bestOffense = 0;
  for (const myType of myTypes) {
    const mult = getEffectiveness(myType, rivalTypes);
    const score = mult > 0 ? Math.log2(mult) : -4; // Immunity = very bad offensively
    if (score > bestOffense) bestOffense = score;
  }

  // Best the rival can do to me (defensive threat)
  let bestThreat = 0;
  for (const rivalType of rivalTypes) {
    const mult = getEffectiveness(rivalType, myTypes);
    const score = mult > 0 ? Math.log2(mult) : -4;
    if (score > bestThreat) bestThreat = score;
  }

  return bestOffense - bestThreat;
}

/**
 * Categorizes a matchup score into a human-readable label.
 */
export type MatchupLabel = 'dominant' | 'favorable' | 'neutral' | 'unfavorable' | 'dangerous';

export function getMatchupLabel(score: number): MatchupLabel {
  if (score >= 2) return 'dominant';     // I hit 4x, rival hits 1x or less
  if (score >= 1) return 'favorable';    // I hit 2x+, rival doesn't threaten
  if (score > -1) return 'neutral';      // Roughly even
  if (score > -2) return 'unfavorable';  // Rival threatens me
  return 'dangerous';                     // Rival hits 4x, I can't hit back
}
