/**
 * HeatmapMatrix
 *
 * 6×6 type matchup grid between your active team (rows)
 * and the enemy team (columns).
 *
 * Color legend:
 *   Green  = Dominant/Favorable  (I hit super-effective, enemy can't hit back)
 *   Gray   = Neutral
 *   Orange = Unfavorable
 *   Red    = Dangerous            (enemy hits 4x, I can't hit back)
 */

import React, { memo } from 'react';
import { StyleSheet, View as RNView, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { Image } from 'expo-image';
import { Pokemon } from '@/src/models/pokemon';
import { HeatmapCell } from '@/src/utils/battle-analysis';
import { resolvePokemonSprite } from '@/src/utils/team-sprite-resolver';

interface Props {
  myTeam: Pokemon[];
  enemyTeam: (Pokemon | null)[];
  heatmap: HeatmapCell[][];
}

const CELL_SIZE = 44;
const AXIS_SIZE = 40;

function pokemonLabel(p: Pokemon | null): string {
  if (!p) return '?';
  return p.name.substring(0, 3).toUpperCase();
}

const HeatmapCellView = memo(({ cell }: { cell: HeatmapCell }) => {
  return (
    <RNView style={[styles.cell, { backgroundColor: cell.color }]}>
      <Text style={styles.cellScore}>
        {cell.label === 'neutral' ? '—' : cell.score > 0 ? `+${cell.score.toFixed(0)}` : cell.score.toFixed(0)}
      </Text>
    </RNView>
  );
});

export function HeatmapMatrix({ myTeam, enemyTeam, heatmap }: Props) {
  if (myTeam.length === 0) return null;

  const validEnemies = enemyTeam.filter(Boolean).length;
  if (validEnemies === 0) {
    return (
      <RNView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Add enemy Pokémon to see the matrix</Text>
      </RNView>
    );
  }

  return (
    <RNView style={styles.wrapper}>
      <Text style={styles.sectionLabel}>MATCHUP MATRIX</Text>

      {/* Legend */}
      <RNView style={styles.legend}>
        {[
          { color: '#15803d', label: 'Dominant' },
          { color: '#4ade80', label: 'Favorable' },
          { color: '#374151', label: 'Neutral' },
          { color: '#f97316', label: 'Unfav.' },
          { color: '#dc2626', label: 'Danger' },
        ].map(item => (
          <RNView key={item.label} style={styles.legendItem}>
            <RNView style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </RNView>
        ))}
      </RNView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <RNView>
          {/* Top axis — enemy team */}
          <RNView style={styles.topAxisRow}>
            <RNView style={{ width: AXIS_SIZE }} />
            {enemyTeam.map((enemy, i) => {
              if (!enemy) return <RNView key={i} style={[styles.axisCell, { width: CELL_SIZE, marginHorizontal: 1 }]} />;
              const sprite = resolvePokemonSprite(enemy.dexNumber, enemy.form ?? '', enemy.spriteDefault);
              return (
                <RNView key={i} style={[styles.axisCell, { width: CELL_SIZE, marginHorizontal: 1 }]}>
                  {sprite ? (
                    <Image source={sprite} style={styles.axisSprite} contentFit="contain" />
                  ) : (
                    <Text style={styles.axisLabel}>{pokemonLabel(enemy)}</Text>
                  )}
                </RNView>
              );
            })}
          </RNView>

          {/* Rows — my team */}
          {myTeam.map((mine, myIdx) => {
            const sprite = resolvePokemonSprite(mine.dexNumber, mine.form ?? '', mine.spriteDefault);
            return (
              <RNView key={myIdx} style={styles.row}>
                {/* Left axis — my pokemon */}
                <RNView style={styles.axisCell}>
                  {sprite ? (
                    <Image source={sprite} style={styles.axisSprite} contentFit="contain" />
                  ) : (
                    <Text style={styles.axisLabel}>{pokemonLabel(mine)}</Text>
                  )}
                </RNView>

                {/* Cells */}
                {(heatmap[myIdx] ?? []).map((cell, enemyIdx) => (
                  <HeatmapCellView key={enemyIdx} cell={cell} />
                ))}
              </RNView>
            );
          })}
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 0,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  topAxisRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  axisCell: {
    width: AXIS_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  axisSprite: {
    width: AXIS_SIZE - 4,
    height: AXIS_SIZE - 4,
  },
  axisLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    marginHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellScore: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
  },
});
