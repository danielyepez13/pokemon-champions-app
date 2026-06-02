import { EventEmitter } from 'eventemitter3';
import { META_SYNC_CONFIG } from '../config/constants';
import { FeaturedTeamsDAO, MetaTeammatesDAO } from '../database/dao/meta-pokedex.dao';
import { MetaUsageDAO } from '../database/dao/meta-usage.dao';
import { PokemonDAO } from '../database/dao/pokemon.dao';
import { SyncDAO } from '../database/dao/sync.dao';
import { resetDatabase } from '../database/database';
import { downloadPikalyticsSpriteAsBase64 } from './image-downloader';
import { PikalyticsService } from './pikalytics-service';
import { PokeAPIService } from './pokeapi-service';

export const syncEvents = new EventEmitter();

export class SyncOrchestrator {
  static async cleanSync() {
    console.log('[Sync] Performing clean synchronization (dropping database first)...');
    await resetDatabase();
    await this.startSync();
  }

  static async startSync() {
    console.log('[Sync] Starting full synchronization (Pikalytics AI source)...');
    const syncId = await SyncDAO.logStart('full_sync');
    console.log(`[Sync] Logged start with ID: ${syncId}`);

    try {
      // ─── Pokédex from Pikalytics AI ───────────────────────────────────────
      console.log('[Sync] Fetching Pokédex from Pikalytics AI index...');

      // Fetch the meta index to get the ranked list of Pokémon
      const index = await PikalyticsService.fetchIndex();
      if (index.length === 0) {
        throw new Error('[Sync] Pikalytics AI index returned empty. Aborting Phase 2.');
      }

      console.log(`[Sync] Phase 2: ${index.length} Pokémon found in meta index.`);

      // Clear existing meta data for a clean sync
      await MetaUsageDAO.clearAll();
      await MetaTeammatesDAO.clearAll();
      await FeaturedTeamsDAO.clearAll();

      let ok = 0;
      let errors = 0;
      let spritesOk = 0;
      let spritesResolvedViaFallback = 0;
      let spritesFailed = 0;
      let speciesOk = 0;
      let speciesResolvedViaFallback = 0;
      let speciesFailed = 0;

      for (let i = 0; i < index.length; i++) {
        const entry = index[i];
        console.log(`[Sync] [${i + 1}/${index.length}] Processing ${entry.name} (${entry.usagePct}% usage)...`);
        syncEvents.emit('progress', {
          phase: 'pokeapi',
          current: i + 1,
          total: index.length,
        });

        try {
          // 2b-i. Fetch competitive meta from Pikalytics AI
          const meta = await PikalyticsService.fetchPokemonMeta(entry.name);

          // 2b-ii. Fetch base data from PokeAPI using the Pikalytics name (lowercased)
          const pokeApiName = entry.name.toLowerCase();
          const detail = await PokeAPIService.getPokemonDetail(pokeApiName, undefined);
          const speciesResult = detail
            ? await PokeAPIService.getPokemonSpeciesForDetail(detail, entry.name)
            : await PokeAPIService.getPokemonSpeciesByName(entry.name);

          if (speciesResult.species) {
            if (speciesResult.resolvedViaFallback) {
              speciesResolvedViaFallback++;
            } else {
              speciesOk++;
            }
          } else {
            speciesFailed++;
          }

          let description = '';
          if (speciesResult.species) {
            const flavor = speciesResult.species.flavor_text_entries?.find(
              (e: any) => e.language.name === 'es' || e.language.name === 'en'
            );
            description = flavor
              ? flavor.flavor_text.replace(/\n|\f/g, ' ')
              : '';
          }

          // 2b-iii. Download sprite from Pikalytics CDN as Base64 (offline support)
          const spriteResult = await downloadPikalyticsSpriteAsBase64(entry.name);
          const spriteBase64 = spriteResult.sprite;
          if (spriteBase64) {
            if (spriteResult.usedFallback) {
              spritesResolvedViaFallback++;
            } else {
              spritesOk++;
            }
          } else {
            spritesFailed++;
          }

          // Use base stats from Pikalytics if PokeAPI fails, else from PokeAPI
          const stats = detail
            ? {
                hp: detail.stats[0].base_stat,
                attack: detail.stats[1].base_stat,
                defense: detail.stats[2].base_stat,
                spAttack: detail.stats[3].base_stat,
                spDefense: detail.stats[4].base_stat,
                speed: detail.stats[5].base_stat,
                total: detail.stats.reduce((acc: number, s: any) => acc + s.base_stat, 0),
              }
            : meta?.baseStats
            ? {
                hp: meta.baseStats.hp,
                attack: meta.baseStats.attack,
                defense: meta.baseStats.defense,
                spAttack: meta.baseStats.spAttack,
                spDefense: meta.baseStats.spDefense,
                speed: meta.baseStats.speed,
                total: Object.values(meta.baseStats).reduce((a, b) => a + b, 0),
              }
            : undefined;

          // Derive the form from the Pikalytics name (e.g. "Rotom-Wash" → "wash")
          const nameParts = entry.name.split('-');
          const form = nameParts.length > 1 ? nameParts.slice(1).join('-').toLowerCase() : '';
          const isMega = entry.name.toLowerCase().includes('mega');

          // 2b-iv. Upsert Pokémon into DB
          const pokemonId = await PokemonDAO.upsert({
            dexNumber: detail?.id ?? 0,
            name: entry.name,
            form,
            description,
            stats,
            height: detail ? detail.height / 10 : 0,
            weight: detail ? detail.weight / 10 : 0,
            spriteDefault: spriteBase64 ?? '',
            spriteIcon: spriteBase64 ?? '',
            types: detail?.types?.map((t: any) => t.type.name) ?? [],
            isMega,
            usagePct: entry.usagePct,
            usageRank: entry.rank,
          });

          // 2b-v. Persist meta_usage (moves, abilities, items)
          if (meta && pokemonId) {
            const relevantMoves = meta.moves.filter(m => m.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);
            const relevantAbilities = meta.abilities.filter(a => a.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);
            const relevantItems = meta.items.filter(i => i.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);

            await MetaUsageDAO.bulkReplace(pokemonId, 'move', relevantMoves.map(m => ({ name: m.name, usagePct: m.usagePct })));
            await MetaUsageDAO.bulkReplace(pokemonId, 'ability', relevantAbilities.map(a => ({ name: a.name, usagePct: a.usagePct })));
            await MetaUsageDAO.bulkReplace(pokemonId, 'item', relevantItems.map(i => ({ name: i.name, usagePct: i.usagePct })));

            // 2b-vi. Persist meta_teammates
            await MetaTeammatesDAO.upsert(entry.name, meta.teammates);

            // 2b-vii. Persist featured_teams
            await FeaturedTeamsDAO.upsert(entry.name, meta.featuredTeams);
          }

          ok++;
        } catch (pokemonError: any) {
          console.error(`[Sync] Error processing ${entry.name}:`, pokemonError.message);
          errors++;
        }

        // Log progress every 5 Pokémon
        if (i % 5 === 0) {
          await SyncDAO.logUpdate(syncId, ok, errors, index.length);
        }

        // Small delay between requests to avoid hammering the server
        if (i < index.length - 1) {
          await new Promise(r => setTimeout(r, META_SYNC_CONFIG.RATE_LIMIT_DELAY));
        }
      }

      console.log(`[Sync] Phase 2 complete. Success: ${ok}, Errors: ${errors}, Total: ${index.length}`);
      console.log(
        `[Sync] Phase 2 enrichment summary: sprites OK=${spritesOk} fallback=${spritesResolvedViaFallback} failed=${spritesFailed} | species OK=${speciesOk} fallback=${speciesResolvedViaFallback} failed=${speciesFailed}`
      );

      // Save sync timestamps
      await SyncDAO.setMetadata('pikalytics_last_sync', new Date().toISOString());
      await SyncDAO.logComplete(syncId);
      syncEvents.emit('complete');
    } catch (e: any) {
      console.error('[Sync] Fatal error during synchronization:', e);
      await SyncDAO.logFailure(syncId, e.message);
      syncEvents.emit('error', e.message);
    }
  }

  /**
   * Standalone Pikalytics meta sync (can be called from Settings for a manual refresh).
   * Skips items and PokeAPI — only refreshes meta_usage, meta_teammates, and featured_teams.
   * Does NOT re-download images (they are already in DB).
   *
   * @param force - If true, ignores the 7-day cooldown
   */
  static async syncPikalytics(force: boolean = false) {
    if (!force) {
      const lastSync = await SyncDAO.getMetadata('pikalytics_last_sync');
      if (lastSync) {
        const daysSince = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < META_SYNC_CONFIG.SYNC_INTERVAL_DAYS) {
          console.log(`[Pikalytics] Last sync was ${daysSince.toFixed(1)} days ago. Skipping.`);
          return;
        }
      }
    }

    const syncId = await SyncDAO.logStart('pikalytics_meta');

    try {
      await MetaUsageDAO.clearAll();
      await MetaTeammatesDAO.clearAll();
      await FeaturedTeamsDAO.clearAll();

      const allMeta = await PikalyticsService.fetchAllMeta(
        (current, total, name) => {
          syncEvents.emit('progress', { phase: 'pikalytics', current, total });
          console.log(`[Pikalytics] [${current}/${total}] Fetching ${name}...`);
        }
      );

      let totalEntries = 0;
      let matchedPokemon = 0;

      for (const [pikalyticsName, meta] of allMeta) {
        const pokemon = await PokemonDAO.getByName(pikalyticsName);
        if (!pokemon) {
          console.warn(`[Pikalytics] ${pikalyticsName} not found in local DB. Skipping.`);
          continue;
        }

        matchedPokemon++;

        const relevantMoves = meta.moves.filter(m => m.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);
        const relevantAbilities = meta.abilities.filter(a => a.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);
        const relevantItems = meta.items.filter(i => i.usagePct >= META_SYNC_CONFIG.MIN_USAGE_PCT);

        await MetaUsageDAO.bulkReplace(pokemon.id, 'move', relevantMoves.map(m => ({ name: m.name, usagePct: m.usagePct })));
        await MetaUsageDAO.bulkReplace(pokemon.id, 'ability', relevantAbilities.map(a => ({ name: a.name, usagePct: a.usagePct })));
        await MetaUsageDAO.bulkReplace(pokemon.id, 'item', relevantItems.map(i => ({ name: i.name, usagePct: i.usagePct })));

        await MetaTeammatesDAO.upsert(pikalyticsName, meta.teammates);
        await FeaturedTeamsDAO.upsert(pikalyticsName, meta.featuredTeams);

        totalEntries += relevantMoves.length + relevantAbilities.length + relevantItems.length;
      }

      await SyncDAO.setMetadata('pikalytics_last_sync', new Date().toISOString());
      await SyncDAO.logUpdate(syncId, matchedPokemon, allMeta.size - matchedPokemon, allMeta.size);
      await SyncDAO.logComplete(syncId);

      console.log(`[Pikalytics] Sync complete. ${matchedPokemon} Pokémon, ${totalEntries} entries.`);
      syncEvents.emit('complete');
    } catch (e: any) {
      console.error('[Pikalytics] Error during meta sync:', e);
      await SyncDAO.logFailure(syncId, e.message);
      syncEvents.emit('error', e.message);
      throw e;
    }
  }

  /**
   * Fetches and stores a single Pokémon by its Pikalytics display name.
   * Used when a team import detects a Pokémon not in the local DB.
   *
   * - Fetches meta from Pikalytics AI (may have minimal data for non-meta Pokémon)
   * - Fetches base data from PokeAPI
   * - Downloads sprite from Pikalytics CDN as Base64
   * - Stores with usage_pct=0, usage_rank=0 (signals "not in current meta")
   *
   * @returns 'stored' | 'already_exists' | 'error'
   */
  static async fetchAndStoreSinglePokemon(
    displayName: string
  ): Promise<'stored' | 'already_exists' | 'error'> {
    console.log(`[OnDemand] Fetching: ${displayName}`);

    const existing = await PokemonDAO.getByName(displayName);
    if (existing) {
      console.log(`[OnDemand] ${displayName} already in DB (id=${existing.id}).`);
      return 'already_exists';
    }

    try {
      const slug = displayName.toLowerCase();

      const meta = await PikalyticsService.fetchPokemonMeta(displayName);
      const detail = await PokeAPIService.getPokemonDetail(slug, undefined);
      const speciesResult = detail
        ? await PokeAPIService.getPokemonSpeciesForDetail(detail, displayName)
        : await PokeAPIService.getPokemonSpeciesByName(displayName);

      let description = '';
      if (speciesResult.species) {
        const flavor = speciesResult.species.flavor_text_entries?.find(
          (e: any) => e.language.name === 'en'
        );
        description = flavor ? flavor.flavor_text.replace(/\n|\f/g, ' ') : '';
      }

      const spriteResult = await downloadPikalyticsSpriteAsBase64(displayName);
      const spriteBase64 = spriteResult.sprite;

      const stats = detail
        ? {
            hp: detail.stats[0].base_stat,
            attack: detail.stats[1].base_stat,
            defense: detail.stats[2].base_stat,
            spAttack: detail.stats[3].base_stat,
            spDefense: detail.stats[4].base_stat,
            speed: detail.stats[5].base_stat,
            total: detail.stats.reduce((acc: number, s: any) => acc + s.base_stat, 0),
          }
        : meta?.baseStats
        ? {
            hp: meta.baseStats.hp,
            attack: meta.baseStats.attack,
            defense: meta.baseStats.defense,
            spAttack: meta.baseStats.spAttack,
            spDefense: meta.baseStats.spDefense,
            speed: meta.baseStats.speed,
            total: Object.values(meta.baseStats).reduce((a, b) => a + b, 0),
          }
        : { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, total: 0 };

      const nameParts = displayName.split('-');
      const form = nameParts.length > 1 ? nameParts.slice(1).join('-').toLowerCase() : '';

      const pokemonId = await PokemonDAO.upsert({
        dexNumber: detail?.id ?? 0,
        name: displayName,
        form,
        description,
        stats,
        height: detail ? detail.height / 10 : 0,
        weight: detail ? detail.weight / 10 : 0,
        spriteDefault: spriteBase64 ?? '',
        spriteIcon: spriteBase64 ?? '',
        types: detail?.types?.map((t: any) => t.type.name) ?? [],
        isMega: displayName.toLowerCase().includes('mega'),
        usagePct: 0,
        usageRank: 0,
      });

      if (meta && pokemonId) {
        if (meta.moves.length > 0)
          await MetaUsageDAO.bulkReplace(pokemonId, 'move', meta.moves.map(m => ({ name: m.name, usagePct: m.usagePct })));
        if (meta.abilities.length > 0)
          await MetaUsageDAO.bulkReplace(pokemonId, 'ability', meta.abilities.map(a => ({ name: a.name, usagePct: a.usagePct })));
        if (meta.items.length > 0)
          await MetaUsageDAO.bulkReplace(pokemonId, 'item', meta.items.map(i => ({ name: i.name, usagePct: i.usagePct })));
        if (meta.teammates.length > 0)
          await MetaTeammatesDAO.upsert(displayName, meta.teammates);
        if (meta.featuredTeams.length > 0)
          await FeaturedTeamsDAO.upsert(displayName, meta.featuredTeams);
      }

      console.log(`[OnDemand] ${displayName} stored (id=${pokemonId}).`);
      return 'stored';
    } catch (e: any) {
      console.error(`[OnDemand] Failed to store ${displayName}:`, e.message);
      return 'error';
    }
  }

  /**
   * Given a list of display names (from a pokepaste), returns those NOT in the local DB.
   */
  static async getMissingPokemon(displayNames: string[]): Promise<string[]> {
    const missing: string[] = [];
    for (const name of displayNames) {
      const found = await PokemonDAO.getByName(name);
      if (!found) missing.push(name);
    }
    return missing;
  }
}
