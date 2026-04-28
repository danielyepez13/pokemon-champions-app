import React, { useState, useCallback } from 'react';
import {
    StyleSheet, FlatList, Pressable, Modal, TextInput,
    Alert, ActivityIndicator, View as RNView,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { TeamDAO, Team } from '@/src/database/dao/team.dao';
import { TeamService } from '@/src/services/team-service';
import { resolvePokemonSprite } from '@/src/utils/team-sprite-resolver';
import { router, useFocusEffect } from 'expo-router';

export default function TeamsScreen() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [teamName, setTeamName] = useState('');
    const [importing, setImporting] = useState(false);

    const loadTeams = async () => {
        setLoading(true);
        try {
            const data = await TeamDAO.getAllTeams();
            setTeams(data);
        } catch (error) {
            console.error('Failed to load teams:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reload every time the screen comes into focus (e.g. returning from team-detail)
    useFocusEffect(
        useCallback(() => {
            loadTeams();
        }, [])
    );

    const handleImport = async () => {
        if (!teamName.trim() || !pasteText.trim()) {
            Alert.alert('Error', 'Please provide both a team name and the Pokepaste text.');
            return;
        }
        setImporting(true);
        try {
            await TeamService.importFromPokepaste(teamName, pasteText);
            setModalVisible(false);
            setTeamName('');
            setPasteText('');
            loadTeams();
        } catch (error: any) {
            Alert.alert('Import Error', error.message || 'Failed to import team.');
        } finally {
            setImporting(false);
        }
    };

    const handleSetActive = async (teamId: number) => {
        await TeamDAO.setActiveTeam(teamId);
        loadTeams();
    };

    const handleDelete = (team: Team) => {
        Alert.alert(
            'Delete Team',
            `Delete "${team.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await TeamDAO.deleteTeam(team.id);
                        loadTeams();
                    },
                },
            ]
        );
    };

    const renderTeamCard = ({ item }: { item: Team }) => (
        <Pressable
            style={({ pressed }) => [
                styles.teamCard,
                item.isActive && styles.activeCard,
                pressed && styles.cardPressed,
            ]}
            onPress={() => router.push(`/team-detail?id=${item.id}`)}
        >
            {/* Golden corners */}
            <RNView style={[styles.corner, styles.cornerTL]} />
            <RNView style={[styles.corner, styles.cornerBR]} />

            {/* Header: name + badges + trash */}
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.teamName} numberOfLines={1}>{item.name}</Text>
                    {item.isActive && (
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>ACTIVE</Text>
                        </View>
                    )}
                </View>
                <Pressable
                    onPress={() => handleDelete(item)}
                    style={styles.deleteBtn}
                    hitSlop={8}
                >
                    <FontAwesome name="trash" size={16} color="rgba(255,80,80,0.7)" />
                </Pressable>
            </View>

            {/* 6-sprite preview row */}
            <View style={styles.previewRow}>
                {Array.from({ length: 6 }).map((_, i) => {
                    const preview = item.previews?.[i];
                    const source = preview
                        ? resolvePokemonSprite(preview.dexNumber, preview.form, preview.spriteUrl)
                        : null;
                    return (
                        <View key={i} style={styles.previewSlot}>
                            {source ? (
                                <Image source={source} style={styles.previewSprite} contentFit="contain" />
                            ) : (
                                <RNView style={styles.previewEmpty}>
                                    <FontAwesome
                                        name={preview ? 'question' : 'circle-o'}
                                        size={14}
                                        color="rgba(255,255,255,0.15)"
                                    />
                                </RNView>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Footer: date + set active */}
            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Pressable onPress={() => handleSetActive(item.id)} style={styles.setActiveBtn}>
                    <Text style={[styles.setActiveText, item.isActive && styles.setActiveTextOn]}>
                        {item.isActive ? '★ Active' : 'Set Active'}
                    </Text>
                </Pressable>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={teams}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={loadTeams}
                renderItem={renderTeamCard}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="group" size={60} color="rgba(212, 175, 55, 0.15)" />
                        <Text style={styles.emptyText}>No teams yet.</Text>
                        <Text style={styles.emptyHint}>Tap + to import a Pokepaste</Text>
                    </View>
                }
            />

            {/* FAB */}
            <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
                <FontAwesome name="plus" size={22} color="#000" />
            </Pressable>

            {/* Import Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <RNView style={[styles.corner, styles.cornerTL]} />
                        <RNView style={[styles.corner, styles.cornerBR]} />

                        <Text style={styles.modalTitle}>Import Pokepaste</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Team Name (e.g., Series 1 VGC)"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={teamName}
                            onChangeText={setTeamName}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Paste Showdown text here..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            value={pasteText}
                            onChangeText={setPasteText}
                        />

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                                disabled={importing}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.button, styles.importButton]}
                                onPress={handleImport}
                                disabled={importing}
                            >
                                {importing
                                    ? <ActivityIndicator color="#000" />
                                    : <Text style={styles.importButtonText}>Import Team</Text>
                                }
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    listContent: { padding: 16, paddingBottom: 100 },

    teamCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        overflow: 'hidden',
    },
    activeCard: { borderColor: '#d4af37', borderWidth: 2 },
    cardPressed: { opacity: 0.78 },

    corner: { position: 'absolute', width: 12, height: 12, borderColor: 'rgba(212,175,55,0.7)' },
    cornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        backgroundColor: 'transparent',
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        backgroundColor: 'transparent',
    },
    teamName: { fontSize: 17, fontWeight: 'bold', color: '#fff', flexShrink: 1 },
    activeBadge: {
        backgroundColor: '#d4af37',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeText: { color: '#000', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    deleteBtn: { padding: 4 },

    // 6-sprite preview
    previewRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
        backgroundColor: 'transparent',
    },
    previewSlot: {
        flex: 1,
        aspectRatio: 1,
        maxWidth: 48,
        backgroundColor: 'transparent',
    },
    previewSprite: { width: '100%', height: '100%' },
    previewEmpty: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    dateText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
    setActiveBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.35)',
    },
    setActiveText: { color: 'rgba(212,175,55,0.7)', fontSize: 12, fontWeight: '600' },
    setActiveTextOn: { color: '#d4af37' },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        backgroundColor: 'transparent',
    },
    emptyText: { fontSize: 18, color: 'rgba(255,255,255,0.4)', marginTop: 16 },
    emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 6 },

    fab: {
        position: 'absolute',
        bottom: 24, right: 24,
        width: 56, height: 56,
        borderRadius: 28,
        backgroundColor: '#d4af37',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#0a0a0a',
        padding: 24,
        borderRadius: 8,
        width: '90%',
        maxHeight: '82%',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 20, fontWeight: 'bold', color: '#fff',
        marginBottom: 20, textAlign: 'center',
    },
    input: {
        backgroundColor: '#111',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        fontSize: 14,
    },
    textArea: { height: 200, textAlignVertical: 'top' },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
    },
    button: {
        flex: 0.48, padding: 14,
        borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    },
    cancelButton: { backgroundColor: 'rgba(255,255,255,0.05)' },
    importButton: { backgroundColor: '#d4af37' },
    cancelButtonText: { color: '#fff', fontWeight: '600' },
    importButtonText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
});
