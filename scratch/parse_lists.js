const fs = require('fs');

// --- POKEMON ---
console.log('Parsing pokemon...');
const pkmnHtml = fs.readFileSync('pokemon-champions.txt', 'utf8');
// Updated regex: handle whitespace/newlines around #XXX and name
const pkmnRegex = /#(\d+)\s*<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>\s*<a[^>]*>\s*([^<]+?)\s*(?:<br>)?<\/a>/g;
const pokemon = [];
let match;

while ((match = pkmnRegex.exec(pkmnHtml)) !== null) {
  const dexNumber = parseInt(match[1]);
  let name = match[2].trim();
  
  if (name.startsWith('Mega ')) {
    const baseName = name.replace('Mega ', '');
    if (baseName.endsWith(' X')) {
        name = `${baseName.replace(' X', '')}-mega-x`;
    } else if (baseName.endsWith(' Y')) {
        name = `${baseName.replace(' Y', '')}-mega-y`;
    } else {
        name = `${baseName}-mega`;
    }
  }
  
  pokemon.push({ dexNumber, name });
}

const uniquePkmn = [];
const seen = new Set();
for (const p of pokemon) {
    const key = `${p.dexNumber}-${p.name.toLowerCase()}`;
    if (!seen.has(key)) {
        uniquePkmn.push(p);
        seen.add(key);
    }
}

const pkmnTs = `export const CHAMPIONS_POKEMON_LIST = ${JSON.stringify(uniquePkmn, null, 2)};`;
fs.writeFileSync('src/utils/pokemon-champions.ts', pkmnTs);
console.log(`Generated src/utils/pokemon-champions.ts with ${uniquePkmn.length} pokemon.`);

// --- ITEMS ---
console.log('Parsing items...');
const itemsHtml = fs.readFileSync('pokemon-items.txt', 'utf8');

const itemRegex = /<td class="fooinfo"><a href="[^"]*">([^<]+)<\/a><\/td>\s*<td class="fooinfo">([^<]+)<\/td>/g;
const allItems = [];
let iMatch;

// Instead of splitting, we can just find all items and try to determine category from surrounding text if needed,
// but let's stick to simple extraction first to see why it failed.
while ((iMatch = itemRegex.exec(itemsHtml)) !== null) {
    allItems.push({
        name: iMatch[1].trim(),
        effect: iMatch[2].trim().replace(/Pokmon/g, 'Pokémon'),
        category: 'Item' // Default category
    });
}

// Post-process categories based on item names (e.g. "ite" for Mega Stones, "Berry" for Berries)
allItems.forEach(item => {
    if (item.name.endsWith('ite') || item.name.includes('ite ')) item.category = 'Mega Stone';
    if (item.name.endsWith('Berry')) item.category = 'Berries';
});

const itemsTs = `export const CHAMPIONS_ITEMS_LIST = ${JSON.stringify(allItems, null, 2)};`;
fs.writeFileSync('src/utils/items-champions.ts', itemsTs);
console.log(`Generated src/utils/items-champions.ts with ${allItems.length} items.`);
