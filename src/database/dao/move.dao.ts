import { getDatabase } from '../database';

export interface Move {
  id: number;
  name: string;
  type?: string;
  category?: string;
  power?: number;
  accuracy?: number;
  pp?: number;
  effect?: string;
}

export class MoveDAO {
  static async upsert(move: Partial<Move>) {
    if (!move.name) return;
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO moves (name, type, category, power, accuracy, pp, effect)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         type = COALESCE(excluded.type, type),
         category = COALESCE(excluded.category, category),
         power = COALESCE(excluded.power, power),
         accuracy = COALESCE(excluded.accuracy, accuracy),
         pp = COALESCE(excluded.pp, pp),
         effect = COALESCE(excluded.effect, effect)`,
      [
        move.name,
        move.type ?? null,
        move.category ?? null,
        move.power ?? null,
        move.accuracy ?? null,
        move.pp ?? null,
        move.effect ?? null,
      ]
    );
  }

  /** Returns existing move or creates a stub if not found. */
  static async getOrCreateStub(name: string): Promise<Move> {
    const db = await getDatabase();
    let row = await db.getFirstAsync<any>(
      'SELECT * FROM moves WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    if (!row) {
      console.log(`[MoveDAO] Creating stub for move: ${name}`);
      await this.upsert({ name });
      row = await db.getFirstAsync<any>(
        'SELECT * FROM moves WHERE LOWER(name) = LOWER(?)',
        [name]
      );
    }
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      power: row.power,
      accuracy: row.accuracy,
      pp: row.pp,
      effect: row.effect,
    };
  }

  static async getByName(name: string): Promise<Move | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM moves WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    return row ?? null;
  }

  static async getAll(): Promise<Move[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM moves ORDER BY name ASC');
    return rows;
  }
}
