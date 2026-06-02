import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { PokemonDAO } from '@/src/database/dao/pokemon.dao';
import { TeamDAO } from '@/src/database/dao/team.dao';
import { Pokemon } from '@/src/models/pokemon';
import { calcStat } from '@/src/utils/stat-calculator';
import { resolvePokemonSprite } from '@/src/utils/team-sprite-resolver';

const GOLD = '#d4af37';
const MAX_SPE_NATURE = { up: 'Spe' as const, down: null };

interface SpeedTierEntry {
  pokemon: Pokemon;
  maxSpeed: number;
  onActiveTeam: boolean;
}

function computeMaxSpeed(pokemon: Pokemon): number {
  return calcStat('Spe', pokemon.stats.speed, 32, 31, MAX_SPE_NATURE);
}

export default function SpeedTiersScreen() {
  const [entries, setEntries] = useState<SpeedTierEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allPokemon, activeTeam] = await Promise.all([
        PokemonDAO.getAllByUsageRank(),
        TeamDAO.getActiveTeam(),
      ]);

      const activeNames = new Set(
        (activeTeam?.members ?? []).map((m: { pokemon_name: string }) =>
          m.pokemon_name.toLowerCase()
        )
      );

      const metaPokemon = allPokemon.filter(p => p.usageRank > 0);
      const tierEntries: SpeedTierEntry[] = metaPokemon.map(pokemon => ({
        pokemon,
        maxSpeed: computeMaxSpeed(pokemon),
        onActiveTeam: activeNames.has(pokemon.name.toLowerCase()),
      }));

      tierEntries.sort((a, b) => {
        if (b.maxSpeed !== a.maxSpeed) return b.maxSpeed - a.maxSpeed;
        if (a.pokemon.usageRank === 0) return 1;
        if (b.pokemon.usageRank === 0) return -1;
        return a.pokemon.usageRank - b.pokemon.usageRank;
      });

      setEntries(tierEntries);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="tachometer" size={48} color="rgba(212,175,55,0.3)" />
        <Text style={styles.emptyTitle}>No meta data found</Text>
        <Text style={styles.emptySubtitle}>
          Sync from Settings to load competitive Pokémon speed tiers.
        </Text>
        <Pressable style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <FontAwesome name="cog" size={14} color="#050505" />
          <Text style={styles.settingsBtnText}>Go to Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Speed Tiers</Text>
        <Text style={styles.headerSub}>
          Max Speed · 32 EV · +Spe · L50 · {entries.length} Pokémon
        </Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.pokemon.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const sprite = resolvePokemonSprite(
            item.pokemon.dexNumber,
            item.pokemon.form ?? '',
            item.pokemon.spriteDefault
          );

          return (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                item.onActiveTeam && styles.rowActive,
                pressed && styles.rowPressed,
              ]}
              onPress={() => router.push(`/pokemon/${item.pokemon.id}`)}
            >
              <Text style={styles.rank}>{index + 1}</Text>

              <View style={styles.spriteBox}>
                {sprite ? (
                  <Image source={sprite} style={styles.sprite} contentFit="contain" />
                ) : (
                  <FontAwesome name="question-circle" size={28} color="#333" />
                )}
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.pokemon.name}
                  </Text>
                  {item.onActiveTeam && (
                    <View style={styles.teamBadge}>
                      <Text style={styles.teamBadgeText}>YOUR TEAM</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.meta}>
                  Base {item.pokemon.stats.speed} · {item.pokemon.usagePct.toFixed(1)}% usage
                </Text>
              </View>

              <Text style={styles.maxSpeed}>{item.maxSpeed}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
    padding: 32,
    gap: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.15)',
  },
  headerTitle: {
    color: GOLD,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  rowActive: {
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    borderColor: 'rgba(212,175,55,0.35)',
  },
  rowPressed: {
    opacity: 0.75,
  },
  rank: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '600',
    width: 28,
    textAlign: 'center',
  },
  spriteBox: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprite: {
    width: 40,
    height: 40,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  teamBadge: {
    backgroundColor: GOLD,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  meta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  maxSpeed: {
    color: GOLD,
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 36,
    textAlign: 'right',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  settingsBtnText: {
    color: '#050505',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
