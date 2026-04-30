export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  total: number;
}

export interface Pokemon {
  id: number;
  dexNumber: number;
  name: string;
  form: string;
  description: string;
  isMega: boolean;
  stats: Stats;
  height: number;
  weight: number;
  spriteDefault: string;
  spriteShiny: string;
  spriteIcon: string;
  category: string;
  types: string[];
  usagePct: number;
  usageRank: number;
}


export interface Ability {
  id: number;
  name: string;
  effect: string;
  isHidden: boolean;
}

export interface Move {
  id: number;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect: string;
  method?: string;
}

export interface Item {
  id: number;
  name: string;
  category: string;
  effect: string;
  spriteUrl: string;
  location?: string;
}
