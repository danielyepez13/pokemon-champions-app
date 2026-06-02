import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { PokemonDAO } from '@/src/database/dao/pokemon.dao';
import { MetaUsageDAO, MetaUsageRow } from '@/src/database/dao/meta-usage.dao';
import { MetaTeammatesDAO, FeaturedTeamsDAO } from '@/src/database/dao/meta-pokedex.dao';
import { Pokemon } from '@/src/models/pokemon';
import { TeammateEntry, FeaturedTeam } from '@/src/services/pikalytics-service';
import { getTypeColor } from '@/src/utils/colors';


// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = '#d4af37';

const STAT_COLORS: Record<string, string> = {
  hp: '#6db96d',
  attack: '#e05252',
  defense: '#5289e0',
  spAttack: '#c452e0',
  spDefense: '#52a5e0',
  speed: '#e0c452',
  total: GOLD,
};

const STAT_MAX = 255;

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const color = getTypeColor(type);
  return (
    <View style={[styles.typeBadge, { backgroundColor: color }]}>
      <Text style={styles.typeBadgeText}>{type.toUpperCase()}</Text>
    </View>
  );
}

// ─── Stat bar ─────────────────────────────────────────────────────────────────

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min((value / STAT_MAX) * 100, 100);
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <View style={styles.statBarBg}>
        <View style={[styles.statBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Usage entry bar ──────────────────────────────────────────────────────────

function UsageRow({ name, pct, accent }: { name: string; pct: number; accent?: string }) {
  return (
    <View style={styles.usageRow}>
      <Text style={styles.usageRowName} numberOfLines={1}>{name}</Text>
      <View style={styles.usageRowBarBg}>
        <View style={[styles.usageRowBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: accent ?? GOLD }]} />
      </View>
      <Text style={[styles.usageRowPct, { color: accent ?? GOLD }]}>{pct.toFixed(1)}%</Text>
    </View>
  );
}

// ─── Section accordion ────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen(o => !o)}>
        <FontAwesome name={icon as any} size={13} color={GOLD} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <FontAwesome
          name={open ? 'chevron-up' : 'chevron-down'}
          size={11}
          color="rgba(212,175,55,0.5)"
          style={styles.sectionChevron}
        />
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// ─── Teammate circle ──────────────────────────────────────────────────────────

function TeammateCircle({ teammate }: { teammate: TeammateEntry & { pokemon?: Pokemon } }) {
  const pkmn = teammate.pokemon;
  const isBase64 = pkmn?.spriteDefault?.startsWith('data:');

  const handlePress = () => {
    if (pkmn?.id) {
      router.push(`/pokemon/${pkmn.id}`);
    }
  };

  return (
    <Pressable style={styles.teammateCircle} onPress={handlePress}>
      <View style={styles.teammateImageContainer}>
        {isBase64 ? (
          <Image
            source={{ uri: pkmn!.spriteDefault }}
            style={styles.teammateImage}
            resizeMode="contain"
          />
        ) : (
          <FontAwesome name="question-circle" size={28} color="#333" />
        )}
      </View>
      <Text style={styles.teammateName} numberOfLines={1}>{teammate.name}</Text>
      <Text style={styles.teammatePct}>{teammate.usagePct.toFixed(0)}%</Text>
    </Pressable>
  );
}

// ─── Featured team card ───────────────────────────────────────────────────────

function FeaturedTeamCard({ team, allPokemon }: { team: FeaturedTeam; allPokemon: Pokemon[] }) {
  const getPokemon = (name: string) =>
    allPokemon.find(p => p.name.toLowerCase() === name.toLowerCase());

  return (
    <View style={styles.teamCard}>
      {/* Header */}
      <View style={styles.teamCardHeader}>
        <View>
          <Text style={styles.teamCardPlayer}>{team.player}</Text>
          {team.record ? <Text style={styles.teamCardRecord}>{team.record}</Text> : null}
        </View>
        {team.event ? (
          <Text style={styles.teamCardEvent} numberOfLines={1}>{team.event}</Text>
        ) : null}
      </View>

      {/* 6 Pokémon sprites grid (3 + 3) */}
      <View style={styles.teamGrid}>
        {team.pokemon.slice(0, 6).map((name, i) => {
          const pkmn = getPokemon(name);
          const isBase64 = pkmn?.spriteDefault?.startsWith('data:');
          return (
            <View key={i} style={styles.teamGridItem}>
              {isBase64 ? (
                <Image
                  source={{ uri: pkmn!.spriteDefault }}
                  style={styles.teamGridSprite}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.teamGridPlaceholder}>
                  <Text style={styles.teamGridPlaceholderText} numberOfLines={1}>
                    {name.substring(0, 3)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Focus set */}
      {(team.focusSet.ability || team.focusSet.item || team.focusSet.moves.length > 0) && (
        <View style={styles.focusSet}>
          <Text style={styles.focusSetTitle}>USED SET</Text>

          {team.focusSet.ability ? (
            <Text style={styles.focusSetLine}>
              <Text style={styles.focusSetLabel}>Ability: </Text>

              {team.focusSet.ability}
            </Text>
          ) : null}
          {team.focusSet.item ? (
            <Text style={styles.focusSetLine}>
              <Text style={styles.focusSetLabel}>Item: </Text>

              {team.focusSet.item}
            </Text>
          ) : null}
          {team.focusSet.moves.length > 0 && (
            <Text style={styles.focusSetLine}>
              <Text style={styles.focusSetLabel}>Moves: </Text>

              {team.focusSet.moves.join(' · ')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PokemonDetailScreen() {
  const { id } = useLocalSearchParams();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [moves, setMoves] = useState<MetaUsageRow[]>([]);
  const [abilities, setAbilities] = useState<MetaUsageRow[]>([]);
  const [items, setItems] = useState<MetaUsageRow[]>([]);
  const [teammates, setTeammates] = useState<(TeammateEntry & { pokemon?: Pokemon })[]>([]);
  const [featuredTeams, setFeaturedTeams] = useState<FeaturedTeam[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);


  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const pkmn = await PokemonDAO.getById(Number(id));
      if (!pkmn) return;
      setPokemon(pkmn);

      const dbTeammates = await MetaTeammatesDAO.getByPokemon(pkmn.name);
      const dbTeams = await FeaturedTeamsDAO.getByPokemon(pkmn.name);

      const relatedNames = new Set<string>();
      for (const t of dbTeammates) relatedNames.add(t.name);
      for (const team of dbTeams) {
        for (const name of team.pokemon) relatedNames.add(name);
      }

      const related = await PokemonDAO.getByNames([...relatedNames]);
      setAllPokemon(related);
      const byName = new Map(related.map(p => [p.name.toLowerCase(), p]));

      // Load meta usage from DB
      const dbMoves = await MetaUsageDAO.getByPokemonId(pkmn.id, 'move');
      const dbAbilities = await MetaUsageDAO.getByPokemonId(pkmn.id, 'ability');
      const dbItems = await MetaUsageDAO.getByPokemonId(pkmn.id, 'item');

      setMoves(dbMoves);
      setAbilities(dbAbilities);
      setItems(dbItems);

      const teammatesWithPokemon = dbTeammates.map(t => ({
        ...t,
        pokemon: byName.get(t.name.toLowerCase()),
      }));
      setTeammates(teammatesWithPokemon);
      setFeaturedTeams(dbTeams);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !pokemon) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={styles.loadingText}>Loading...</Text>

      </View>
    );
  }

  const mainColor = pokemon.types.length > 0 ? getTypeColor(pokemon.types[0]) : GOLD;
  const isBase64 = pokemon.spriteDefault?.startsWith('data:');

  const statMap: Array<{ key: string; label: string }> = [
    { key: 'hp', label: 'HP' },
    { key: 'attack', label: 'Atk' },
    { key: 'defense', label: 'Def' },
    { key: 'spAttack', label: 'SpA' },
    { key: 'spDefense', label: 'SpD' },
    { key: 'speed', label: 'Spe' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <FontAwesome name="chevron-left" size={13} color={GOLD} />
          <Text style={styles.backText}>POKÉDEX</Text>
        </Pressable>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={[styles.hero, { borderColor: mainColor + '44' }]}>
          {/* Glow background */}
          <View style={[styles.heroGlow, { backgroundColor: mainColor }]} />

          {/* Sprite */}
          <View style={styles.heroSpriteContainer}>
            {isBase64 ? (
              <Image
                source={{ uri: pokemon.spriteDefault }}
                style={styles.heroSprite}
                resizeMode="contain"
              />
            ) : (
              <FontAwesome name="question-circle" size={60} color="#222" />
            )}
          </View>

          {/* Name + types + usage */}
          <Text style={styles.heroName}>{pokemon.name}</Text>
          <View style={styles.heroTypes}>
            {pokemon.types.map(t => <TypeBadge key={t} type={t} />)}
          </View>

          {pokemon.usagePct > 0 && (
            <View style={styles.heroUsageRow}>
              <Text style={styles.heroRank}>#{pokemon.usageRank}</Text>
              <Text style={styles.heroUsagePct}>{pokemon.usagePct.toFixed(1)}% usage</Text>

            </View>
          )}
        </View>

        {/* ── Base Stats ───────────────────────────────────────────── */}
        <Section title="BASE STATS" icon="bar-chart" defaultOpen>

          {statMap.map(({ key, label }) => (
            <StatBar
              key={key}
              label={label}
              value={(pokemon.stats as any)[key] ?? 0}
              color={STAT_COLORS[key] ?? GOLD}
            />
          ))}
          <View style={styles.statTotalRow}>
            <Text style={styles.statTotalLabel}>TOTAL</Text>

            <Text style={styles.statTotalValue}>{pokemon.stats.total}</Text>
          </View>
        </Section>

        {/* ── Análisis de Uso ──────────────────────────────────────── */}
        {moves.length > 0 && (
          <Section title="TOP MOVES" icon="bolt" defaultOpen>
            {moves.map(m => (
              <UsageRow key={m.name} name={m.name} pct={m.usagePct} />
            ))}

          </Section>
        )}

        {items.length > 0 && (
          <Section title="TOP ITEMS" icon="archive">
            {items.map(i => (
              <UsageRow key={i.name} name={i.name} pct={i.usagePct} accent="#52c4e0" />
            ))}

          </Section>
        )}

        {abilities.length > 0 && (
          <Section title="ABILITIES" icon="star">
            {abilities.map(a => (
              <UsageRow key={a.name} name={a.name} pct={a.usagePct} accent="#b06de0" />
            ))}

          </Section>
        )}

        {/* ── Compañeros Frecuentes ────────────────────────────────── */}
        {teammates.length > 0 && (
          <Section title="COMMON TEAMMATES" icon="users" defaultOpen>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teammatesScroll}>
              {teammates.slice(0, 12).map(t => (
                <TeammateCircle key={t.name} teammate={t} />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* ── Equipos Destacados ───────────────────────────────────── */}
        {featuredTeams.length > 0 && (
          <Section title={`FEATURED TEAMS (${featuredTeams.length})`} icon="trophy">

            {featuredTeams.map((team, i) => (
              <FeaturedTeamCard key={i} team={team} allPokemon={allPokemon} />
            ))}
          </Section>
        )}

        {/* Pokémon description */}
        {pokemon.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{pokemon.description}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  scroll: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: GOLD, fontSize: 14 },

  // Back
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText: {
    color: GOLD,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },

  // Hero
  hero: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#0c0c0c',
    alignItems: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: 10,
    width: 185,
    height: 185,
    borderRadius: 100,
    opacity: 0.08,
  },
  heroSpriteContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroSprite: { width: 150, height: 150 },
  heroName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  heroTypes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  heroUsageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  heroRank: {
    color: GOLD,
    fontWeight: 'bold',
    fontSize: 14,
  },
  heroUsagePct: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },

  // Type badge
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#0c0c0c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  sectionChevron: {},
  sectionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },

  // Stat bars
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 30,
    textAlign: 'right',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 28,
    textAlign: 'right',
  },
  statBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    marginTop: 4,
    paddingTop: 8,
  },
  statTotalLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statTotalValue: {
    color: GOLD,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Usage rows
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usageRowName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    width: 130,
  },
  usageRowBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageRowBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  usageRowPct: {
    fontSize: 11,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },

  // Teammates
  teammatesScroll: { marginTop: 4 },
  teammateCircle: {
    alignItems: 'center',
    marginRight: 12,
    width: 68,
  },
  // Fixed: image is 48x48 inside a 56x56 circle. Both are centered.
  teammateImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  teammateImage: {
    width: 48,
    height: 48,
    alignSelf: 'center',
  },

  teammateName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textAlign: 'center',
  },
  teammatePct: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Featured team card
  teamCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.1)',
    padding: 12,
    marginBottom: 10,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  teamCardPlayer: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  teamCardRecord: {
    color: GOLD,
    fontSize: 11,
    marginTop: 2,
  },
  teamCardEvent: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    maxWidth: 120,
    textAlign: 'right',
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  teamGridItem: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  teamGridSprite: { width: 44, height: 44 },
  teamGridPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  teamGridPlaceholderText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    textAlign: 'center',
  },
  focusSet: {
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    padding: 10,
    gap: 3,
  },
  focusSetTitle: {
    color: GOLD,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  focusSetLine: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    lineHeight: 16,
  },
  focusSetLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },

  // Description
  descriptionBox: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 14,
    backgroundColor: '#0c0c0c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.08)',
  },
  descriptionText: {
    color: 'rgba(212,175,55,0.6)',
    fontSize: 12,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
