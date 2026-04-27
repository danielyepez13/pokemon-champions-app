import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../config/constants';

let db: SQLite.SQLiteDatabase | null = null;

export const resetDatabase = async () => {
  console.log('[Database] Resetting database...');
  const database = await getDatabase();
  await database.execAsync('PRAGMA foreign_keys = OFF;');
  await database.execAsync('DROP TABLE IF EXISTS pokemon_types;');
  await database.execAsync('DROP TABLE IF EXISTS pokemon_abilities;');
  await database.execAsync('DROP TABLE IF EXISTS pokemon_moves;');
  await database.execAsync('DROP TABLE IF EXISTS pokemon_items;');
  await database.execAsync('DROP TABLE IF EXISTS pokemon_fts;');
  await database.execAsync('DROP TABLE IF EXISTS pokemon;');
  await database.execAsync('DROP TABLE IF EXISTS items;');
  await database.execAsync('DROP TABLE IF EXISTS abilities;');
  await database.execAsync('DROP TABLE IF EXISTS moves;');
  await database.execAsync('DROP TABLE IF EXISTS sync_log;');
  await database.execAsync('DROP TABLE IF EXISTS sync_metadata;');
  await database.execAsync('PRAGMA foreign_keys = ON;');
  console.log('[Database] Database dropped. Re-initializing...');
  await initDatabase();
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  
  // Uncomment these lines to reset the database if schema changes
  // await db.execAsync('DROP TABLE IF EXISTS pokemon_types');
  // await db.execAsync('DROP TABLE IF EXISTS pokemon_fts');
  // await db.execAsync('DROP TABLE IF EXISTS pokemon');
  // await db.execAsync('DROP TABLE IF EXISTS items');
  // await db.execAsync('DROP TABLE IF EXISTS sync_logs');

  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
};

export const initDatabase = async () => {
  console.log('[Database] Initializing SQLite database...');
  const database = await getDatabase();

  // Pokémon base table
  console.log('[Database] Creating tables...');
  
  // Migration: Add columns if they don't exist
  try {
    const tableInfo = await database.getAllAsync<any>("PRAGMA table_info(pokemon)");
    if (tableInfo.length > 0) {
      const hasDescription = tableInfo.some(col => col.name === 'description');
      const hasForm = tableInfo.some(col => col.name === 'form');
      const hasIsMega = tableInfo.some(col => col.name === 'is_mega');

      if (!hasDescription) {
        console.log('[Database] Migrating: Adding description column');
        await database.execAsync('ALTER TABLE pokemon ADD COLUMN description TEXT;');
      }
      if (!hasForm) {
        console.log('[Database] Migrating: Adding form column');
        await database.execAsync('ALTER TABLE pokemon ADD COLUMN form TEXT NOT NULL DEFAULT "";');
      }
      if (!hasIsMega) {
        console.log('[Database] Migrating: Adding is_mega column');
        await database.execAsync('ALTER TABLE pokemon ADD COLUMN is_mega INTEGER DEFAULT 0;');
      }
    }
  } catch (e) {
    console.error('[Database] Migration error:', e);
  }

  // Create tables individually
  const statements = [
    `CREATE TABLE IF NOT EXISTS pokemon (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      dex_number      INTEGER NOT NULL,
      name            TEXT NOT NULL,
      form            TEXT NOT NULL DEFAULT '',
      description     TEXT,
      is_mega         INTEGER DEFAULT 0,
      hp              INTEGER,
      attack          INTEGER,
      defense         INTEGER,
      sp_attack       INTEGER,
      sp_defense      INTEGER,
      speed           INTEGER,
      total           INTEGER,
      height          REAL,
      weight          REAL,
      sprite_default  TEXT,
      sprite_shiny    TEXT,
      sprite_icon     TEXT,
      category        TEXT,
      UNIQUE(dex_number, form)
    );`,
    `CREATE TABLE IF NOT EXISTS pokemon_types (
      pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
      type_name  TEXT NOT NULL,
      slot       INTEGER NOT NULL,
      PRIMARY KEY (pokemon_id, slot)
    );`,
    `CREATE TABLE IF NOT EXISTS abilities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL UNIQUE,
      effect      TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS pokemon_abilities (
      pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
      ability_id INTEGER NOT NULL REFERENCES abilities(id),
      is_hidden   INTEGER DEFAULT 0,
      PRIMARY KEY (pokemon_id, ability_id)
    );`,
    `CREATE TABLE IF NOT EXISTS moves (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL UNIQUE,
      type        TEXT,
      category    TEXT,
      power       INTEGER,
      accuracy    INTEGER,
      pp          INTEGER,
      effect      TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS pokemon_moves (
      pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
      move_name  TEXT NOT NULL,
      method     TEXT,
      PRIMARY KEY (pokemon_id, move_name)
    );`,
    `CREATE TABLE IF NOT EXISTS items (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL UNIQUE,
      category      TEXT NOT NULL,
      effect        TEXT,
      sprite_url    TEXT,
      location      TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS pokemon_items (
      pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
      item_id    INTEGER NOT NULL REFERENCES items(id),
      PRIMARY KEY (pokemon_id, item_id)
    );`,
    `CREATE TABLE IF NOT EXISTS sync_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
      phase           TEXT NOT NULL,
      records_total   INTEGER,
      records_ok      INTEGER,
      records_error   INTEGER,
      status          TEXT NOT NULL,
      error_detail    TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS sync_metadata (
      key   TEXT PRIMARY KEY,
      value TEXT
    );`
  ];

  for (const sql of statements) {
    try {
      await database.execAsync(sql);
    } catch (e) {
      console.error(`[Database] Error executing statement: ${sql.substring(0, 50)}...`, e);
    }
  }

  // FTS5 might fail if not supported, so we try it separately
  try {
    await database.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS pokemon_fts USING fts5(
        name, dex_number, content='pokemon', content_rowid='id'
      );
    `);
    
    // Triggers for FTS5
    await database.execAsync(`
      CREATE TRIGGER IF NOT EXISTS pokemon_ai AFTER INSERT ON pokemon BEGIN
        INSERT INTO pokemon_fts(rowid, name, dex_number) VALUES (new.id, new.name, new.dex_number);
      END;
    `);
    await database.execAsync(`
      CREATE TRIGGER IF NOT EXISTS pokemon_ad AFTER DELETE ON pokemon BEGIN
        INSERT INTO pokemon_fts(pokemon_fts, rowid, name, dex_number) VALUES('delete', old.id, old.name, old.dex_number);
      END;
    `);
    await database.execAsync(`
      CREATE TRIGGER IF NOT EXISTS pokemon_au AFTER UPDATE ON pokemon BEGIN
        INSERT INTO pokemon_fts(pokemon_fts, rowid, name, dex_number) VALUES('delete', old.id, old.name, old.dex_number);
        INSERT INTO pokemon_fts(rowid, name, dex_number) VALUES (new.id, new.name, new.dex_number);
      END;
    `);
  } catch (e) {
    console.warn('[Database] FTS5 not supported or error creating FTS table/triggers:', e);
  }

  console.log('[Database] Database initialization complete.');
};
