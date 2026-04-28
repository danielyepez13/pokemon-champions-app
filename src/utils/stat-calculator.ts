import { NatureEffect, NatureStat } from './natures';

/**
 * Calculates the final stat value at Level 50 (VGC standard).
 *
 * HP formula:
 *   floor((2 * base + iv + floor(ev / 4)) * 50 / 100) + 50 + 10
 *
 * Other stats formula:
 *   floor((floor((2 * base + iv + floor(ev / 4)) * 50 / 100) + 5) * nature_modifier)
 *
 * @param statKey   - EV key: 'HP' | 'Atk' | 'Def' | 'SpA' | 'SpD' | 'Spe'
 * @param base      - Base stat value from the Pokémon DB
 * @param ev        - EV investment (0–32 in VGC, max 252 in singles)
 * @param iv        - IV value (0–31, defaults to 31 if not provided)
 * @param nature    - NatureEffect object { up, down }
 */
export function calcStat(
    statKey: string,
    base: number,
    ev: number,
    iv: number = 31,
    nature: NatureEffect = { up: null, down: null }
): number {
    const isHp = statKey === 'HP';

    // Core calculation (shared between HP and other stats)
    const core = Math.floor((2 * base + iv + Math.floor(ev / 4)) * 50 / 100);

    if (isHp) {
        return core + 50 + 10; // + Level + 10
    }

    // Nature modifier
    let mod = 1.0;
    if (nature.up === statKey)   mod = 1.1;
    if (nature.down === statKey) mod = 0.9;

    return Math.floor((core + 5) * mod);
}

/**
 * Maps EV/stat keys to their corresponding DB column names.
 */
export const DB_STAT_MAP: Record<string, string> = {
    HP:  'hp',
    Atk: 'attack',
    Def: 'defense',
    SpA: 'sp_attack',
    SpD: 'sp_defense',
    Spe: 'speed',
};

/** The canonical display order for stats. */
export const STAT_ORDER = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'] as const;

export const STAT_LABELS: Record<string, string> = {
    HP: 'HP', Atk: 'ATK', Def: 'DEF', SpA: 'SpA', SpD: 'SpD', Spe: 'SPE',
};
