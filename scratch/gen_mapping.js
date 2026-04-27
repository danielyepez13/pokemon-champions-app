const fs = require('fs');
const path = require('path');

const pokemonDir = path.join(__dirname, '../assets/imagenes_pokemon');
const itemsDir = path.join(__dirname, '../assets/imagenes_items');
const outputFile = path.join(__dirname, '../src/utils/image-mapping.ts');

function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.png'));
}

const pokemonFiles = getFiles(pokemonDir);
const itemFiles = getFiles(itemsDir);

let content = '// This file is auto-generated. Do not edit manually.\n\n';

content += 'export const POKEMON_IMAGES: Record<string, any> = {\n';
pokemonFiles.forEach(file => {
  const key = file.replace('.png', '');
  content += `  '${key}': require('@/assets/imagenes_pokemon/${file}'),\n`;
});
content += '};\n\n';

content += 'export const ITEM_IMAGES: Record<string, any> = {\n';
itemFiles.forEach(file => {
  const key = file.replace('.png', '');
  content += `  '${key}': require('@/assets/imagenes_items/${file}'),\n`;
});
content += '};\n';

fs.writeFileSync(outputFile, content);
console.log(`Generated mapping for ${pokemonFiles.length} pokemon and ${itemFiles.length} items at ${outputFile}`);
