import { getDatabase } from '../database';
import { Item } from '../../models/pokemon';

export class ItemDAO {
  static async upsert(item: Partial<Item>) {
    if (!item.name) return;
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO items (name, category, effect, sprite_url, location) VALUES (?, ?, ?, ?, ?)',
      [item.name, item.category || 'misc', item.effect || null, item.spriteUrl || null, item.location || null]
    );
  }

  static async getAll(): Promise<Item[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM items ORDER BY name ASC');
    return rows.map(row => this.mapRow(row));
  }

  static async getByName(name: string): Promise<Item | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM items WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    return row ? this.mapRow(row) : null;
  }

  private static mapRow(row: any): Item {
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
