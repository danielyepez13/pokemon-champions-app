import { POKEMON_IMAGES, ITEM_IMAGES } from './image-mapping';

/**
 * Maps a form string from the DB to the suffix used in POKEMON_IMAGES.
 * e.g. 'hisui' → '-h', 'mega-x' → '-mx', '' → ''
 */
const FORM_SUFFIX_MAP: Record<string, string> = {
    'mega-x':    '-mx',
    'mega-y':    '-my',
    'mega':      '-m',
    'hisui':     '-h',
    'hisuian':   '-h',
    'alola':     '-a',
    'alolan':    '-a',
    'galar':     '-g',
    'galarian':  '-g',
    'paldea':    '-p',
    'paldean':   '-p',
    '':          '',
};

/**
 * Resolves the local image asset for a Pokémon.
 * Falls back to `spriteUrl` (PokeAPI URL) if no local image found.
 */
export function resolvePokemonSprite(
    dexNumber: number,
    form: string,
    spriteUrl?: string | null
): any | null {
    const paddedDex = String(dexNumber).padStart(3, '0');
    const rawForm = (form ?? '').toLowerCase().trim();
    const suffix = FORM_SUFFIX_MAP[rawForm] ?? '';
    const key = `${paddedDex}${suffix}`;

    if (POKEMON_IMAGES[key]) {
        return POKEMON_IMAGES[key];
    }

    // Fallback: try base form without suffix
    if (suffix && POKEMON_IMAGES[paddedDex]) {
        return POKEMON_IMAGES[paddedDex];
    }

    // Fallback: remote URL from PokeAPI stored in DB
    if (spriteUrl) {
        return { uri: spriteUrl };
    }

    return null;
}

/**
 * Resolves the local image asset for an item.
 * Key format: lowercase, no spaces, no apostrophes, no hyphens.
 * e.g. 'Choice Scarf' → 'choicescarf', "King's Rock" → 'kingsrock'
 */
export function resolveItemSprite(itemName: string): any | null {
    if (!itemName) return null;
    const key = itemName
        .toLowerCase()
        .replace(/['\s\-]/g, '');
    return ITEM_IMAGES[key] ?? null;
}
