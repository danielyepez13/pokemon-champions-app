import { Text, View } from "@/components/Themed";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  View as RNView,
  ScrollView,
  StyleSheet,
} from "react-native";

import { EnemySelectionModal } from "@/src/components/battle/EnemySelectionModal";
import { HeatmapMatrix } from "@/src/components/battle/HeatmapMatrix";
import { TacticalAlerts } from "@/src/components/battle/TacticalAlerts";
import { Pokemon } from "@/src/models/pokemon";
import { useBattleStore } from "@/src/stores/battle-store";
import { getTypeColor } from "@/src/utils/colors";
import { resolvePokemonSprite } from "@/src/utils/team-sprite-resolver";

// ─── Enemy Slot Component ─────────────────────────────────────────────────────

interface EnemySlotProps {
  index: number;
  pokemon: Pokemon | null;
  onPress: (index: number) => void;
  onClear: (index: number) => void;
}

function EnemySlot({ index, pokemon, onPress, onClear }: EnemySlotProps) {
  const sprite = pokemon
    ? resolvePokemonSprite(
        pokemon.dexNumber,
        pokemon.form ?? "",
        pokemon.spriteDefault,
      )
    : null;
  const primaryType = pokemon?.types[0] ?? "";
  const typeColor = primaryType
    ? getTypeColor(primaryType)
    : "rgba(212,175,55,0.3)";

  return (
    <RNView style={styles.slotWrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.slot,
          pokemon && { borderColor: typeColor + "66" },
          pressed && styles.slotPressed,
        ]}
        onPress={() => onPress(index)}
      >
        {pokemon ? (
          <>
            {sprite ? (
              <Image
                source={sprite}
                style={styles.slotSprite}
                contentFit="contain"
              />
            ) : (
              <FontAwesome name="question-circle" size={28} color={typeColor} />
            )}
          </>
        ) : (
          <FontAwesome name="plus" size={18} color="rgba(255,255,255,0.2)" />
        )}
      </Pressable>

      {/* Clear button */}
      {pokemon && (
        <Pressable
          style={styles.clearBtn}
          onPress={() => onClear(index)}
          hitSlop={6}
        >
          <Text style={styles.clearBtnText}>✕</Text>
        </Pressable>
      )}

      {/* Name label */}
      <Text style={styles.slotName} numberOfLines={1}>
        {pokemon ? pokemon.name.substring(0, 8) : `Slot ${index + 1}`}
      </Text>
    </RNView>
  );
}

// ─── Speed Tiers Accordion ────────────────────────────────────────────────────

function SpeedTiersAccordion({ comparisons }: { comparisons: any[] }) {
  const [expanded, setExpanded] = useState(false);

  if (comparisons.length === 0) return null;

  const grouped = comparisons.reduce(
    (acc, comp) => {
      const name = comp.myPokemon.name;
      if (!acc[name]) acc[name] = [];
      acc[name].push(comp);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  const entries = Object.entries(grouped) as [string, any[]][];

  return (
    <RNView style={styles.accordionContainer}>
      <Pressable
        style={styles.accordionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.accordionTitle}>SPEED TIERS (SUMMARY)</Text>
        <FontAwesome
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color="rgba(255,255,255,0.4)"
        />
      </Pressable>
      {expanded && (
        <RNView style={styles.accordionContent}>
          {entries.map(([myName, comps], i) => (
            <RNView key={i} style={styles.speedGroup}>
              <Text style={styles.speedGroupTitle}>{myName}</Text>
              {comps.map((comp: any, j: number) => (
                <RNView key={j} style={styles.speedRow}>
                  <Text style={styles.speedEnemyName}>
                    vs {comp.enemyPokemon.name}
                  </Text>
                  {comp.enemyOutspeeds ? (
                    <Text style={{ color: "#dc2626", fontSize: 11 }}>
                      Slower
                    </Text>
                  ) : comp.enemyScarfOutspeeds && comp.hasScarfWarning ? (
                    <Text style={{ color: "#facc15", fontSize: 11 }}>
                      Scarf Danger
                    </Text>
                  ) : (
                    <Text style={{ color: "#4ade80", fontSize: 11 }}>
                      Faster
                    </Text>
                  )}
                </RNView>
              ))}
            </RNView>
          ))}
        </RNView>
      )}
    </RNView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BattleScreen() {
  const {
    myTeam,
    myTeamLoaded,
    enemyTeam,
    heatmap,
    speedComparisons,
    alerts,
    analysisLoading,
    loadMyTeam,
    setEnemySlot,
    clearEnemyTeam,
  } = useBattleStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadMyTeam();
    }, []),
  );

  const handleSlotPress = (index: number) => {
    setSelectedSlot(index);
    setModalVisible(true);
  };

  const handleSlotClear = async (index: number) => {
    await setEnemySlot(index, null);
  };

  const handleEnemySelect = async (pokemon: Pokemon) => {
    await setEnemySlot(selectedSlot, pokemon);
  };

  const filledSlots = enemyTeam.filter(Boolean).length;

  // ── No active team ───────────────────────────────────────────
  if (myTeamLoaded && myTeam.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <FontAwesome name="bolt" size={50} color="rgba(212,175,55,0.2)" />
        <Text style={styles.noTeamTitle}>No active team</Text>
        <Text style={styles.noTeamSub}>
          Go to the Teams tab and mark one as Active to start the analysis.
        </Text>
        <Pressable
          style={styles.goTeamsBtn}
          onPress={() => router.push("/(tabs)/teams")}
        >
          <Text style={styles.goTeamsBtnText}>Go to Teams</Text>
        </Pressable>
      </View>
    );
  }

  // ── Loading my team ──────────────────────────────────────────
  if (!myTeamLoaded) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Enemy Slot Row ─────────────────────────────── */}
      <RNView style={styles.enemySection}>
        <RNView style={styles.enemyHeader}>
          <Text style={styles.enemyTitle}>ENEMY TEAM</Text>
          {filledSlots > 0 && (
            <Pressable onPress={clearEnemyTeam} hitSlop={8}>
              <Text style={styles.clearAllBtn}>Clear</Text>
            </Pressable>
          )}
        </RNView>
        <RNView style={styles.slotsRow}>
          {enemyTeam.map((pokemon, i) => (
            <EnemySlot
              key={i}
              index={i}
              pokemon={pokemon}
              onPress={handleSlotPress}
              onClear={handleSlotClear}
            />
          ))}
        </RNView>
      </RNView>

      {/* ── Analysis Content ───────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Heatmap */}
        <RNView style={styles.section}>
          <HeatmapMatrix
            myTeam={myTeam}
            enemyTeam={enemyTeam}
            heatmap={heatmap}
          />
        </RNView>

        {/* Separator */}
        {filledSlots > 0 && <RNView style={styles.divider} />}

        {/* Tactical Alerts */}
        {filledSlots > 0 && (
          <TacticalAlerts alerts={alerts} loading={analysisLoading} />
        )}

        {/* Speed Tiers */}
        {filledSlots > 0 && !analysisLoading && (
          <SpeedTiersAccordion comparisons={speedComparisons} />
        )}

        {/* Hint when no enemy */}
        {filledSlots === 0 && (
          <RNView style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Tap a slot to add an enemy Pokémon.{"\n"}
              The matchup matrix and alerts will appear automatically.
            </Text>
          </RNView>
        )}
      </ScrollView>

      {/* ── Enemy Selection Modal ──────────────────────── */}
      <EnemySelectionModal
        visible={modalVisible}
        slotIndex={selectedSlot}
        onSelect={handleEnemySelect}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    padding: 32,
    gap: 16,
  },

  // No team state
  noTeamTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  noTeamSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  goTeamsBtn: {
    marginTop: 8,
    backgroundColor: "#d4af37",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goTeamsBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
  },

  // Enemy section
  enemySection: {
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212,175,55,0.15)",
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  enemyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  enemyTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 1.5,
  },
  clearAllBtn: {
    color: "rgba(212,175,55,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  slotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Slots
  slotWrapper: {
    alignItems: "center",
    width: "15%",
  },
  slot: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  slotPressed: {
    backgroundColor: "rgba(212,175,55,0.1)",
  },
  slotSprite: {
    width: 44,
    height: 44,
  },
  clearBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  clearBtnText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  slotName: {
    marginTop: 4,
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
    textTransform: "capitalize",
    textAlign: "center",
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 14,
    marginVertical: 14,
  },

  // Hint
  hintContainer: {
    paddingHorizontal: 32,
    paddingTop: 32,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  // Accordion
  accordionContainer: {
    marginHorizontal: 14,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  accordionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
  },
  accordionContent: {
    padding: 14,
    gap: 16,
  },
  speedGroup: {
    gap: 6,
  },
  speedGroupTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  speedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  speedEnemyName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});
