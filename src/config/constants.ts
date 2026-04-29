export const DB_NAME = 'champions_dex.db';

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
export const SEREBII_BASE_URL = 'https://www.serebii.net/pokemonchampions';
export const PIKALYTICS_AI_BASE_URL = 'https://www.pikalytics.com/ai/pokedex/championstournaments';

export const SYNC_CONFIG = {
  RATE_LIMIT_DELAY: 250, // ms
  RETRY_ATTEMPTS: 3,
};

export const META_SYNC_CONFIG = {
  /** Minimum days between automatic meta syncs */
  SYNC_INTERVAL_DAYS: 7,
  /** Minimum usage % to store (entries below this are ignored) */
  MIN_USAGE_PCT: 15,
  /** Rate limit delay for Pikalytics calls */
  RATE_LIMIT_DELAY: 300, // ms — slightly more conservative than PokeAPI
};
