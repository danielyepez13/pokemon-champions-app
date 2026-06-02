import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import { POKEAPI_BASE_URL } from '../config/constants';

const http = rateLimit(axios.create(), {
  maxRequests: 4,
  perMilliseconds: 1000,
});

export interface SpeciesFetchResult {
  species: any | null;
  resolvedViaFallback: boolean;
}

export class PokeAPIService {
  static async getPokemonDetail(name: string, dexNumber?: number) {
    try {
      // Try by specific name first (important for megas and variants)
      const slug = name.toLowerCase().replace(' ', '-').replace('.', '');
      const response = await http.get(`${POKEAPI_BASE_URL}/pokemon/${slug}`);
      return response.data;
    } catch (error: any) {
      // Fallback to dexNumber if provided and if the first attempt was a 404
      if (dexNumber && error.response?.status === 404) {
        try {
          console.log(`[PokeAPI] Fallback to dexNumber #${dexNumber} for ${name}`);
          const response = await http.get(`${POKEAPI_BASE_URL}/pokemon/${dexNumber}`);
          return response.data;
        } catch (fallbackError) {
          return null;
        }
      }
      return null;
    }
  }

  static extractResourceId(url: string): number | null {
    const match = url.match(/\/(\d+)\/?$/);
    return match ? parseInt(match[1], 10) : null;
  }

  static getBaseSpeciesName(displayName: string): string {
    return displayName.split('-')[0].toLowerCase();
  }

  private static async fetchSpeciesByIdentifier(
    identifier: number | string,
    displayName: string,
    strategy: string
  ): Promise<any | null> {
    console.log(`[PokeAPI] Species for ${displayName}: trying ${strategy} (${identifier})`);
    try {
      const response = await http.get(`${POKEAPI_BASE_URL}/pokemon-species/${identifier}`);
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 404) {
        console.log(
          `[PokeAPI] Species for ${displayName}: ${strategy} returned 404, trying next`
        );
      } else {
        console.warn(
          `[PokeAPI] Species for ${displayName}: ${strategy} failed (${status ?? error.message})`
        );
      }
      return null;
    }
  }

  static async getPokemonSpeciesForDetail(
    detail: any,
    displayName: string
  ): Promise<SpeciesFetchResult> {
    const strategies: Array<{ strategy: string; identifier: number | string }> = [];

    if (detail.species?.url) {
      const speciesId = this.extractResourceId(detail.species.url);
      if (speciesId !== null) {
        strategies.push({ strategy: 'detail.species.url', identifier: speciesId });
      }
    }

    if (detail.species?.name) {
      strategies.push({ strategy: 'detail.species.name', identifier: detail.species.name });
    }

    const baseName = this.getBaseSpeciesName(displayName);
    strategies.push({ strategy: 'displayName base', identifier: baseName });
    strategies.push({ strategy: 'detail.id', identifier: detail.id });

    for (let i = 0; i < strategies.length; i++) {
      const { strategy, identifier } = strategies[i];
      const species = await this.fetchSpeciesByIdentifier(identifier, displayName, strategy);
      if (species) {
        if (i > 0) {
          console.log(`[PokeAPI] Species for ${displayName}: resolved via ${strategy}`);
        }
        return { species, resolvedViaFallback: i > 0 };
      }
    }

    console.warn(`[PokeAPI] Species for ${displayName}: all strategies failed`);
    return { species: null, resolvedViaFallback: false };
  }

  static async getPokemonSpeciesByName(displayName: string): Promise<SpeciesFetchResult> {
    const baseName = this.getBaseSpeciesName(displayName);
    const species = await this.fetchSpeciesByIdentifier(baseName, displayName, 'displayName base');
    if (species) {
      return { species, resolvedViaFallback: false };
    }

    console.warn(`[PokeAPI] Species for ${displayName}: all strategies failed`);
    return { species: null, resolvedViaFallback: false };
  }

  static async getAbilityDetail(url: string) {
    try {
      const response = await http.get(url);
      return response.data;
    } catch (error) {
      return null;
    }
  }
}
