export const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a29e',
  fire: '#ef4444',
  water: '#3b82f6',
  electric: '#eab308',
  grass: '#10b981',
  ice: '#0ea5e9',
  fighting: '#dc2626',
  poison: '#8b5cf6',
  ground: '#d97706',
  flying: '#818cf8',
  psychic: '#ec4899',
  bug: '#84cc16',
  rock: '#b45309',
  ghost: '#a855f7',
  dragon: '#6366f1',
  dark: '#3f3f46',
  steel: '#64748b',
  fairy: '#f472b6',
  default: '#d4af37' // The Gold accent color
};

export const getTypeColor = (type: string) => {
  return TYPE_COLORS[type.toLowerCase()] || TYPE_COLORS.default;
};
