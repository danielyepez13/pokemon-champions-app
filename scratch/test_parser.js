const fs = require('fs');

const testPaste = `Jolteon @ Focus Sash  
Ability: Volt Absorb  
Level: 50  
EVs: 1 HP / 1 Def / 32 SpA / 32 Spe  
Timid Nature  
- Thunderbolt  
- Electroweb  
- Fake Tears  
- Protect  

Arcanine-Hisui @ Chople Berry  
Ability: Intimidate  
Level: 50  
EVs: 9 HP / 32 Atk / 1 Def / 1 SpD / 23 Spe  
Adamant Nature  
- Flare Blitz  
- Rock Slide  
- Extreme Speed  
- Protect  

Froslass-Mega (F) @ Froslassite  
Ability: Cursed Body  
Level: 50  
EVs: 2 Def / 31 SpA / 1 SpD / 32 Spe  
Modest Nature  
- Blizzard  
- Shadow Ball  
- Substitute  
- Protect  

Garchomp @ Choice Scarf  
Ability: Rough Skin  
Level: 50  
EVs: 6 HP / 32 Atk / 1 Def / 27 Spe  
Adamant Nature  
- Dragon Claw  
- Earthquake  
- Stomping Tantrum  
- Rock Slide  

Hydreigon @ Sitrus Berry  
Ability: Levitate  
Level: 50  
EVs: 7 HP / 1 Def / 30 SpA / 1 SpD / 27 Spe  
Modest Nature  
- Draco Meteor  
- Dark Pulse  
- Snarl  
- Protect  

Sneasler @ White Herb  
Ability: Unburden  
Level: 50  
EVs: 32 Atk / 2 Def / 32 Spe  
Adamant Nature  
- Close Combat  
- Dire Claw  
- Rock Tomb  
- Protect  `;

function parsePokepaste(text) {
    const blocks = text.trim().split(/\n\s*\n/);
    const team = [];

    for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length === 0) continue;

        const pokemon = {
            name: '',
            item: '',
            ability: '',
            level: 100,
            nature: '',
            evs: {},
            moves: []
        };

        // Header line: Name (@ Item)
        const headerMatch = lines[0].match(/^([^@]+)(?:@\s*(.+))?$/);
        if (headerMatch) {
            pokemon.name = headerMatch[1].trim().replace(/\s\([MF]\)$/, ''); // Remove gender
            pokemon.item = headerMatch[2] ? headerMatch[2].trim() : '';
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('Ability:')) {
                pokemon.ability = line.replace('Ability:', '').trim();
            } else if (line.startsWith('Level:')) {
                pokemon.level = parseInt(line.replace('Level:', '').trim());
            } else if (line.startsWith('EVs:')) {
                const evsPart = line.replace('EVs:', '').trim();
                evsPart.split('/').forEach(part => {
                    const [val, stat] = part.trim().split(/\s+/);
                    pokemon.evs[stat] = parseInt(val);
                });
            } else if (line.match(/Nature$/)) {
                pokemon.nature = line.replace('Nature', '').trim();
            } else if (line.startsWith('-')) {
                pokemon.moves.push(line.replace('-', '').trim());
            }
        }
        team.push(pokemon);
    }
    return team;
}

const parsedTeam = parsePokepaste(testPaste);
console.log(JSON.stringify(parsedTeam, null, 2));
