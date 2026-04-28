/**
 * All 25 Pokémon natures with their stat modifiers.
 * 'up' = stat boosted by 10% (x1.1)
 * 'down' = stat reduced by 10% (x0.9)
 * null = neutral (no modifier)
 *
 * Stat keys match the EV JSON keys: 'Atk' | 'Def' | 'SpA' | 'SpD' | 'Spe'
 */
export type NatureStat = 'Atk' | 'Def' | 'SpA' | 'SpD' | 'Spe';

export interface NatureEffect {
    up: NatureStat | null;
    down: NatureStat | null;
}

export const NATURES: Record<string, NatureEffect> = {
    // --- Neutral (no modifier) ---
    Hardy:   { up: null,    down: null   },
    Docile:  { up: null,    down: null   },
    Serious: { up: null,    down: null   },
    Bashful: { up: null,    down: null   },
    Quirky:  { up: null,    down: null   },

    // --- Attack boosted ---
    Lonely:  { up: 'Atk',  down: 'Def'  },
    Brave:   { up: 'Atk',  down: 'Spe'  },
    Adamant: { up: 'Atk',  down: 'SpA'  },
    Naughty: { up: 'Atk',  down: 'SpD'  },

    // --- Defense boosted ---
    Bold:    { up: 'Def',  down: 'Atk'  },
    Relaxed: { up: 'Def',  down: 'Spe'  },
    Impish:  { up: 'Def',  down: 'SpA'  },
    Lax:     { up: 'Def',  down: 'SpD'  },

    // --- Speed boosted ---
    Timid:   { up: 'Spe',  down: 'Atk'  },
    Hasty:   { up: 'Spe',  down: 'Def'  },
    Jolly:   { up: 'Spe',  down: 'SpA'  },
    Naive:   { up: 'Spe',  down: 'SpD'  },

    // --- Sp. Attack boosted ---
    Modest:  { up: 'SpA',  down: 'Atk'  },
    Mild:    { up: 'SpA',  down: 'Def'  },
    Quiet:   { up: 'SpA',  down: 'Spe'  },
    Rash:    { up: 'SpA',  down: 'SpD'  },

    // --- Sp. Defense boosted ---
    Calm:    { up: 'SpD',  down: 'Atk'  },
    Gentle:  { up: 'SpD',  down: 'Def'  },
    Sassy:   { up: 'SpD',  down: 'Spe'  },
    Careful: { up: 'SpD',  down: 'SpA'  },
};

/** Returns the nature effect for a given name, or neutral if not found. */
export function getNature(name: string | null | undefined): NatureEffect {
    if (!name) return { up: null, down: null };
    return NATURES[name] ?? { up: null, down: null };
}
