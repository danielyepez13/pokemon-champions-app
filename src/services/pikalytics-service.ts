import axios from 'axios';
import { PIKALYTICS_AI_BASE_URL, META_SYNC_CONFIG } from '../config/constants';

export interface MetaEntry {
  name: string;
  usagePct: number;
}

export interface PokemonMetaData {
  moves: MetaEntry[];
  abilities: MetaEntry[];
  items: MetaEntry[];
}

export interface PikalyticsIndexEntry {
  name: string;
  usagePct: number;
}

/**
 * Delay utility for rate-limiting.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Regex to match Pikalytics markdown entries like:
 *   - **Sucker Punch**: 98.946%
 */
const ENTRY_REGEX = /^- \*\*(.+?)\*\*:\s*(\d+\.?\d*)%/;

/**
 * Parses a section of markdown between two `## ` headers.
 * Returns entries matching the `- **Name**: X.XXX%` pattern.
 */
function parseSection(markdown: string, sectionHeader: string): MetaEntry[] {
  const entries: MetaEntry[] = [];

  // Find the section
  const headerIndex = markdown.indexOf(`## ${sectionHeader}`);
  if (headerIndex === -1) return entries;

  // Get content from after the header to the next ## or end
  const afterHeader = markdown.substring(headerIndex + `## ${sectionHeader}`.length);
  const nextSectionIndex = afterHeader.indexOf('\n## ');
  const sectionContent = nextSectionIndex === -1
    ? afterHeader
    : afterHeader.substring(0, nextSectionIndex);

  const lines = sectionContent.split('\n');
  for (const line of lines) {
    const match = line.trim().match(ENTRY_REGEX);
    if (match) {
      const name = match[1].trim();
      const usagePct = parseFloat(match[2]);
      if (!isNaN(usagePct)) {
        entries.push({ name, usagePct });
      }
    }
  }

  return entries;
}

export class PikalyticsService {
  /**
   * Fetches the Champions tournament index to get the list of Pokémon
   * that have meta data available.
   *
   * Parses the markdown table: | Rank | Pokemon | Usage % | ...
   */
  static async fetchPokemonIndex(): Promise<PikalyticsIndexEntry[]> {
    try {
      const response = await axios.get(PIKALYTICS_AI_BASE_URL, {
        headers: { 'Accept': 'text/markdown, text/plain, */*' },
        timeout: 15000,
      });

      const content: string = response.data;
      const entries: PikalyticsIndexEntry[] = [];

      // Parse markdown table rows: | N | **Name** | XX.XX% | ...
      const tableRowRegex = /\|\s*\d+\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(\d+\.?\d*)%/g;
      let match;
      while ((match = tableRowRegex.exec(content)) !== null) {
        entries.push({
          name: match[1].trim(),
          usagePct: parseFloat(match[2]),
        });
      }

      console.log(`[Pikalytics] Index fetched: ${entries.length} Pokémon available`);
      return entries;
    } catch (error: any) {
      console.error('[Pikalytics] Error fetching index:', error.message);
      return [];
    }
  }

  /**
   * Fetches the competitive meta data for a specific Pokémon.
   * Returns moves, abilities, and items with usage percentages.
   *
   * @param pokemonName - Case-sensitive name as it appears in Pikalytics (e.g., "Kingambit", "Rotom-Wash")
   */
  static async fetchPokemonMeta(pokemonName: string): Promise<PokemonMetaData | null> {
    try {
      const url = `${PIKALYTICS_AI_BASE_URL}/${encodeURIComponent(pokemonName)}`;
      const response = await axios.get(url, {
        headers: { 'Accept': 'text/markdown, text/plain, */*' },
        timeout: 15000,
      });

      const markdown: string = response.data;

      const moves = parseSection(markdown, 'Common Moves');
      const abilities = parseSection(markdown, 'Common Abilities');
      const items = parseSection(markdown, 'Common Items');

      return { moves, abilities, items };
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`[Pikalytics] No data for ${pokemonName} (404)`);
      } else {
        console.error(`[Pikalytics] Error fetching ${pokemonName}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetches meta data for all available Pokémon with rate limiting.
   * Yields progress callbacks for UI updates.
   *
   * @param onProgress - Progress callback (current, total, pokemonName)
   */
  static async fetchAllMeta(
    onProgress?: (current: number, total: number, name: string) => void
  ): Promise<Map<string, PokemonMetaData>> {
    const index = await this.fetchPokemonIndex();
    if (index.length === 0) {
      console.warn('[Pikalytics] No Pokémon in index. Skipping meta sync.');
      return new Map();
    }

    const results = new Map<string, PokemonMetaData>();

    for (let i = 0; i < index.length; i++) {
      const entry = index[i];
      onProgress?.(i + 1, index.length, entry.name);

      const meta = await this.fetchPokemonMeta(entry.name);
      if (meta) {
        results.set(entry.name, meta);
      }

      // Rate limit
      if (i < index.length - 1) {
        await delay(META_SYNC_CONFIG.RATE_LIMIT_DELAY);
      }
    }

    console.log(`[Pikalytics] Fetched meta data for ${results.size}/${index.length} Pokémon`);
    return results;
  }
}
