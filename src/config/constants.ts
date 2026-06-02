export const DB_NAME = 'champions_dex.db';

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
export const PIKALYTICS_AI_BASE_URL = 'https://www.pikalytics.com/ai/pokedex/championstournaments';
export const PIKALYTICS_AI_INDEX_URL = 'https://www.pikalytics.com/ai/pokedex/championstournaments';
export const PIKALYTICS_CDN_BASE = 'https://cdn.pikalytics.com/images/championssprites';


export const SYNC_CONFIG = {
  RATE_LIMIT_DELAY: 250, // ms
  RETRY_ATTEMPTS: 3,
};

export const META_SYNC_CONFIG = {
  /** Minimum days between automatic meta syncs */
  SYNC_INTERVAL_DAYS: 7,
  /** Minimum usage % to store — 0 means store everything Pikalytics returns */
  MIN_USAGE_PCT: 5,
  /** Rate limit delay for Pikalytics calls */
  RATE_LIMIT_DELAY: 300, // ms — slightly more conservative than PokeAPI
};

