const fs = require('fs');

// --- POKEMON ---
console.log('Parsing pokemon...');
const pkmnHtml = fs.readFileSync('pokemon-champions.txt', 'utf8');

// Updated regex: capture dex number, image filename, and name
const pkmnRegex = /#(\d+)\s*<\/td>\s*<td[^>]*>[\s\S]*?<img src=".*?\/([^/"]+)\.png"[\s\S]*?<\/td>\s*<td[^>]*>\s*<a[^>]*>\s*([^<]+?)\s*(?:<br>)?<\/a>/g;
const pokemon = [];
let match;

const suffixMap = {
  '-a': '-alola',
  '-g': '-galar',
  '-h': '-hisui',
  '-p': '-paldea',
  '-e': '-eternal',
  '-m': '-mega',
  '-mx': '-mega-x',
  '-my': '-mega-y'
};

while ((match = pkmnRegex.exec(pkmnHtml)) !== null) {
  const dexNumber = parseInt(match[1]);
  const imgFile = match[2]; // e.g., "026-a" or "006-mx"
  let displayName = match[3].trim();
  
  // Extract suffix (everything after the first dash)
  const dashIndex = imgFile.indexOf('-');
  const suffix = dashIndex !== -1 ? imgFile.substring(dashIndex) : '';
  
  let name = displayName.toLowerCase().replace(/\s+/g, '-');
  
  // Special logic for variants
  if (suffix && suffixMap[suffix]) {
    // If it's a mega, handle the name specifically
    if (suffix.startsWith('-m')) {
        // Remove "mega-" prefix if displayName already had it to avoid "mega-charizard-mega-x"
        const baseName = displayName.replace('Mega ', '').toLowerCase().replace(/\s+/g, '-');
        name = `${baseName}${suffixMap[suffix]}`;
    } else {
        // For regional variants, the displayName is often just "Raichu", so we append the suffix
        name = `${name}${suffixMap[suffix]}`;
    }
  }

  pokemon.push({ dexNumber, name });
}

// Ensure uniqueness based on name (slug)
const uniquePkmn = [];
const seenNames = new Set();
for (const p of pokemon) {
    if (!seenNames.has(p.name)) {
        uniquePkmn.push(p);
        seenNames.add(p.name);
    }
}

const pkmnTs = `export const CHAMPIONS_POKEMON_LIST = ${JSON.stringify(uniquePkmn, null, 2)};`;
fs.writeFileSync('src/utils/pokemon-champions.ts', pkmnTs);
console.log(`Generated src/utils/pokemon-champions.ts with ${uniquePkmn.length} pokemon.`);


// --- ITEMS ---
console.log('Parsing items...');
let itemsHtml = fs.readFileSync('pokemon-items.txt', 'utf8');

const itemRegex = /<td class="fooinfo"><a href="[^"]*">([^<]+)<\/a><\/td>\s*<td class="fooinfo">([^<]+)<\/td>/g;
const allItems = [];
let iMatch;

while ((iMatch = itemRegex.exec(itemsHtml)) !== null) {
    let name = iMatch[1].trim();
    let effect = iMatch[2].trim()
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/\ufffd/g, 'TEMP_SYMBOL') // Temporarily mark broken symbols
        .replace(/PokTEMP_SYMBOLmon/g, 'Pokémon') // Specifically fix Pokémon
        .replace(/TEMP_SYMBOL/g, '—') // Replace remaining broken symbols with em-dash
        .replace(/\s*—\s*/g, ' — '); // Ensure clean spacing around dashes

    let category = 'Item';
    const lowerName = name.toLowerCase();
    const lowerEffect = effect.toLowerCase();

    if (lowerEffect.includes('mega evolve')) {
        category = 'Mega Stone';
    } else if (lowerName.endsWith('berry')) {
        category = 'Berries';
    } else if (lowerName.includes('choice ') || lowerName.includes('scarf') || lowerName.includes('band') || lowerName.includes('vest')) {
        category = 'Battle Item';
    }

    allItems.push({ name, effect, category });
}

const itemsTs = `export const CHAMPIONS_ITEMS_LIST = ${JSON.stringify(allItems, null, 2)};`;
fs.writeFileSync('src/utils/items-champions.ts', itemsTs);
console.log(`Generated src/utils/items-champions.ts with ${allItems.length} items.`);
