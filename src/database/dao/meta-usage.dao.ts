import { getDatabase } from '../database';

export interface MetaUsageRow {
  id: number;
  pokemonId: number;
  category: string;
  name: string;
  usagePct: number;
  syncedAt: string;
}

export class MetaUsageDAO {
  /**
   * Upsert a single meta usage entry.
   * If the entry already exists (same pokemon_id + category + name), updates the usage %.
   */
  static async upsert(pokemonId: number, category: string, name: string, usagePct: number) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO meta_usage (pokemon_id, category, name, usage_pct, synced_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(pokemon_id, category, name) DO UPDATE SET
         usage_pct = excluded.usage_pct,
         synced_at = excluded.synced_at`,
      [pokemonId, category, name, usagePct]
    );
  }

  /**
   * Bulk upsert multiple entries for a single Pokémon + category.
   * Clears old entries for that pokemon+category first, then inserts fresh data.
   */
  static async bulkReplace(
    pokemonId: number,
    category: string,
    entries: { name: string; usagePct: number }[]
  ) {
    const db = await getDatabase();
    // Delete existing entries for this pokemon + category
    await db.runAsync(
      'DELETE FROM meta_usage WHERE pokemon_id = ? AND category = ?',
      [pokemonId, category]
    );
    // Insert all new entries
    for (const entry of entries) {
      await db.runAsync(
        `INSERT INTO meta_usage (pokemon_id, category, name, usage_pct)
         VALUES (?, ?, ?, ?)`,
        [pokemonId, category, entry.name, entry.usagePct]
      );
    }
  }

  /**
   * Get all meta usage entries for a Pokémon, optionally filtered by category and min usage.
   */
  static async getByPokemonId(
    pokemonId: number,
    category?: string,
    minUsage?: number
  ): Promise<MetaUsageRow[]> {
    const db = await getDatabase();
    let query = 'SELECT * FROM meta_usage WHERE pokemon_id = ?';
    const params: any[] = [pokemonId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (minUsage !== undefined) {
      query += ' AND usage_pct >= ?';
      params.push(minUsage);
    }

    query += ' ORDER BY usage_pct DESC';

    const rows = await db.getAllAsync<any>(query, params);
    return rows.map(row => ({
      id: row.id,
      pokemonId: row.pokemon_id,
      category: row.category,
      name: row.name,
      usagePct: row.usage_pct,
      syncedAt: row.synced_at,
    }));
  }

  /**
   * Get top moves for a Pokémon (convenience wrapper).
   */
  static async getTopMoves(pokemonId: number, minUsage: number = 15): Promise<MetaUsageRow[]> {
    return this.getByPokemonId(pokemonId, 'move', minUsage);
  }

  /**
   * Get top abilities for a Pokémon (convenience wrapper).
   */
  static async getTopAbilities(pokemonId: number, minUsage: number = 15): Promise<MetaUsageRow[]> {
    return this.getByPokemonId(pokemonId, 'ability', minUsage);
  }

  /**
   * Get top items for a Pokémon (convenience wrapper).
   */
  static async getTopItems(pokemonId: number, minUsage: number = 15): Promise<MetaUsageRow[]> {
    return this.getByPokemonId(pokemonId, 'item', minUsage);
  }

  /**
   * Clear all meta usage data (used before a full re-sync).
   */
  static async clearAll() {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM meta_usage');
  }

  /**
   * Get count of entries in meta_usage (for diagnostics).
   */
  static async getCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM meta_usage');
    return result?.cnt ?? 0;
  }

  /**
   * Get the number of distinct Pokémon that have meta data.
   */
  static async getPokemonWithMetaCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(DISTINCT pokemon_id) as cnt FROM meta_usage'
    );
    return result?.cnt ?? 0;
  }
}
