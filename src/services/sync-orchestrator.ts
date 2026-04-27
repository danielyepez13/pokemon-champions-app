import { PokeAPIService } from './pokeapi-service';
import { PokemonDAO, ItemDAO } from '../database/dao/pokemon.dao';
import { SyncDAO } from '../database/dao/sync.dao';
import { CHAMPIONS_POKEMON_LIST } from '../utils/pokemon-champions';
import { CHAMPIONS_ITEMS_LIST } from '../utils/items-champions';
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

      for (let i = 0; i < total; i++) {
        const pkmn = CHAMPIONS_POKEMON_LIST[i];
        console.log(`[Sync] [${i + 1}/${total}] Processing ${pkmn.name}...`);
        syncEvents.emit('progress', { phase: 'pokeapi', current: i + 1, total });

        const detail = await PokeAPIService.getPokemonDetail(pkmn.name);
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
      await SyncDAO.logComplete(syncId);
      syncEvents.emit('complete');
    } catch (e: any) {
      console.error('[Sync] Fatal error during synchronization:', e);
      await SyncDAO.logFailure(syncId, e.message);
      syncEvents.emit('error', e.message);
    }
  }
}
