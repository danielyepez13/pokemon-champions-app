import axios from 'axios';
import { PIKALYTICS_AI_BASE_URL, PIKALYTICS_AI_INDEX_URL, META_SYNC_CONFIG } from '../config/constants';

// ─── Basic meta entry ────────────────────────────────────────────────────────

export interface MetaEntry {
  name: string;
  usagePct: number;
}

export interface TeammateEntry {
  name: string;
  usagePct: number;
}

// ─── Featured team types ──────────────────────────────────────────────────────

export interface FeaturedTeamFocusSet {
  ability: string;
  item: string;
  moves: string[];
}

export interface FeaturedTeam {
  player: string;
  record: string;
  event: string;
  pokemon: string[];        // All 6 Pokémon names in the team
  focusSet: FeaturedTeamFocusSet;
}

// ─── Full meta data returned per Pokémon ─────────────────────────────────────

export interface PokemonMetaData {
  moves: MetaEntry[];
  abilities: MetaEntry[];
  items: MetaEntry[];
  teammates: TeammateEntry[];
  featuredTeams: FeaturedTeam[];
  baseStats?: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  usagePct?: number;
  usageRank?: number;
}

// ─── Index entry ──────────────────────────────────────────────────────────────

export interface PikalyticsIndexEntry {
  name: string;
  usagePct: number;
  rank: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Matches "- **Name**: 98.946%" style lines */
const ENTRY_REGEX = /^- \*\*(.+?)\*\*:\s*(\d+\.?\d*)%/;

/**
 * Parses a section of markdown between two `## ` headers.
 */
function parseSection(markdown: string, sectionHeader: string): MetaEntry[] {
  const entries: MetaEntry[] = [];
  const headerIndex = markdown.indexOf(`## ${sectionHeader}`);
  if (headerIndex === -1) return entries;

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

/**
 * Parses "## Common Teammates" section.
 */
function parseTeammates(markdown: string): TeammateEntry[] {
  return parseSection(markdown, 'Common Teammates') as TeammateEntry[];
}

/**
 * Parses "## Featured Teams with {pokemonName}" section.
 * Extracts each team block: player, record, event, 6 Pokémon, and the focus set.
 */
function parseFeaturedTeams(markdown: string, pokemonName: string): FeaturedTeam[] {
  const teams: FeaturedTeam[] = [];

  // Find the featured teams section header
  const sectionMarker = `## Featured Teams with ${pokemonName}`;
  const sectionStart = markdown.indexOf(sectionMarker);
  if (sectionStart === -1) return teams;

  const afterSection = markdown.substring(sectionStart + sectionMarker.length);
  // Section ends at next ## header
  const nextH2 = afterSection.indexOf('\n## ');
  const sectionContent = nextH2 === -1 ? afterSection : afterSection.substring(0, nextH2);

  // Split into individual team blocks by "### Team N by"
  const teamBlocks = sectionContent.split(/\n### Team \d+ by /);

  for (let i = 1; i < teamBlocks.length; i++) {
    const block = teamBlocks[i];
    const lines = block.split('\n');

    // First line is the player name
    const player = lines[0]?.trim() ?? '';

    // Extract record: *Record: 11-2*
    const recordMatch = block.match(/\*Record:\s*(.+?)\*/);
    const record = recordMatch ? recordMatch[1].trim() : '';

    // Extract event: *Event: xxx*
    const eventMatch = block.match(/\*Event:\s*(.+?)\*/);
    const event = eventMatch ? eventMatch[1].trim() : '';

    // Extract Pokémon list: **Pokemon**: Name1, Name2, ...
    const pokemonMatch = block.match(/\*\*Pokemon\*\*:\s*(.+)/);
    const pokemonList = pokemonMatch
      ? pokemonMatch[1].split(',').map(p => p.trim()).filter(Boolean)
      : [];

    // Extract focus set section: **{PokemonName} Set**:
    const setHeaderPattern = new RegExp(
      `\\*\\*${pokemonName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')} Set\\*\\*:?`
    );
    const setMatch = block.match(setHeaderPattern);

    let ability = '';
    let item = '';
    const moves: string[] = [];

    if (setMatch) {
      const setStart = block.indexOf(setMatch[0]) + setMatch[0].length;
      const setContent = block.substring(setStart);
      const setLines = setContent.split('\n').slice(0, 10);

      for (const line of setLines) {
        const abilityMatch = line.match(/- \*\*Ability\*\*:\s*(.+)/);
        const itemMatch = line.match(/- \*\*Item\*\*:\s*(.+)/);
        const movesMatch = line.match(/- \*\*Moves\*\*:\s*(.+)/);

        if (abilityMatch) ability = abilityMatch[1].trim();
        if (itemMatch) item = itemMatch[1].trim();
        if (movesMatch) {
          moves.push(...movesMatch[1].split(',').map(m => m.trim()).filter(Boolean));
        }
      }
    }

    if (player && pokemonList.length > 0) {
      teams.push({
        player,
        record,
        event,
        pokemon: pokemonList,
        focusSet: { ability, item, moves },
      });
    }
  }

  return teams;
}

/**
 * Parses base stats from the FAQ markdown table:
 * | HP | 95 |
 * | Attack | 115 |
 * ...
 */
function parseBaseStats(markdown: string): PokemonMetaData['baseStats'] | undefined {
  // Look for the base stats table after the FAQ question
  const statsHeaderMatch = markdown.match(/### What are the base stats for .+?\n([\s\S]+?)(?:\n---|\n##|$)/);
  if (!statsHeaderMatch) return undefined;

  const tableContent = statsHeaderMatch[1];
  const getValue = (label: string): number => {
    const match = tableContent.match(new RegExp(`\\|\\s*${label}\\s*\\|\\s*(\\d+)\\s*\\|`, 'i'));
    return match ? parseInt(match[1], 10) : 0;
  };

  const hp = getValue('HP');
  const attack = getValue('Attack');
  const defense = getValue('Defense');
  const spAttack = getValue('Sp\\.? ?Atk');
  const spDefense = getValue('Sp\\.? ?Def');
  const speed = getValue('Speed');

  if (hp === 0 && attack === 0) return undefined;

  return { hp, attack, defense, spAttack, spDefense, speed };
}

// ─── Service class ────────────────────────────────────────────────────────────

export class PikalyticsService {
  /**
   * Fetches the AI index to get the ranked list of Pokémon in the meta.
   * Uses the /ai/ endpoint which returns clean Markdown tables.
   */
  static async fetchIndex(): Promise<PikalyticsIndexEntry[]> {
    try {
      const response = await axios.get(PIKALYTICS_AI_INDEX_URL, {
        headers: { 'Accept': 'text/markdown, text/plain, */*' },
        timeout: 20000,
      });

      const content: string = response.data;
      const entries: PikalyticsIndexEntry[] = [];

      // Parse AI index table: | 1 | **Sneasler** | 51.30% | [View](...) | [AI](...) |
      // Regex handles any percentage: 0.01%, 51.30%, 100%, etc.
      const tableRowRegex = /\|\s*(\d+)\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(\d+(?:\.\d+)?)%/g;
      let match;
      while ((match = tableRowRegex.exec(content)) !== null) {
        entries.push({
          rank: parseInt(match[1], 10),
          name: match[2].trim(),
          usagePct: parseFloat(match[3]),
        });
      }

      console.log(`[Pikalytics] Index fetched: ${entries.length} Pokémon in meta`);
      return entries;

    } catch (error: any) {
      console.error('[Pikalytics] Error fetching index:', error.message);
      return [];
    }
  }

  /**
   * Fetches the competitive meta data for a specific Pokémon from the AI endpoint.
   * Returns moves, abilities, items, teammates, featured teams and base stats.
   */
  static async fetchPokemonMeta(pokemonName: string): Promise<PokemonMetaData | null> {
    try {
      const url = `${PIKALYTICS_AI_BASE_URL}/${encodeURIComponent(pokemonName)}`;
      const response = await axios.get(url, {
        headers: { 'Accept': 'text/markdown, text/plain, */*' },
        timeout: 20000,
      });

      const markdown: string = response.data;

      const moves = parseSection(markdown, 'Common Moves');
      const abilities = parseSection(markdown, 'Common Abilities');
      const items = parseSection(markdown, 'Common Items');
      const teammates = parseTeammates(markdown);
      const featuredTeams = parseFeaturedTeams(markdown, pokemonName);
      const baseStats = parseBaseStats(markdown);

      return { moves, abilities, items, teammates, featuredTeams, baseStats };
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
   * Fetches meta data for all Pokémon in the current index with rate limiting.
   * Returns a Map of pokemonName → PokemonMetaData with usage info embedded.
   */
  static async fetchAllMeta(
    onProgress?: (current: number, total: number, name: string) => void
  ): Promise<Map<string, PokemonMetaData>> {
    const index = await this.fetchIndex();
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
        meta.usagePct = entry.usagePct;
        meta.usageRank = entry.rank;
        results.set(entry.name, meta);
      }

      if (i < index.length - 1) {
        await delay(META_SYNC_CONFIG.RATE_LIMIT_DELAY);
      }
    }

    console.log(`[Pikalytics] Fetched meta for ${results.size}/${index.length} Pokémon`);
    return results;
  }
}
