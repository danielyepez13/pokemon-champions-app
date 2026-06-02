import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    Pressable,
    View as RNView,
    Platform,
    UIManager,
    LayoutAnimation,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import DraggableFlatList, {
    ScaleDecorator,
    RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TeamDAO } from '@/src/database/dao/team.dao';
import { resolvePokemonSprite, resolveItemSprite } from '@/src/utils/team-sprite-resolver';
import { getNature } from '@/src/utils/natures';
import { calcStat, DB_STAT_MAP, STAT_ORDER, STAT_LABELS } from '@/src/utils/stat-calculator';
import { getTypeColor } from '@/src/utils/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_EV = 32;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypePill({ type }: { type: string }) {
    const color = getTypeColor(type);
    return (
        <RNView style={[styles.typePill, { backgroundColor: color + '30', borderColor: color + '80' }]}>
            <Text style={[styles.typePillText, { color }]}>{type.toUpperCase()}</Text>
        </RNView>
    );
}

interface StatRowProps {
    stat: string;
    base: number;
    ev: number;
    final: number;
    isUp: boolean;
    isDown: boolean;
}

function StatRow({ stat, base, ev, final: finalVal, isUp, isDown }: StatRowProps) {
    const label = STAT_LABELS[stat] ?? stat;
    const pct = Math.min(ev / MAX_EV, 1);
    const finalColor = isUp ? '#4CAF50' : isDown ? '#ef5350' : '#e0e0e0';
    const indicator = isUp ? ' ▲' : isDown ? ' ▼' : '';

    return (
        <RNView style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statBase}>{base}</Text>
            <RNView style={styles.barTrack}>
                <RNView style={[styles.barFill, ev > 0 && { width: `${pct * 100}%` }]} />
            </RNView>
            <Text style={styles.statEv}>{ev > 0 ? ev : '—'}</Text>
            <Text style={[styles.statFinal, { color: finalColor }]}>
                {finalVal}{indicator}
            </Text>
        </RNView>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TeamDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [teamName, setTeamName] = useState('...');
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openStats, setOpenStats] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!id) return;
        TeamDAO.getTeamWithMembers(parseInt(id)).then(data => {
            if (data) {
                setTeamName(data.name);
                setMembers(data.members ?? []);
            }
            setLoading(false);
        });
    }, [id]);

    const toggleStats = useCallback((memberId: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenStats(prev => {
            const next = new Set(prev);
            next.has(memberId) ? next.delete(memberId) : next.add(memberId);
            return next;
        });
    }, []);

    const handleDragEnd = useCallback(async ({ data }: { data: any[] }) => {
        const originalIds = members.map(m => m.id);
        const newIds = data.map(m => m.id);
        const changed = newIds.some((id, idx) => id !== originalIds[idx]);

        // Always update local state to keep UI responsive
        setMembers(data.map((item, idx) => ({ ...item, team_order: idx + 1 })));

        // Only persist if order actually changed
        if (changed) {
            const updates = data.map((item, idx) => ({ id: item.id, teamOrder: idx + 1 }));
            await TeamDAO.updateMemberOrders(updates);
        }
    }, [members]);

    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<any>) => {
        const types: string[] = item.types_list
            ? item.types_list.split(',').filter(Boolean)
            : [];
        const typeColor = getTypeColor(types[0] ?? '');

        // --- Sprites ---
        const pokemonSprite = resolvePokemonSprite(item.dex_number, item.form ?? '', item.sprite_url);
        const itemName = item.item_name || item.raw_item_name;
        const itemSprite = itemName ? resolveItemSprite(itemName) : null;
        const abilityText = item.ability_name || item.raw_ability_name;

        // --- Stat Calculation ---
        const evs: Record<string, number> = item.evs ? JSON.parse(item.evs) : {};
        const ivs: Record<string, number> = item.ivs ? JSON.parse(item.ivs) : {};
        const nature = getNature(item.nature);

        const BASE_MAP: Record<string, number> = {
            HP: item.base_hp  ?? 0,
            Atk: item.base_atk ?? 0,
            Def: item.base_def ?? 0,
            SpA: item.base_spa ?? 0,
            SpD: item.base_spd ?? 0,
            Spe: item.base_spe ?? 0,
        };

        const statRows = STAT_ORDER.map(stat => {
            const base = BASE_MAP[stat];
            const ev = evs[stat] ?? 0;
            const iv = ivs[stat] ?? 31;
            const final = calcStat(stat, base, ev, iv, nature);
            return {
                stat,
                base,
                ev,
                final,
                isUp: nature.up === stat,
                isDown: nature.down === stat,
            };
        });
        const total = statRows.reduce((sum, r) => sum + r.base, 0);
        const isOpen = openStats.has(item.id);

        return (
            <ScaleDecorator activeScale={0.97}>
                <View
                    style={[
                        styles.memberCard,
                        { borderLeftColor: typeColor, shadowColor: typeColor },
                        isActive && styles.memberCardActive,
                    ]}
                >
                    {/* ── HEADER: Sprite + Info + Drag Handle ── */}
                    <RNView style={styles.memberHeader}>
                        {/* Sprite */}
                        <RNView style={[styles.spriteBox, { borderColor: typeColor + '55' }]}>
                            {pokemonSprite ? (
                                <Image source={pokemonSprite} style={styles.sprite} contentFit="contain" />
                            ) : (
                                <FontAwesome name="question-circle" size={36} color="rgba(212,175,55,0.3)" />
                            )}
                        </RNView>

                        {/* Info */}
                        <RNView style={styles.memberInfo}>
                            <Text style={styles.pokemonName} numberOfLines={1}>
                                {item.pokemon_name}
                            </Text>

                            {types.length > 0 && (
                                <RNView style={styles.typesRow}>
                                    {types.map(t => <TypePill key={t} type={t} />)}
                                </RNView>
                            )}

                            {abilityText ? (
                                <Text style={styles.abilityText}>{abilityText}</Text>
                            ) : null}

                            <RNView style={styles.metaRow}>
                                <RNView style={styles.metaBadge}>
                                    <Text style={styles.metaBadgeText}>Lv {item.level}</Text>
                                </RNView>
                                {item.nature ? (
                                    <RNView style={styles.metaBadge}>
                                        <Text style={styles.metaBadgeText}>{item.nature}</Text>
                                    </RNView>
                                ) : null}
                            </RNView>

                            {itemName ? (
                                <RNView style={styles.itemRow}>
                                    {itemSprite ? (
                                        <Image source={itemSprite} style={styles.itemSprite} contentFit="contain" />
                                    ) : (
                                        <FontAwesome name="briefcase" size={11} color="#d4af37" />
                                    )}
                                    <Text style={styles.itemText} numberOfLines={1}>{itemName}</Text>
                                </RNView>
                            ) : null}
                        </RNView>

                        {/* Drag Handle */}
                        <Pressable onLongPress={drag} delayLongPress={150} style={styles.dragHandle}>
                            <FontAwesome name="bars" size={16} color="rgba(255,255,255,0.25)" />
                        </Pressable>
                    </RNView>

                    {/* ── MOVES 2×2 ── */}
                    {item.moves && item.moves.length > 0 && (
                        <RNView style={styles.section}>
                            <Text style={styles.sectionLabel}>MOVES</Text>
                            <RNView style={styles.movesGrid}>
                                {item.moves.map((move: string, idx: number) => (
                                    <RNView key={idx} style={styles.moveCell}>
                                        <Text style={styles.moveText} numberOfLines={1}>{move}</Text>
                                    </RNView>
                                ))}
                            </RNView>
                        </RNView>
                    )}

                    {/* ── STATS ACCORDION ── */}
                    <RNView style={styles.section}>
                        <Pressable style={styles.accordionHeader} onPress={() => toggleStats(item.id)}>
                            <Text style={styles.sectionLabel}>STATS</Text>
                            <RNView style={styles.accordionRight}>
                                <Text style={styles.totalPreview}>Total: {total}</Text>
                                <FontAwesome
                                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                                    size={11}
                                    color="rgba(255,255,255,0.35)"
                                />
                            </RNView>
                        </Pressable>

                        {isOpen && (
                            <RNView style={styles.statBars}>
                                {/* Column headers */}
                                <RNView style={styles.statHeaderRow}>
                                    <Text style={[styles.statLabel, styles.headerCell]}>STAT</Text>
                                    <Text style={[styles.statBase, styles.headerCell]}>BASE</Text>
                                    <RNView style={styles.barTrack} />
                                    <Text style={[styles.statEv, styles.headerCell]}>EV</Text>
                                    <Text style={[styles.statFinal, styles.headerCell]}>FINAL</Text>
                                </RNView>

                                {statRows.map(row => <StatRow key={row.stat} {...row} />)}

                                {/* Total row */}
                                <RNView style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>TOTAL</Text>
                                    <Text style={styles.totalValue}>{total}</Text>
                                </RNView>
                            </RNView>
                        )}
                    </RNView>
                </View>
            </ScaleDecorator>
        );
    }, [openStats, toggleStats]);

    if (loading) {
        return (
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.center}>
                    <Stack.Screen options={{ title: '...' }} />
                    <ActivityIndicator size="large" color="#d4af37" />
                </View>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Stack.Screen options={{ title: teamName }} />
                <DraggableFlatList
                    data={members}
                    onDragEnd={handleDragEnd}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.scroll}
                    activationDistance={12}
                />
            </View>
        </GestureHandlerRootView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' },
    scroll: { padding: 14, paddingBottom: 50 },

    memberCard: {
        backgroundColor: '#0d0d0d',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        borderLeftWidth: 3,
        marginBottom: 14,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    memberCardActive: {
        opacity: 0.92,
        shadowOpacity: 0.4,
        elevation: 8,
    },

    // Header
    memberHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 10,
    },
    spriteBox: {
        width: 76,
        height: 76,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    sprite: { width: 66, height: 66 },

    memberInfo: { flex: 1 },
    pokemonName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    typesRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
    typePill: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    typePillText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.6 },
    abilityText: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
    metaRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
    metaBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    metaBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    itemSprite: { width: 20, height: 20 },
    itemText: { color: '#d4af37', fontSize: 12, fontWeight: '600', flex: 1 },

    // Drag handle
    dragHandle: {
        padding: 8,
        marginLeft: 4,
        alignSelf: 'stretch',
        justifyContent: 'center',
    },

    // Sections
    section: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    sectionLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.28)',
        letterSpacing: 1.5,
        marginBottom: 8,
    },

    // Moves
    movesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    moveCell: {
        width: '48%',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    moveText: { color: '#e0e0e0', fontSize: 13, fontWeight: '500' },

    // Stats Accordion
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
    },
    accordionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    totalPreview: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '600',
    },

    // Stat bars
    statBars: { marginTop: 8, gap: 5 },
    statHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
        paddingBottom: 4,
    },
    headerCell: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabel: {
        width: 30,
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'right',
    },
    statBase: {
        width: 28,
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'right',
    },
    barTrack: {
        flex: 1,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#d4af37',
        borderRadius: 3,
        width: 0, // default, overridden inline
    },
    statEv: {
        width: 24,
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
        textAlign: 'right',
    },
    statFinal: {
        width: 40,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'right',
    },

    // Total row
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 1,
    },
    totalValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#d4af37',
    },
});
