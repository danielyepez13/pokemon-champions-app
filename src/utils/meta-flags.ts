/**
 * Meta-relevant move and ability categories for Battle Preview alerts.
 *
 * These flags are used to quickly classify moves/abilities into tactical
 * categories during matchup analysis. Paired with Pikalytics usage data,
 * a move is only flagged if its usage % exceeds the configured threshold.
 *
 * All names use lowercase-hyphenated format to match PokeAPI/Pikalytics naming.
 */

// ─── Move Categories ─────────────────────────────────────────────

export const META_MOVE_FLAGS: Record<string, string[]> = {
  /** Moves that alter speed control in doubles */
  speed_control: [
    'tailwind',
    'trick-room',
    'icy-wind',
    'electroweb',
    'scary-face',
    'thunder-wave',
    'string-shot',
    'bulldoze',
    'rock-tomb',
  ],

  /** Moves that protect the team from spread attacks */
  spread_protection: [
    'wide-guard',
    'quick-guard',
  ],

  /** Moves that redirect attacks to the user */
  redirection: [
    'follow-me',
    'rage-powder',
    'ally-switch',
  ],

  /** Priority moves (positive priority bracket) */
  priority: [
    'fake-out',
    'extreme-speed',
    'aqua-jet',
    'bullet-punch',
    'sucker-punch',
    'grassy-glide',
    'ice-shard',
    'mach-punch',
    'shadow-sneak',
    'quick-attack',
    'accelerock',
    'first-impression',
    'upper-hand',
  ],

  /** Status spreading moves */
  status: [
    'will-o-wisp',
    'thunder-wave',
    'spore',
    'sleep-powder',
    'yawn',
    'toxic',
    'nuzzle',
    'glare',
    'hypnosis',
    'lovely-kiss',
    'sing',
    'dark-void',
  ],

  /** Setup moves that boost stats */
  setup: [
    'swords-dance',
    'calm-mind',
    'nasty-plot',
    'dragon-dance',
    'quiver-dance',
    'coil',
    'iron-defense',
    'bulk-up',
    'shell-smash',
    'geomancy',
    'belly-drum',
  ],

  /** Pivoting moves */
  pivot: [
    'u-turn',
    'volt-switch',
    'flip-turn',
    'parting-shot',
    'teleport',
  ],

  /** Protective moves */
  protection: [
    'protect',
    'detect',
    'kings-shield',
    "king's-shield",
    'baneful-bunker',
    'spiky-shield',
    'silk-trap',
    'obstruct',
    'burning-bulwark',
  ],

  /** Team support */
  support: [
    'helping-hand',
    'coaching',
    'life-dew',
    'heal-pulse',
    'pollen-puff',
    'aurora-veil',
    'light-screen',
    'reflect',
    'tailwind',
    'fake-tears',
  ],

  /** Disruptive moves */
  disruption: [
    'taunt',
    'encore',
    'imprison',
    'disable',
    'knock-off',
    'trick',
    'switcheroo',
    'perish-song',
  ],
};

// ─── Ability Categories ──────────────────────────────────────────

export const META_ABILITY_FLAGS: Record<string, string[]> = {
  /** Abilities that punish Intimidate users */
  anti_intimidate: [
    'defiant',
    'competitive',
    'inner-focus',
    'clear-body',
    'hyper-cutter',
    'full-metal-body',
    'white-smoke',
    'mirror-armor',
  ],

  /** Abilities that use Intimidate */
  intimidate_user: [
    'intimidate',
  ],

  /** Abilities that set weather on switch-in */
  weather_setter: [
    'drizzle',
    'drought',
    'sand-stream',
    'snow-warning',
  ],

  /** Abilities that benefit from weather */
  weather_abuser: [
    'swift-swim',
    'chlorophyll',
    'sand-rush',
    'slush-rush',
    'solar-power',
  ],

  /** Abilities that set terrain */
  terrain_setter: [
    'electric-surge',
    'grassy-surge',
    'psychic-surge',
    'misty-surge',
  ],

  /** Abilities with priority manipulation */
  priority_control: [
    'prankster',
    'gale-wings',
    'triage',
    'armor-tail',
    'dazzling',
    'queenly-majesty',
  ],

  /** Abilities that redirect or absorb attacks */
  redirect_absorb: [
    'lightning-rod',
    'storm-drain',
    'flash-fire',
    'sap-sipper',
    'levitate',
    'motor-drive',
    'water-absorb',
    'volt-absorb',
    'dry-skin',
  ],
};

// ─── Utility Functions ───────────────────────────────────────────

/**
 * Given a move name, returns all categories it belongs to.
 * Returns empty array if the move isn't meta-relevant.
 */
export function getMoveFlags(moveName: string): string[] {
  const name = moveName.toLowerCase();
  const flags: string[] = [];
  for (const [category, moves] of Object.entries(META_MOVE_FLAGS)) {
    if (moves.includes(name)) {
      flags.push(category);
    }
  }
  return flags;
}

/**
 * Given an ability name, returns all categories it belongs to.
 * Returns empty array if the ability isn't meta-relevant.
 */
export function getAbilityFlags(abilityName: string): string[] {
  const name = abilityName.toLowerCase();
  const flags: string[] = [];
  for (const [category, abilities] of Object.entries(META_ABILITY_FLAGS)) {
    if (abilities.includes(name)) {
      flags.push(category);
    }
  }
  return flags;
}

/**
 * Checks if a move belongs to a specific category.
 */
export function isMoveInCategory(moveName: string, category: string): boolean {
  const moves = META_MOVE_FLAGS[category];
  if (!moves) return false;
  return moves.includes(moveName.toLowerCase());
}

/**
 * Checks if an ability belongs to a specific category.
 */
export function isAbilityInCategory(abilityName: string, category: string): boolean {
  const abilities = META_ABILITY_FLAGS[category];
  if (!abilities) return false;
  return abilities.includes(abilityName.toLowerCase());
}

// ─── Flag Icons (for UI display) ─────────────────────────────────

export const MOVE_FLAG_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  speed_control:     { icon: '🌪️', label: 'Speed Control',     color: '#818cf8' },
  spread_protection: { icon: '🛡️', label: 'Spread Protect',    color: '#3b82f6' },
  redirection:       { icon: '🎯', label: 'Redirect',          color: '#f97316' },
  priority:          { icon: '⚡',  label: 'Priority',          color: '#eab308' },
  status:            { icon: '💀', label: 'Status',             color: '#8b5cf6' },
  setup:             { icon: '📈', label: 'Setup',              color: '#10b981' },
  pivot:             { icon: '🔄', label: 'Pivot',              color: '#06b6d4' },
  protection:        { icon: '🔰', label: 'Protect',            color: '#64748b' },
  support:           { icon: '💊', label: 'Support',            color: '#ec4899' },
  disruption:        { icon: '🚫', label: 'Disruption',         color: '#ef4444' },
};

export const ABILITY_FLAG_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  anti_intimidate:   { icon: '🔴', label: 'Anti-Intimidate',   color: '#ef4444' },
  intimidate_user:   { icon: '😤', label: 'Intimidate',        color: '#f97316' },
  weather_setter:    { icon: '☁️',  label: 'Weather Setter',    color: '#3b82f6' },
  weather_abuser:    { icon: '🌤️', label: 'Weather Abuser',    color: '#06b6d4' },
  terrain_setter:    { icon: '🌍', label: 'Terrain Setter',    color: '#10b981' },
  priority_control:  { icon: '⏩', label: 'Priority Control',  color: '#eab308' },
  redirect_absorb:   { icon: '🧲', label: 'Redirect/Absorb',   color: '#8b5cf6' },
};
