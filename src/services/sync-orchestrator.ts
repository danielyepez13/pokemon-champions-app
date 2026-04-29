import { PokeAPIService } from './pokeapi-service';
import { PikalyticsService } from './pikalytics-service';
import { PokemonDAO, ItemDAO } from '../database/dao/pokemon.dao';
import { MetaUsageDAO } from '../database/dao/meta-usage.dao';
import { SyncDAO } from '../database/dao/sync.dao';
import { CHAMPIONS_POKEMON_LIST } from '../utils/pokemon-champions';
import { CHAMPIONS_ITEMS_LIST } from '../utils/items-champions';
import { META_SYNC_CONFIG } from '../config/constants';
import { EventEmitter } from 'eventemitter3';

import { resetDatabase } from '../database/database';

export const syncEvents = new EventEmitter();

export class SyncOrchestrator {
  static async cleanSync() {
    console.log('[Sync] Performing clean synchronization (dropping database first)...');
    await resetDatabase();
    await this.startSync();
  }

  private static getPokemonSprite(dexNumber: number, name: string): string {
    const dexStr = String(dexNumber).padStart(3, '0');
    let suffix = '';
    const n = name.toLowerCase();
    
    if (n.includes('-mega')) {
      if (n.includes('-mega-x')) suffix = '-mx';
      else if (n.includes('-mega-y')) suffix = '-my';
      else suffix = '-m';
    } else if (n.includes('-alola')) {
      suffix = '-a';
    } else if (n.includes('-galar')) {
      suffix = '-g';
    } else if (n.includes('-hisui')) {
      suffix = '-h';
    } else if (n.includes('-paldea')) {
      suffix = '-p';
    } else if (n.includes('-eternal')) {
      suffix = '-e';
    } else if (n === 'rotom-wash') {
      suffix = '-w';
    } else if (n === 'rotom-heat') {
      suffix = '-h';
    }
    
    return `${dexStr}${suffix}`;
  }

  private static getItemSprite(name: string): string {
    // Items in imagenes_items remove spaces and hyphens
    return name.toLowerCase()
      .replace(/ /g, '')
      .replace(/-/g, '');
  }

  static async startSync() {
    console.log('[Sync] Starting full synchronization...');
    const syncId = await SyncDAO.logStart('full_sync');
    console.log(`[Sync] Logged start with ID: ${syncId}`);
    
    try {
      // Phase 1: Items Synchronization
      console.log('[Sync] Phase 1: Synchronizing Items...');
      const totalItems = CHAMPIONS_ITEMS_LIST.length;
      for (let i = 0; i < totalItems; i++) {
        const item = CHAMPIONS_ITEMS_LIST[i];
        syncEvents.emit('progress', { phase: 'items', current: i + 1, total: totalItems });
        await ItemDAO.upsert({
          name: item.name,
          category: item.category,
          effect: item.effect,
          sprite_url: this.getItemSprite(item.name),
          location: '' // Can be added later
        });
      }
      console.log(`[Sync] Synchronized ${totalItems} items.`);

      // Phase 2: Pokemon Enrichment
      const total = CHAMPIONS_POKEMON_LIST.length;
      console.log(`[Sync] Phase 2: Enriching ${total} pokemon via PokeAPI...`);
      
      let ok = 0;
      let error = 0;
      const failedPokemon: string[] = [];

      for (let i = 0; i < total; i++) {
        const pkmn = CHAMPIONS_POKEMON_LIST[i];
        console.log(`[Sync] [${i + 1}/${total}] Processing ${pkmn.name}...`);
        syncEvents.emit('progress', { phase: 'pokeapi', current: i + 1, total });

        // PASS dexNumber as fallback
        const detail = await PokeAPIService.getPokemonDetail(pkmn.name, pkmn.dexNumber);
        const species = await PokeAPIService.getPokemonSpecies(pkmn.dexNumber);
        
        let description = '';
        if (species) {
          const flavor = species.flavor_text_entries.find((e: any) => e.language.name === 'es' || e.language.name === 'en');
          description = flavor ? flavor.flavor_text.replace(/\n|\f/g, ' ') : '';
        }

        if (detail) {
          const stats = {
            hp: detail.stats[0].base_stat,
            attack: detail.stats[1].base_stat,
            defense: detail.stats[2].base_stat,
            spAttack: detail.stats[3].base_stat,
            spDefense: detail.stats[4].base_stat,
            speed: detail.stats[5].base_stat,
            total: detail.stats.reduce((acc: number, s: any) => acc + s.base_stat, 0)
          };

          await PokemonDAO.upsert({
            dexNumber: pkmn.dexNumber,
            name: pkmn.name,
            form: pkmn.name.includes('-') ? pkmn.name.split('-').slice(1).join('-') : '',
            description,
            stats,
            height: detail.height / 10,
            weight: detail.weight / 10,
            spriteDefault: this.getPokemonSprite(pkmn.dexNumber, pkmn.name),
            spriteIcon: this.getPokemonSprite(pkmn.dexNumber, pkmn.name),
            types: detail.types.map((t: any) => t.type.name),
            isMega: pkmn.name.toLowerCase().includes('mega')
          });
          ok++;
        } else {
          console.warn(`[Sync] [${i + 1}/${total}] Enrichment failed for ${pkmn.name}. Using basic data.`);
          failedPokemon.push(`${pkmn.name} (#${pkmn.dexNumber})`);
          await PokemonDAO.upsert({
            dexNumber: pkmn.dexNumber,
            name: pkmn.name,
            form: pkmn.name.includes('-') ? pkmn.name.split('-').slice(1).join('-') : '',
            description,
            spriteDefault: this.getPokemonSprite(pkmn.dexNumber, pkmn.name),
            isMega: pkmn.name.toLowerCase().includes('mega')
          });
          error++;
        }

        if (i % 5 === 0) {
          await SyncDAO.logUpdate(syncId, ok, error, total);
        }
      }

      console.log(`[Sync] Completed. Success: ${ok}, Fail: ${error}, Total: ${total}`);
      
      if (failedPokemon.length > 0) {
        console.log('\n[Sync] FAILED POKEMON (Copyable List):');
        console.log('------------------------------------');
        failedPokemon.forEach(p => console.log(`- ${p}`));
        console.log('------------------------------------\n');
      }

      // Phase 3: Pikalytics Meta Sync
      console.log('[Sync] Phase 3: Synchronizing Pikalytics meta data...');
      await this.syncPikalytics(true); // force=true during full sync

      await SyncDAO.logComplete(syncId);
      syncEvents.emit('complete');
    } catch (e: any) {
      console.error('[Sync] Fatal error during synchronization:', e);
      await SyncDAO.logFailure(syncId, e.message);
      syncEvents.emit('error', e.message);
    }
  }

  /**
   * Sync meta usage data from Pikalytics.
   * Can be called independently from Settings for manual sync.
   *
   * @param force - If true, ignores the 7-day cooldown
   */
  static async syncPikalytics(force: boolean = false) {
    // Check cooldown unless forced
    if (!force) {
      const lastSync = await SyncDAO.getMetadata('pikalytics_last_sync');
      if (lastSync) {
        const daysSince = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < META_SYNC_CONFIG.SYNC_INTERVAL_DAYS) {
          console.log(`[Pikalytics] Last sync was ${daysSince.toFixed(1)} days ago. Skipping (threshold: ${META_SYNC_CONFIG.SYNC_INTERVAL_DAYS} days).`);
          return;
        }
      }
    }

    const syncId = await SyncDAO.logStart('pikalytics_meta');

    try {
      // Clear existing meta data for a clean sync
      await MetaUsageDAO.clearAll();

      // Fetch all meta data with progress reporting
      const allMeta = await PikalyticsService.fetchAllMeta(
        (current, total, name) => {
          syncEvents.emit('progress', { phase: 'pikalytics', current, total });
          console.log(`[Pikalytics] [${current}/${total}] Fetching ${name}...`);
        }
      );

      // Persist to database
      let totalEntries = 0;
      let matchedPokemon = 0;

      for (const [pikalyticsName, meta] of allMeta) {
        // Find the pokemon in our local DB (case-insensitive match)
        const pokemon = await PokemonDAO.getByName(pikalyticsName);
        if (!pokemon) {
          console.warn(`[Pikalytics] ${pikalyticsName} not found in local DB. Skipping.`);
          continue;
        }

        matchedPokemon++;

        // Filter by minimum usage % and bulk insert
        const relevantMoves = meta.moves.filter(m => m.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);
        const relevantAbilities = meta.abilities.filter(a => a.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);
        const relevantItems = meta.items.filter(i => i.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);

        await MetaUsageDAO.bulkReplace(pokemon.id, 'move', relevantMoves.map(m => ({
          name: m.name,
          usagePct: m.usagePct,
        })));
        await MetaUsageDAO.bulkReplace(pokemon.id, 'ability', relevantAbilities.map(a => ({
          name: a.name,
          usagePct: a.usagePct,
        })));
        await MetaUsageDAO.bulkReplace(pokemon.id, 'item', relevantItems.map(i => ({
          name: i.name,
          usagePct: i.usagePct,
        })));

        totalEntries += relevantMoves.length + relevantAbilities.length + relevantItems.length;
      }

      // Save sync timestamp
      await SyncDAO.setMetadata('pikalytics_last_sync', new Date().toISOString());
      await SyncDAO.logUpdate(syncId, matchedPokemon, allMeta.size - matchedPokemon, allMeta.size);
      await SyncDAO.logComplete(syncId);

      console.log(`[Pikalytics] Sync complete. ${matchedPokemon} Pokémon matched, ${totalEntries} entries stored (>=${META_SYNC_CONFIG.MIN_USAGE_PCT}% usage).`);
      syncEvents.emit('complete');
    } catch (e: any) {
      console.error('[Pikalytics] Error during meta sync:', e);
      await SyncDAO.logFailure(syncId, e.message);
      syncEvents.emit('error', e.message);
      throw e; // Re-throw so the caller can handle it
    }
  }
}
