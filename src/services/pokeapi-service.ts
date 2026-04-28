import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import { POKEAPI_BASE_URL, SYNC_CONFIG } from '../config/constants';

const http = rateLimit(axios.create(), { 
  maxRequests: 4, 
  perMilliseconds: 1000 
});

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
          console.log(`Fallback to dexNumber #${dexNumber} for ${name}`);
          const response = await http.get(`${POKEAPI_BASE_URL}/pokemon/${dexNumber}`);
          return response.data;
        } catch (fallbackError) {
          return null;
        }
      }
      return null;
    }
  }

  static async getPokemonSpecies(dexNumber: number) {
    try {
      const response = await http.get(`${POKEAPI_BASE_URL}/pokemon-species/${dexNumber}`);
      return response.data;
    } catch (error) {
      console.warn(`Could not fetch species for #${dexNumber}:`, error);
      return null;
    }
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
