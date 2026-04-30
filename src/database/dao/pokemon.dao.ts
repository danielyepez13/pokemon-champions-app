import { getDatabase } from '../database';
import { Pokemon, Stats, Item } from '../../models/pokemon';

export class PokemonDAO {
  static async upsert(pokemon: Partial<Pokemon>) {
    if (!pokemon.name) return;
    const db = await getDatabase();
    
    const stats = pokemon.stats || {
      hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, total: 0
    };

    await db.runAsync(
      `INSERT INTO pokemon (
        dex_number, name, form, is_mega, hp, attack, defense, sp_attack, sp_defense, speed, total, 
        height, weight, sprite_default, sprite_shiny, sprite_icon, category, description,
        usage_pct, usage_rank
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        dex_number = excluded.dex_number,
        is_mega = excluded.is_mega,
        hp = excluded.hp,
        attack = excluded.attack,
        defense = excluded.defense,
        sp_attack = excluded.sp_attack,
        sp_defense = excluded.sp_defense,
        speed = excluded.speed,
        total = excluded.total,
        height = excluded.height,
        weight = excluded.weight,
        sprite_default = excluded.sprite_default,
        sprite_shiny = excluded.sprite_shiny,
        sprite_icon = excluded.sprite_icon,
        category = excluded.category,
        description = excluded.description,
        usage_pct = excluded.usage_pct,
        usage_rank = excluded.usage_rank;`,

      [
        pokemon.dexNumber ?? 0,
        pokemon.name ?? '',
        pokemon.form ?? '',
        pokemon.isMega ? 1 : 0,
        stats.hp ?? 0,
        stats.attack ?? 0,
        stats.defense ?? 0,
        stats.spAttack ?? 0,
        stats.spDefense ?? 0,
        stats.speed ?? 0,
        stats.total ?? 0,
        pokemon.height ?? 0,
        pokemon.weight ?? 0,
        pokemon.spriteDefault ?? '',
        pokemon.spriteShiny ?? '',
        pokemon.spriteIcon ?? '',
        pokemon.category ?? '',
        pokemon.description ?? '',
        pokemon.usagePct ?? 0,
        pokemon.usageRank ?? 0,
      ]
    );

    const result = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM pokemon WHERE name = ?',
      [pokemon.name ?? '']
    );


    if (result && pokemon.types) {
      await this.setTypes(result.id, pokemon.types);
    }

    return result?.id;
  }


  static async setTypes(pokemonId: number, types: string[]) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM pokemon_types WHERE pokemon_id = ?', [pokemonId]);
    for (let i = 0; i < types.length; i++) {
      await db.runAsync(
        'INSERT INTO pokemon_types (pokemon_id, type_name, slot) VALUES (?, ?, ?)',
        [pokemonId, types[i], i + 1]
      );
    }
  }

  static async getAll(): Promise<Pokemon[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`
      SELECT p.*, GROUP_CONCAT(t.type_name) as types_list
      FROM pokemon p
      LEFT JOIN pokemon_types t ON p.id = t.pokemon_id
      GROUP BY p.id
      ORDER BY p.dex_number ASC
    `);
    return rows.map(row => this.mapRowToPokemon(row));
  }

  /**
   * Returns all Pokémon ordered by usage rank (meta relevance).
   * Pokémon with usage_rank = 0 fall to the bottom.
   */
  static async getAllByUsageRank(): Promise<Pokemon[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`
      SELECT p.*, GROUP_CONCAT(t.type_name) as types_list
      FROM pokemon p
      LEFT JOIN pokemon_types t ON p.id = t.pokemon_id
      GROUP BY p.id
      ORDER BY
        CASE WHEN p.usage_rank = 0 THEN 1 ELSE 0 END ASC,
        p.usage_rank ASC
    `);
    return rows.map(row => this.mapRowToPokemon(row));
  }


  static async getById(id: number): Promise<Pokemon | null> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`
      SELECT p.*, GROUP_CONCAT(t.type_name) as types_list
      FROM pokemon p
      LEFT JOIN pokemon_types t ON p.id = t.pokemon_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    return rows.length > 0 ? this.mapRowToPokemon(rows[0]) : null;
  }

  static async search(query: string): Promise<Pokemon[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`
      SELECT p.*, GROUP_CONCAT(t.type_name) as types_list
      FROM pokemon p
      JOIN pokemon_fts f ON p.id = f.rowid
      LEFT JOIN pokemon_types t ON p.id = t.pokemon_id
      WHERE pokemon_fts MATCH ?
      GROUP BY p.id
      ORDER BY rank
    `, [`${query}*`]);

    return rows.map(row => this.mapRowToPokemon(row));
  }

  private static mapRowToPokemon(row: any): Pokemon {
    return {
      id: row.id,
      dexNumber: row.dex_number,
      name: row.name,
      form: row.form,
      description: row.description,
      isMega: !!row.is_mega,
      stats: {
        hp: row.hp,
        attack: row.attack,
        defense: row.defense,
        spAttack: row.sp_attack,
        spDefense: row.sp_defense,
        speed: row.speed,
        total: row.total,
      },
      types: row.types_list ? row.types_list.split(',') : [],
      height: row.height,
      weight: row.weight,
      spriteDefault: row.sprite_default,
      spriteShiny: row.sprite_shiny,
      spriteIcon: row.sprite_icon,
      category: row.category,
      usagePct: row.usage_pct ?? 0,
      usageRank: row.usage_rank ?? 0,
    };
  }


  static async getByName(name: string): Promise<Pokemon | null> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`
      SELECT p.*, GROUP_CONCAT(t.type_name) as types_list
      FROM pokemon p
      LEFT JOIN pokemon_types t ON p.id = t.pokemon_id
      WHERE LOWER(p.name) = LOWER(?)
      GROUP BY p.id
    `, [name]);

    return rows.length > 0 ? this.mapRowToPokemon(rows[0]) : null;
  }
}

export class ItemDAO {
  static async upsert(item: { name: string; category: string; effect: string; sprite_url?: string; location?: string }) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO items (name, category, effect, sprite_url, location)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         category = excluded.category,
         effect = excluded.effect,
         sprite_url = excluded.sprite_url,
         location = excluded.location`,
      [item.name, item.category, item.effect, item.sprite_url || null, item.location || null]
    );
  }

  static async getAll(): Promise<Item[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM items ORDER BY category, name');
    return rows.map(row => this.mapRowToItem(row));
  }

  private static mapRowToItem(row: any): Item {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      effect: row.effect,
      spriteUrl: row.sprite_url,
      location: row.location,
    };
  }
}
