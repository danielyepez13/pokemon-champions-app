import { TeamDAO } from '../database/dao/team.dao';
import { PokemonDAO } from '../database/dao/pokemon.dao';
import { ItemDAO } from '../database/dao/item.dao';
import { AbilityDAO } from '../database/dao/ability.dao';
import { MoveDAO } from '../database/dao/move.dao';
import { PokepasteParser } from './pokepaste-parser';

export class TeamService {
    /**
     * Parses a Showdown Pokepaste and saves the team to the database.
     * - If a move is not in the DB, a stub record is created.
     * - If an item or ability is not in the DB, the link is skipped but
     *   the raw name is stored in the member's EVs JSON for reference (non-destructive).
     */
    static async importFromPokepaste(name: string, text: string): Promise<number> {
        const parsedTeam = PokepasteParser.parse(text);
        if (parsedTeam.length === 0) {
            throw new Error('No valid Pokemon found in paste. Check the format and try again.');
        }

        const teamId = await TeamDAO.createTeam(name);

        for (let i = 0; i < parsedTeam.length; i++) {
            const p = parsedTeam[i];

            // --- Resolve Pokemon ---
            const pokemon = await PokemonDAO.getByName(p.name);
            if (!pokemon || !pokemon.id) {
                console.warn(`[TeamService] Pokemon not found in DB: "${p.name}". Skipping.`);
                continue;
            }

            // --- Resolve Item (optional) ---
            let itemId: number | undefined;
            if (p.item) {
                const item = await ItemDAO.getByName(p.item);
                if (item?.id) {
                    itemId = item.id;
                } else {
                    console.warn(`[TeamService] Item not found in DB: "${p.item}". Will be stored as raw text.`);
                }
            }

            // --- Resolve Ability (optional) ---
            let abilityId: number | undefined;
            if (p.ability) {
                const ability = await AbilityDAO.getByName(p.ability);
                if (ability?.id) {
                    abilityId = ability.id;
                } else {
                    console.warn(`[TeamService] Ability not found in DB: "${p.ability}". Will be stored as raw text.`);
                }
            }

            // --- Save Member ---
            const memberId = await TeamDAO.addMember({
                teamId,
                pokemonId: pokemon.id,
                itemId,
                abilityId,
                // Store raw strings as fallbacks in case DB resolution failed
                rawItemName: !itemId && p.item ? p.item : undefined,
                rawAbilityName: !abilityId && p.ability ? p.ability : undefined,
                nature: p.nature,
                evs: JSON.stringify(p.evs),
                ivs: JSON.stringify(p.ivs),
                level: p.level,
                slot: i + 1,
            });

            // --- Resolve Moves (create stubs if not found) ---
            for (const moveName of p.moves) {
                if (!moveName) continue;
                const move = await MoveDAO.getOrCreateStub(moveName);
                await TeamDAO.addMove(memberId, move.id);
            }
        }

        return teamId;
    }
}
