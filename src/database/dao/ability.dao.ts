import { getDatabase } from '../database';
import { Ability } from '../../models/pokemon';

export class AbilityDAO {
  static async upsert(ability: Partial<Ability>) {
    if (!ability.name) return;
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO abilities (name, effect) VALUES (?, ?)',
      [ability.name, ability.effect || null]
    );
  }

  static async getByName(name: string): Promise<Ability | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM abilities WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      effect: row.effect,
      isHidden: row.is_hidden
    };
  }

  static async getAll(): Promise<Ability[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM abilities ORDER BY name ASC');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      effect: row.effect,
      isHidden: row.is_hidden
    }));
  }
}
