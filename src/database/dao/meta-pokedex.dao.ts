import { getDatabase } from '../database';
import { TeammateEntry, FeaturedTeam } from '../../services/pikalytics-service';

// ─── Meta Teammates DAO ───────────────────────────────────────────────────────

export class MetaTeammatesDAO {
  /**
   * Replaces all teammates for a given Pokémon with the new list.
   */
  static async upsert(pokemonName: string, teammates: TeammateEntry[]): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM meta_teammates WHERE pokemon_name = ?',
      [pokemonName]
    );
    for (const t of teammates) {
      await db.runAsync(
        `INSERT INTO meta_teammates (pokemon_name, teammate_name, usage_pct)
         VALUES (?, ?, ?)
         ON CONFLICT(pokemon_name, teammate_name) DO UPDATE SET
           usage_pct = excluded.usage_pct,
           synced_at = datetime('now')`,
        [pokemonName, t.name, t.usagePct]
      );
    }
  }

  /**
   * Returns all common teammates for a given Pokémon, ordered by usage.
   */
  static async getByPokemon(pokemonName: string): Promise<TeammateEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT teammate_name, usage_pct
       FROM meta_teammates
       WHERE pokemon_name = ?
       ORDER BY usage_pct DESC`,
      [pokemonName]
    );
    return rows.map(r => ({ name: r.teammate_name, usagePct: r.usage_pct }));
  }

  /**
   * Clears all teammates for a Pokémon (used before re-sync).
   */
  static async clearByPokemon(pokemonName: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM meta_teammates WHERE pokemon_name = ?', [pokemonName]);
  }

  /**
   * Clears ALL teammate data (used in clean sync).
   */
  static async clearAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM meta_teammates');
  }
}

// ─── Featured Teams DAO ───────────────────────────────────────────────────────

export class FeaturedTeamsDAO {
  /**
   * Replaces all featured teams for a given Pokémon with the new list.
   */
  static async upsert(pokemonName: string, teams: FeaturedTeam[]): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM featured_teams WHERE pokemon_name = ?',
      [pokemonName]
    );
    for (const team of teams) {
      await db.runAsync(
        `INSERT INTO featured_teams
           (pokemon_name, player, record, event, team_members, focus_ability, focus_item, focus_moves)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pokemonName,
          team.player,
          team.record,
          team.event,
          JSON.stringify(team.pokemon),
          team.focusSet.ability,
          team.focusSet.item,
          JSON.stringify(team.focusSet.moves),
        ]
      );
    }
  }

  /**
   * Returns all featured teams for a given Pokémon.
   */
  static async getByPokemon(pokemonName: string): Promise<FeaturedTeam[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT player, record, event, team_members, focus_ability, focus_item, focus_moves
       FROM featured_teams
       WHERE pokemon_name = ?
       ORDER BY id ASC`,
      [pokemonName]
    );
    return rows.map(r => ({
      player: r.player ?? '',
      record: r.record ?? '',
      event: r.event ?? '',
      pokemon: JSON.parse(r.team_members ?? '[]') as string[],
      focusSet: {
        ability: r.focus_ability ?? '',
        item: r.focus_item ?? '',
        moves: JSON.parse(r.focus_moves ?? '[]') as string[],
      },
    }));
  }

  /**
   * Clears all featured teams for a Pokémon.
   */
  static async clearByPokemon(pokemonName: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM featured_teams WHERE pokemon_name = ?', [pokemonName]);
  }

  /**
   * Clears ALL featured teams (used in clean sync).
   */
  static async clearAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM featured_teams');
  }
}
