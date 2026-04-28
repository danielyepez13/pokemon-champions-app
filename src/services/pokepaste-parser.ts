export interface ParsedPokemon {
    name: string;
    item?: string;
    ability?: string;
    level: number;
    nature?: string;
    evs: Record<string, number>;
    ivs: Record<string, number>;
    moves: string[];
}

export class PokepasteParser {
    static parse(text: string): ParsedPokemon[] {
        const blocks = text.trim().split(/\n\s*\n/);
        const team: ParsedPokemon[] = [];

        for (const block of blocks) {
            const lines = block.trim().split('\n');
            if (lines.length === 0) continue;

            const pokemon: ParsedPokemon = {
                name: '',
                level: 50,
                evs: {},
                ivs: {},
                moves: []
            };

            // Header line: Name (@ Item)
            // Handle: Nickname (Species) (M/F) @ Item
            // or: Species (M/F) @ Item
            const headerLine = lines[0].trim();
            const headerParts = headerLine.split('@');
            
            let namePart = headerParts[0].trim();
            
            // Regex to match Nickname (Species) or Species (M/F)
            // Group 1: Nickname or Species
            // Group 2: Potential Species or Gender
            // Group 3: Potential Gender
            const nameMatch = namePart.match(/^(.+?)(?:\s+\((.+?)\))?(?:\s+\((.+?)\))?$/);
            
            if (nameMatch) {
                const p1 = nameMatch[1].trim();
                const p2 = nameMatch[2]?.trim();
                const p3 = nameMatch[3]?.trim();

                if (p3) {
                    // Nickname (Species) (Gender)
                    pokemon.name = p2;
                } else if (p2) {
                    if (p2 === 'M' || p2 === 'F') {
                        // Species (Gender)
                        pokemon.name = p1;
                    } else {
                        // Nickname (Species)
                        pokemon.name = p2;
                    }
                } else {
                    // Species
                    pokemon.name = p1;
                }
            } else {
                pokemon.name = namePart;
            }

            if (headerParts.length > 1) {
                pokemon.item = headerParts[1].trim();
            }

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.startsWith('Ability:')) {
                    pokemon.ability = line.replace('Ability:', '').trim();
                } else if (line.startsWith('Level:')) {
                    pokemon.level = parseInt(line.replace('Level:', '').trim()) || 50;
                } else if (line.startsWith('EVs:')) {
                    const evsPart = line.replace('EVs:', '').trim();
                    evsPart.split('/').forEach(part => {
                        const [val, stat] = part.trim().split(/\s+/);
                        pokemon.evs[stat] = parseInt(val);
                    });
                } else if (line.startsWith('IVs:')) {
                    const ivsPart = line.replace('IVs:', '').trim();
                    ivsPart.split('/').forEach(part => {
                        const [val, stat] = part.trim().split(/\s+/);
                        pokemon.ivs[stat] = parseInt(val);
                    });
                } else if (line.match(/Nature$/)) {
                    pokemon.nature = line.replace('Nature', '').trim();
                } else if (line.startsWith('-')) {
                    const move = line.replace('-', '').trim();
                    if (move) pokemon.moves.push(move);
                }
            }
            
            if (pokemon.name) {
                team.push(pokemon);
            }
        }
        return team;
    }
}
