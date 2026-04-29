import React, { useEffect, useCallback, useState } from 'react';
import {
    StyleSheet,
    ScrollView,
    Pressable,
    View as RNView,
    ActivityIndicator,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';

import { useBattleStore } from '@/src/stores/battle-store';
import { Pokemon } from '@/src/models/pokemon';
import { resolvePokemonSprite } from '@/src/utils/team-sprite-resolver';
import { EnemySelectionModal } from '@/src/components/battle/EnemySelectionModal';
import { HeatmapMatrix } from '@/src/components/battle/HeatmapMatrix';
import { TacticalAlerts } from '@/src/components/battle/TacticalAlerts';

// ─── Enemy Slot Component ─────────────────────────────────────────────────────

interface EnemySlotProps {
    index: number;
    pokemon: Pokemon | null;
    onPress: (index: number) => void;
    onClear: (index: number) => void;
}

const TYPE_COLORS: Record<string, string> = {
    fire: '#FF6B35', water: '#4A9EDB', grass: '#4CAF50', electric: '#F9CA24',
    ice: '#A8D8EA', fighting: '#C0392B', poison: '#8E44AD', ground: '#D4AC0D',
    flying: '#7FDBFF', psychic: '#E91E8C', bug: '#8BC34A', rock: '#9E9E9E',
    ghost: '#7B1FA2', dragon: '#3F51B5', dark: '#546E7A', steel: '#78909C',
    fairy: '#F48FB1', normal: '#6D6D6D',
};

function EnemySlot({ index, pokemon, onPress, onClear }: EnemySlotProps) {
    const sprite = pokemon
        ? resolvePokemonSprite(pokemon.dexNumber, pokemon.form ?? '', pokemon.spriteDefault)
        : null;
    const primaryType = pokemon?.types[0]?.toLowerCase() ?? '';
    const typeColor = TYPE_COLORS[primaryType] ?? 'rgba(212,175,55,0.3)';

    return (
        <RNView style={styles.slotWrapper}>
            <Pressable
                style={({ pressed }) => [
                    styles.slot,
                    pokemon && { borderColor: typeColor + '66' },
                    pressed && styles.slotPressed,
                ]}
                onPress={() => onPress(index)}
            >
                {pokemon ? (
                    <>
                        {sprite ? (
                            <Image source={sprite} style={styles.slotSprite} contentFit="contain" />
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
        }, [])
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
                <Pressable style={styles.goTeamsBtn} onPress={() => router.push('/(tabs)/teams')}>
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
                {filledSlots > 0 && (
                    <RNView style={styles.divider} />
                )}

                {/* Tactical Alerts */}
                {filledSlots > 0 && (
                    <TacticalAlerts
                        alerts={alerts}
                        loading={analysisLoading}
                    />
                )}

                {/* Hint when no enemy */}
                {filledSlots === 0 && (
                    <RNView style={styles.hintContainer}>
                        <Text style={styles.hintText}>
                            Tap a slot to add an enemy Pokémon.{'\n'}
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
        backgroundColor: '#050505',
    },
    centeredContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        padding: 32,
        gap: 16,
    },

    // No team state
    noTeamTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
    },
    noTeamSub: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    goTeamsBtn: {
        marginTop: 8,
        backgroundColor: '#d4af37',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    goTeamsBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 15,
    },

    // Enemy section
    enemySection: {
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212,175,55,0.15)',
        paddingTop: 14,
        paddingBottom: 10,
        paddingHorizontal: 14,
    },
    enemyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    enemyTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.28)',
        letterSpacing: 1.5,
    },
    clearAllBtn: {
        color: 'rgba(212,175,55,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    slotsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    // Slots
    slotWrapper: {
        alignItems: 'center',
        width: '15%',
    },
    slot: {
        width: 48,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    slotPressed: {
        backgroundColor: 'rgba(212,175,55,0.1)',
    },
    slotSprite: {
        width: 44,
        height: 44,
    },
    clearBtn: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#dc2626',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearBtnText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    slotName: {
        marginTop: 4,
        fontSize: 8,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'capitalize',
        textAlign: 'center',
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
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginHorizontal: 14,
        marginVertical: 14,
    },

    // Hint
    hintContainer: {
        paddingHorizontal: 32,
        paddingTop: 32,
        alignItems: 'center',
    },
    hintText: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
});
