import axios from 'axios';
import * as cheerio from 'cheerio';
import { SEREBII_BASE_URL } from '../config/constants';

export interface ScrapedPokemon {
  dexNumber: number;
  name: string;
  types: string[];
  spriteUrl: string;
}

export class SerebiiScraper {
  static async fetchPokemonList(): Promise<ScrapedPokemon[]> {
    try {
      const response = await axios.get(`${SEREBII_BASE_URL}/pokemon.shtml`);
      const $ = cheerio.load(response.data);
      const pokemonList: ScrapedPokemon[] = [];

      $('.tab tr').each((i, el) => {
        if (i === 0) return; // Skip header

        const cols = $(el).find('td');
        if (cols.length < 4) return;

        const dexNumber = parseInt($(cols[0]).text().replace('#', ''), 10);
        const name = $(cols[1]).text().trim();
        const types: string[] = [];
        $(cols[2]).find('img').each((_, img) => {
          const type = $(img).attr('alt')?.toLowerCase();
          if (type) types.push(type);
        });
        const spriteUrl = $(cols[3]).find('img').attr('src') || '';

        if (!isNaN(dexNumber) && name) {
          pokemonList.push({ dexNumber, name, types, spriteUrl });
        }
      });

      return pokemonList;
    } catch (error) {
      console.error('Error scraping Serebii:', error);
      return [];
    }
  }

  static async fetchItems(): Promise<any[]> {
    try {
      const response = await axios.get(`${SEREBII_BASE_URL}/items.shtml`);
      const $ = cheerio.load(response.data);
      const items: any[] = [];

      $('.dextable tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length < 3) return;

        const name = $(cols[0]).text().trim();
        const effect = $(cols[1]).text().trim();
        const spriteUrl = $(cols[0]).find('img').attr('src') || '';

        if (name && effect) {
          items.push({ name, effect, spriteUrl });
        }
      });

      return items;
    } catch (error) {
      console.error('Error scraping Serebii items:', error);
      return [];
    }
  }
}
