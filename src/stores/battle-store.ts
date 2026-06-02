/**
 * Battle Store — Zustand store for the Battle Preview screen.
 *
 * Manages enemy slot selection, triggers analysis, and persists
 * battle state within the session (not written to SQLite).
 */

import { create } from 'zustand';
import { Pokemon } from '../models/pokemon';
import { TeamDAO } from '../database/dao/team.dao';
import { MetaUsageDAO } from '../database/dao/meta-usage.dao';
import {
  buildHeatmap,
  HeatmapCell,
  compareSpeed,
  SpeedComparison,
  generateAlerts,
  TacticalAlert,
} from '../utils/battle-analysis';

export interface MyTeamMember extends Pokemon {
  moves?: string[];
  ability?: string;
}

interface BattleState {
  // My team
  myTeam: MyTeamMember[];
  myTeamLoaded: boolean;

  // Enemy team — 6 slots
  enemyTeam: (Pokemon | null)[];

  // Computed analysis (updated reactively when enemy team changes)
  heatmap: HeatmapCell[][];
  speedComparisons: SpeedComparison[];
  alerts: TacticalAlert[];
  analysisLoading: boolean;
  
  // Actions
  loadMyTeam: () => Promise<void>;
  setEnemySlot: (index: number, pokemon: Pokemon | null) => Promise<void>;
  clearEnemyTeam: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => {
  // ── Internal helper — not part of the public state ───────────────
  const recompute = async () => {
    const { myTeam, enemyTeam } = get();
    if (myTeam.length === 0) return;

    set({ analysisLoading: true });

    try {
      // Heatmap (synchronous)
      const heatmap = buildHeatmap(myTeam, enemyTeam);

      const enemyIds = enemyTeam
        .filter((e): e is Pokemon => e !== null)
        .map(e => e.id);
      const metaByPokemonId = await MetaUsageDAO.getTopMetaForPokemonIds(enemyIds);

      // Speed comparisons — check Scarf usage in Pikalytics for each enemy
      const speedComparisons: SpeedComparison[] = [];
      for (const mine of myTeam) {
        for (const enemy of enemyTeam) {
          if (!enemy) continue;
          const items = metaByPokemonId.get(enemy.id)?.items ?? [];
          const hasScarfWarning = items.some(i =>
            i.name.toLowerCase().replace(/[\s']/g, '') === 'choicescarf'
          );
          speedComparisons.push(compareSpeed(mine, enemy, hasScarfWarning));
        }
      }

      // Alerts (async — reads DB or uses prefetched meta)
      const alerts = await generateAlerts(myTeam, enemyTeam, metaByPokemonId);

      set({ heatmap, speedComparisons, alerts, analysisLoading: false });
    } catch (e) {
      console.error('[BattleStore] Analysis error:', e);
      set({ analysisLoading: false });
    }
  };

  return {
    myTeam: [],
    myTeamLoaded: false,
    enemyTeam: [null, null, null, null, null, null],
    heatmap: [],
    speedComparisons: [],
    alerts: [],
    analysisLoading: false,

    loadMyTeam: async () => {
      const activeTeam = await TeamDAO.getActiveTeam();
      if (!activeTeam) {
        set({ myTeam: [], myTeamLoaded: true });
        return;
      }

      const myTeam: MyTeamMember[] = activeTeam.members.map((m: any) => ({
        id: m.pokemon_id,
        dexNumber: m.dex_number,
        name: m.pokemon_name,
        form: m.form ?? '',
        isMega: !!m.is_mega,
        types: m.types_list ? m.types_list.split(',').filter(Boolean) : [],
        stats: {
          hp: m.base_hp ?? 0,
          attack: m.base_atk ?? 0,
          defense: m.base_def ?? 0,
          spAttack: m.base_spa ?? 0,
          spDefense: m.base_spd ?? 0,
          speed: m.base_spe ?? 0,
          total: 0,
        },
        spriteDefault: m.sprite_url ?? '',
        spriteShiny: '',
        spriteIcon: '',
        category: '',
        height: 0,
        weight: 0,
        moves: m.moves ?? [],
        ability: m.ability_name || m.raw_ability_name || undefined,
      }));

      set({ myTeam, myTeamLoaded: true });
      await recompute();
    },

    setEnemySlot: async (index: number, pokemon: Pokemon | null) => {
      const current = [...get().enemyTeam];
      current[index] = pokemon;
      set({ enemyTeam: current });
      await recompute();
    },

    clearEnemyTeam: () => {
      set({
        enemyTeam: [null, null, null, null, null, null],
        heatmap: [],
        speedComparisons: [],
        alerts: [],
      });
    },
  };
});
