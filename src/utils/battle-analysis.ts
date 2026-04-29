/**
 * Battle Analysis Engine
 *
 * Computes heatmap scores, speed comparisons, and tactical alerts
 * for the Battle Preview screen. Combines type-chart data with
 * Pikalytics meta usage to produce actionable warnings.
 */

import { getMatchupScore, getMatchupLabel, MatchupLabel } from './type-chart';
import { getMoveFlags, getAbilityFlags, MOVE_FLAG_ICONS, ABILITY_FLAG_ICONS } from './meta-flags';
import { calcStat } from './stat-calculator';
import { MetaUsageDAO } from '../database/dao/meta-usage.dao';
import { Pokemon } from '../models/pokemon';

// ─── Constants ────────────────────────────────────────────────────

const MAX_EV = 32;       // Pokémon Champions format
const MAX_IV = 31;

// ─── Heatmap ──────────────────────────────────────────────────────

export interface HeatmapCell {
  myIndex: number;
  enemyIndex: number;
  score: number;
  label: MatchupLabel;
  /** Color hex to display in cell */
  color: string;
}

const LABEL_COLORS: Record<MatchupLabel, string> = {
  dominant:    '#15803d', // green-700
  favorable:   '#4ade80', // green-400
  neutral:     '#374151', // gray-700
  unfavorable: '#f97316', // orange
  dangerous:   '#dc2626', // red-600
};

/**
 * Builds the full 6x6 heatmap matrix.
 *
 * @param myTeam    - Your active team (up to 6)
 * @param enemyTeam - Enemy team (up to 6, nulls for empty slots)
 */
export function buildHeatmap(
  myTeam: Pokemon[],
  enemyTeam: (Pokemon | null)[]
): HeatmapCell[][] {
  return myTeam.map((mine, myIdx) =>
    enemyTeam.map((enemy, enemyIdx) => {
      if (!enemy) {
        return {
          myIndex: myIdx,
          enemyIndex: enemyIdx,
          score: 0,
          label: 'neutral' as MatchupLabel,
          color: '#1f2937',
        };
      }

      const score = getMatchupScore(mine.types, enemy.types);
      const label = getMatchupLabel(score);
      return {
        myIndex: myIdx,
        enemyIndex: enemyIdx,
        score,
        label,
        color: LABEL_COLORS[label],
      };
    })
  );
}

// ─── Speed Tiers ──────────────────────────────────────────────────

export interface SpeedComparison {
  myPokemon: Pokemon;
  enemyPokemon: Pokemon;
  /** Enemy max speed assuming 32 EVs + favorable nature */
  enemyMaxSpeed: number;
  /** Enemy max speed with Choice Scarf (x1.5) */
  enemyScarfSpeed: number;
  /** True if the enemy can outspeed you at max investment */
  enemyOutspeeds: boolean;
  /** True if the enemy can outspeed you with Scarf */
  enemyScarfOutspeeds: boolean;
  /** Whether Pikalytics shows Scarf as a common item for the enemy */
  hasScarfWarning: boolean;
}

/**
 * Calculates speed comparison between your Pokémon and an enemy.
 *
 * @param mine   - Your Pokémon (uses actual speed stat from DB)
 * @param enemy  - Enemy Pokémon
 * @param enemyHasScarf - Whether Pikalytics shows Scarf >15% usage
 */
export function compareSpeed(
  mine: Pokemon,
  enemy: Pokemon,
  enemyHasScarf = false
): SpeedComparison {
  const mySpeed = calcStat('Spe', mine.stats.speed, MAX_EV, MAX_IV);
  const enemyMaxSpeed = calcStat('Spe', enemy.stats.speed, MAX_EV, MAX_IV, { up: 'Spe', down: null });
  const enemyScarfSpeed = Math.floor(enemyMaxSpeed * 1.5);

  return {
    myPokemon: mine,
    enemyPokemon: enemy,
    enemyMaxSpeed,
    enemyScarfSpeed,
    enemyOutspeeds: enemyMaxSpeed > mySpeed,
    enemyScarfOutspeeds: enemyScarfSpeed > mySpeed,
    hasScarfWarning: enemyHasScarf,
  };
}

// ─── Tactical Alerts ──────────────────────────────────────────────

export type AlertSeverity = 'danger' | 'warning' | 'info';

export interface TacticalAlert {
  id: string;
  severity: AlertSeverity;
  icon: string;
  title: string;
  description: string;
  sourcePokemon: string;
}

/**
 * Generates tactical alerts by crossing enemy meta usage (Pikalytics)
 * against your active team's abilities and the meta flag registry.
 *
 * @param myTeam    - Your active team (fully loaded with moves + abilities)
 * @param enemyTeam - Enemy Pokémon with their DB IDs
 */
export async function generateAlerts(
  myTeam: (Pokemon & { moves?: string[]; ability?: string })[],
  enemyTeam: (Pokemon | null)[]
): Promise<TacticalAlert[]> {
  const alerts: TacticalAlert[] = [];

  // Detect if my team has Intimidate users
  const myIntimidators = myTeam.filter(p =>
    p.ability?.toLowerCase() === 'intimidate'
  );

  // Track which weather/terrain setters are on enemy team
  const weatherCount: Record<string, number> = {};
  const terrainCount: Record<string, number> = {};

  for (const enemy of enemyTeam) {
    if (!enemy) continue;

    // Fetch meta usage from DB
    const [topMoves, topAbilities, topItems] = await Promise.all([
      MetaUsageDAO.getTopMoves(enemy.id),
      MetaUsageDAO.getTopAbilities(enemy.id),
      MetaUsageDAO.getTopItems(enemy.id),
    ]);

    // ── Anti-Intimidate Alert ──────────────────────────────────
    if (myIntimidators.length > 0) {
      for (const ab of topAbilities) {
        const flags = getAbilityFlags(ab.name);
        if (flags.includes('anti_intimidate')) {
          const flag = ABILITY_FLAG_ICONS['anti_intimidate'];
          alerts.push({
            id: `anti-intimidate-${enemy.id}-${ab.name}`,
            severity: 'danger',
            icon: flag.icon,
            title: `${enemy.name} may have ${ab.name}`,
            description: `Your Intimidate will backfire (${ab.usagePct.toFixed(0)}% usage). Reconsider bringing Intimidate against ${enemy.name}.`,
            sourcePokemon: enemy.name,
          });
        }
      }
    }

    // ── Move-based Alerts (Speed Control, Redirection, etc.) ───
    for (const mv of topMoves) {
      const flags = getMoveFlags(mv.name);
      for (const flag of flags) {
        // Ignore protection moves — too common to warrant an alert
        if (flag === 'protection') continue;

        const flagMeta = MOVE_FLAG_ICONS[flag];
        if (!flagMeta) continue;

        alerts.push({
          id: `move-flag-${enemy.id}-${mv.name}-${flag}`,
          severity: flag === 'speed_control' || flag === 'redirection' ? 'warning' : 'info',
          icon: flagMeta.icon,
          title: `${flagMeta.label}: ${enemy.name}`,
          description: `${enemy.name} usually runs ${mv.name} (${mv.usagePct.toFixed(0)}% usage).`,
          sourcePokemon: enemy.name,
        });
      }
    }

    // ── Weather/Terrain Tracking ──────────────────────────────
    for (const ab of topAbilities) {
      const flags = getAbilityFlags(ab.name);
      if (flags.includes('weather_setter')) {
        const key = ab.name;
        weatherCount[key] = (weatherCount[key] ?? 0) + 1;
      }
      if (flags.includes('terrain_setter')) {
        const key = ab.name;
        terrainCount[key] = (terrainCount[key] ?? 0) + 1;
      }
    }
  }

  // ── Weather Synergy Alert ──────────────────────────────────
  for (const [weather, count] of Object.entries(weatherCount)) {
    if (count >= 2) {
      alerts.push({
        id: `weather-synergy-${weather}`,
        severity: 'warning',
        icon: '☁️',
        title: `Weather synergy: ${weather}`,
        description: `The enemy team has ${count} Pokémon that set ${weather}. High probability of weather reliance.`,
        sourcePokemon: '',
      });
    }
  }

  // ── Terrain Synergy Alert ──────────────────────────────────
  for (const [terrain, count] of Object.entries(terrainCount)) {
    if (count >= 2) {
      alerts.push({
        id: `terrain-synergy-${terrain}`,
        severity: 'info',
        icon: '🌍',
        title: `Terrain synergy: ${terrain}`,
        description: `The enemy team has ${count} setters for ${terrain}.`,
        sourcePokemon: '',
      });
    }
  }

  // Deduplicate alerts by id
  const seen = new Set<string>();
  return alerts.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}
