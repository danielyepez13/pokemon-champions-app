import { getDatabase } from '../database';

export class SyncDAO {
  static async logStart(phase: string) {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO sync_log (phase, status) VALUES (?, ?)',
      [phase, 'running']
    );
    return result.lastInsertRowId;
  }

  static async logUpdate(id: number, ok: number, error: number, total: number) {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE sync_log SET records_ok = ?, records_error = ?, records_total = ? WHERE id = ?',
      [ok, error, total, id]
    );
  }

  static async logComplete(id: number) {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE sync_log SET status = 'completed' WHERE id = ?",
      [id]
    );
  }

  static async logFailure(id: number, error: string) {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE sync_log SET status = 'failed', error_detail = ? WHERE id = ?",
      [error, id]
    );
  }

  static async setMetadata(key: string, value: string) {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  static async getMetadata(key: string): Promise<string | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      [key]
    );
    return result?.value || null;
  }
}
