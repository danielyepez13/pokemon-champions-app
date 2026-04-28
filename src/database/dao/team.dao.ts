import { getDatabase } from '../database';

export interface Team {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: string;
    previews?: PreviewSprite[];
}

export interface PreviewSprite {
    dexNumber: number;
    form: string;
    spriteUrl: string | null;
}

export interface TeamMember {
    id: number;
    teamId: number;
    pokemonId: number;
    itemId?: number;
    abilityId?: number;
    rawItemName?: string;
    rawAbilityName?: string;
    nature?: string;
    evs: string; // JSON
    ivs: string; // JSON
    level: number;
    slot: number;
    moves?: string[];
}

export class TeamDAO {
    static async createTeam(name: string): Promise<number> {
        const db = await getDatabase();
        const result = await db.runAsync(
            'INSERT INTO teams (name) VALUES (?)',
            [name]
        );
        return result.lastInsertRowId;
    }

    static async addMember(member: Omit<TeamMember, 'id'>): Promise<number> {
        const db = await getDatabase();
        const result = await db.runAsync(
            `INSERT INTO team_members (
                team_id, pokemon_id, item_id, ability_id,
                raw_item_name, raw_ability_name,
                nature, evs, ivs, level, slot, team_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                member.teamId,
                member.pokemonId,
                member.itemId ?? null,
                member.abilityId ?? null,
                member.rawItemName ?? null,
                member.rawAbilityName ?? null,
                member.nature ?? null,
                member.evs,
                member.ivs,
                member.level,
                member.slot,
                member.slot, // team_order starts equal to slot
            ]
        );
        return result.lastInsertRowId;
    }

    static async addMove(memberId: number, moveId: number) {
        const db = await getDatabase();
        await db.runAsync(
            'INSERT OR IGNORE INTO member_moves (member_id, move_id) VALUES (?, ?)',
            [memberId, moveId]
        );
    }

    static async deleteTeam(teamId: number) {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM teams WHERE id = ?', [teamId]);
    }

    static async updateMemberOrders(updates: { id: number; teamOrder: number }[]) {
        const db = await getDatabase();
        for (const { id, teamOrder } of updates) {
            await db.runAsync(
                'UPDATE team_members SET team_order = ? WHERE id = ?',
                [teamOrder, id]
            );
        }
    }

    static async getAllTeams(): Promise<Team[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<any>('SELECT * FROM teams ORDER BY created_at DESC');
        const teams: Team[] = [];

        for (const row of rows) {
            const previews = await db.getAllAsync<any>(
                `SELECT p.dex_number, p.form, p.sprite_default as sprite_url
                 FROM team_members tm
                 JOIN pokemon p ON tm.pokemon_id = p.id
                 WHERE tm.team_id = ?
                 ORDER BY tm.team_order
                 LIMIT 6`,
                [row.id]
            );
            teams.push({
                id: row.id,
                name: row.name,
                isActive: row.is_active === 1,
                createdAt: row.created_at,
                previews: previews.map(p => ({
                    dexNumber: p.dex_number,
                    form: p.form ?? '',
                    spriteUrl: p.sprite_url ?? null,
                })),
            });
        }
        return teams;
    }

    static async getTeamWithMembers(teamId: number) {
        const db = await getDatabase();
        const team = await db.getFirstAsync<any>('SELECT * FROM teams WHERE id = ?', [teamId]);
        if (!team) return null;

        const members = await db.getAllAsync<any>(
            `SELECT tm.*,
                    p.name          as pokemon_name,
                    p.dex_number    as dex_number,
                    p.form          as form,
                    p.sprite_default as sprite_url,
                    p.hp            as base_hp,
                    p.attack        as base_atk,
                    p.defense       as base_def,
                    p.sp_attack     as base_spa,
                    p.sp_defense    as base_spd,
                    p.speed         as base_spe,
                    GROUP_CONCAT(pt.type_name) as types_list,
                    i.name          as item_name,
                    a.name          as ability_name
             FROM team_members tm
             JOIN pokemon p ON tm.pokemon_id = p.id
             LEFT JOIN pokemon_types pt ON pt.pokemon_id = p.id
             LEFT JOIN items i ON tm.item_id = i.id
             LEFT JOIN abilities a ON tm.ability_id = a.id
             WHERE tm.team_id = ?
             GROUP BY tm.id
             ORDER BY tm.team_order`,
            [teamId]
        );

        for (const member of members) {
            const moves = await db.getAllAsync<any>(
                `SELECT m.name 
                 FROM member_moves mm
                 JOIN moves m ON mm.move_id = m.id
                 WHERE mm.member_id = ?`,
                [member.id]
            );
            member.moves = moves.map(m => m.name);
        }

        return {
            ...team,
            members
        };
    }

    static async setActiveTeam(teamId: number) {
        const db = await getDatabase();
        await db.runAsync('UPDATE teams SET is_active = 0');
        await db.runAsync('UPDATE teams SET is_active = 1 WHERE id = ?', [teamId]);
    }

    static async getActiveTeam() {
        const db = await getDatabase();
        const team = await db.getFirstAsync<any>('SELECT * FROM teams WHERE is_active = 1');
        if (!team) return null;
        return this.getTeamWithMembers(team.id);
    }
}
