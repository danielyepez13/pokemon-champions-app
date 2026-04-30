import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  View,
  Text,
  Image,
  Animated,
} from 'react-native';
import { usePokemonStore } from '@/src/stores/pokemon-store';
import { useSyncStore } from '@/src/stores/sync-store';
import { router } from 'expo-router';
import { Pokemon } from '@/src/models/pokemon';
import { getTypeColor } from '@/src/utils/colors';
import { FontAwesome } from '@expo/vector-icons';


// ─── Type chip ────────────────────────────────────────────────────────────────

function TypeChip({ type }: { type: string }) {
  const color = getTypeColor(type);
  return (
    <View style={[styles.typeChip, { backgroundColor: color + '33', borderColor: color + '88' }]}>
      <Text style={[styles.typeChipText, { color }]}>{type.toUpperCase()}</Text>
    </View>
  );
}

// ─── Usage bar ────────────────────────────────────────────────────────────────

function UsageBar({ pct, rank }: { pct: number; rank: number }) {
  // pct=0 means this Pokémon was fetched on-demand and has no meta usage data yet
  if (pct === 0) {
    return (
      <View style={styles.usageContainer}>
        <Text style={styles.usageNA}>— No usage data</Text>
      </View>
    );
  }
  return (
    <View style={styles.usageContainer}>
      <View style={styles.usageBarBg}>
        <View style={[styles.usageBarFill, { width: `${Math.min(pct, 100)}%` }]} />
      </View>
      <Text style={styles.usagePct}>{pct.toFixed(1)}%</Text>
      {rank > 0 && (
        <Text style={styles.usageRank}>#{rank}</Text>
      )}
    </View>
  );
}


// ─── Pokemon card ─────────────────────────────────────────────────────────────

function MetaCard({ pokemon, onPress, index }: { pokemon: Pokemon; onPress: () => void; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 40, 600),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 40, 600),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const mainColor = pokemon.types.length > 0 ? getTypeColor(pokemon.types[0]) : '#d4af37';
  const isBase64 = pokemon.spriteDefault?.startsWith('data:');

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        {/* Colored side accent */}
        <View style={[styles.cardAccent, { backgroundColor: mainColor }]} />

        {/* Sprite */}
        <View style={[styles.spriteContainer, { backgroundColor: mainColor + '15' }]}>
          {isBase64 ? (
            <Image
              source={{ uri: pokemon.spriteDefault }}
              style={styles.sprite}
              resizeMode="contain"
            />
          ) : (
            <FontAwesome name="question-circle" size={40} color="#333" />
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{pokemon.name}</Text>
          <View style={styles.typesRow}>
            {pokemon.types.map(t => <TypeChip key={t} type={t} />)}
          </View>
          {/* Always show usage bar — shows 'No usage data' when pct=0 */}
          <UsageBar pct={pokemon.usagePct} rank={pokemon.usageRank} />

        </View>

        {/* Chevron */}
        <FontAwesome name="chevron-right" size={12} color="rgba(212,175,55,0.4)" style={styles.cardChevron} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PokedexScreen() {
  const { pokemons, filteredPokemons, isLoading, loadPokemons } = usePokemonStore();
  const { status, progress, phase, startSync } = useSyncStore();

  useEffect(() => {
    loadPokemons();
  }, []);

  // Syncing state
  if (status === 'syncing') {
    const phaseLabels: Record<string, string> = {
      items: 'Syncing items',
      pokeapi: 'Enriching data',
      pikalytics: 'Downloading meta',
    };

    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.syncTitle}>{phaseLabels[phase ?? ''] ?? 'Syncing...'}</Text>

        <Text style={styles.syncProgress}>
          {progress.current} / {progress.total}
        </Text>
        <View style={styles.syncBarBg}>
          <View
            style={[
              styles.syncBarFill,
              { width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' },
            ]}
          />
        </View>
      </View>
    );
  }

  // Empty state
  if (filteredPokemons.length === 0 && !isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <FontAwesome name="database" size={48} color="rgba(212,175,55,0.3)" />
        <Text style={styles.emptyTitle}>No meta data found</Text>
        <Text style={styles.emptySubtitle}>
          Sync to load Pokémon from the competitive meta.
        </Text>
        <Pressable style={styles.syncButton} onPress={startSync}>
          <FontAwesome name="refresh" size={14} color="#050505" />
          <Text style={styles.syncButtonText}>Sync now</Text>
        </Pressable>

      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {/* Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Competitive Pokédex</Text>
        <Text style={styles.listHeaderSub}>Champions Tournaments · {filteredPokemons.length} Pokémon</Text>

      </View>

      <FlatList
        data={filteredPokemons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <MetaCard
            pokemon={item}
            index={index}
            onPress={() => router.push(`/pokemon/${item.id}`)}
          />
        )}
        refreshing={isLoading}
        onRefresh={loadPokemons}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GOLD = '#d4af37';

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
    padding: 32,
    gap: 12,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#050505',
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.15)',
  },
  listHeaderTitle: {
    color: GOLD,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  listHeaderSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  flatListContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
    overflow: 'hidden',
    paddingRight: 12,
  },
  cardPressed: {
    opacity: 0.75,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  cardAccent: {
    width: 3,
    alignSelf: 'stretch',
    opacity: 0.7,
  },
  spriteContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderRadius: 8,
  },
  sprite: {
    width: 60,
    height: 60,
  },
  cardInfo: {
    flex: 1,
    paddingVertical: 10,
    gap: 4,
  },
  cardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  typesRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  cardChevron: {
    marginLeft: 8,
  },

  // Type chip
  typeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Usage bar
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  usageBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 2,
  },
  usagePct: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'right',
  },
  usageNA: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  usageRank: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    minWidth: 24,
  },

  // Sync states
  syncTitle: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  syncProgress: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  syncBarBg: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  syncBarFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 2,
  },

  // Empty state
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
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  syncButtonText: {
    color: '#050505',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
