import { TeamDAO } from '../database/dao/team.dao';
import { PokemonDAO } from '../database/dao/pokemon.dao';
import { ItemDAO } from '../database/dao/item.dao';
import { AbilityDAO } from '../database/dao/ability.dao';
import { MoveDAO } from '../database/dao/move.dao';
import { PokepasteParser } from './pokepaste-parser';
import { SyncOrchestrator } from './sync-orchestrator';
import { isOnline } from '../utils/network';

export class TeamService {
    /**
     * Parses a Showdown Pokepaste and saves the team to the database.
     *
     * If a Pokémon is not found locally:
     *   - If online  → fetches it from Pikalytics + PokeAPI and stores it, then continues.
     *   - If offline → throws an error listing which Pokémon are missing so the UI can inform the user.
     *
     * Items and abilities that are not in the DB are stored as raw text (non-destructive).
     */
    static async importFromPokepaste(name: string, text: string): Promise<number> {
        const parsedTeam = PokepasteParser.parse(text);
        if (parsedTeam.length === 0) {
            throw new Error('No valid Pokémon found in paste. Check the format and try again.');
        }

        // ── Pre-flight: detect all missing Pokémon before creating the team ────
        const missingNames: string[] = [];
        for (const p of parsedTeam) {
            const existing = await PokemonDAO.getByName(p.name);
            if (!existing) missingNames.push(p.name);
        }

        if (missingNames.length > 0) {
            const online = await isOnline();
            if (!online) {
                // Offline: cannot fetch — surface a clear error with the missing names
                throw new Error(
                    `Internet connection required to load missing Pokémon data:\n${missingNames.join(', ')}\n\nPlease connect to the internet and try again.`
                );
            }

            // Online: fetch each missing Pokémon from Pikalytics + PokeAPI
            console.log(`[TeamService] Fetching ${missingNames.length} missing Pokémon from Pikalytics...`);
            for (const missingName of missingNames) {
                const result = await SyncOrchestrator.fetchAndStoreSinglePokemon(missingName);
                if (result === 'error') {
                    console.warn(`[TeamService] Could not fetch "${missingName}" from Pikalytics. It will be skipped.`);
                } else {
                    console.log(`[TeamService] "${missingName}" → ${result}`);
                }
            }
        }

        // ── Create team and add all members ─────────────────────────────────────
        const teamId = await TeamDAO.createTeam(name);

        for (let i = 0; i < parsedTeam.length; i++) {
            const p = parsedTeam[i];

            // Resolve Pokémon (now guaranteed to be in DB if fetch succeeded)
            const pokemon = await PokemonDAO.getByName(p.name);
            if (!pokemon || !pokemon.id) {
                // Only reaches here if fetchAndStoreSinglePokemon returned 'error'
                console.warn(`[TeamService] "${p.name}" not available locally. Skipping member.`);
                continue;
            }

            // Resolve Item (optional — store raw name if not in DB)
            let itemId: number | undefined;
            if (p.item) {
                const item = await ItemDAO.getByName(p.item);
                if (item?.id) {
                    itemId = item.id;
                } else {
                    console.warn(`[TeamService] Item "${p.item}" not in DB — stored as raw text.`);
                }
            }

            // Resolve Ability (optional — store raw name if not in DB)
            let abilityId: number | undefined;
            if (p.ability) {
                const ability = await AbilityDAO.getByName(p.ability);
                if (ability?.id) {
                    abilityId = ability.id;
                } else {
                    console.warn(`[TeamService] Ability "${p.ability}" not in DB — stored as raw text.`);
                }
            }

            // Save member
            const memberId = await TeamDAO.addMember({
                teamId,
                pokemonId: pokemon.id,
                itemId,
                abilityId,
                rawItemName: !itemId && p.item ? p.item : undefined,
                rawAbilityName: !abilityId && p.ability ? p.ability : undefined,
                nature: p.nature,
                evs: JSON.stringify(p.evs),
                ivs: JSON.stringify(p.ivs),
                level: p.level,
                slot: i + 1,
            });

            // Resolve Moves (create stubs if not found)
            for (const moveName of p.moves) {
                if (!moveName) continue;
                const move = await MoveDAO.getOrCreateStub(moveName);
                await TeamDAO.addMove(memberId, move.id);
            }
        }

        return teamId;
    }
}
