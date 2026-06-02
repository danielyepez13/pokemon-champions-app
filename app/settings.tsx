import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useSyncStore } from '@/src/stores/sync-store';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';

export default function SettingsScreen() {
  const [lastMetaSync, setLastMetaSync] = useState<string | null>(null);
  const prevStatus = useRef(useSyncStore.getState().status);

  const {
    status,
    mode,
    phase,
    progress,
    error,
    cleanSync,
    syncMeta,
    resetStatus,
  } = useSyncStore();

  useEffect(() => {
    loadLastMetaSync();
  }, []);

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (prev === 'syncing' && status === 'done') {
      if (mode === 'full') {
        Alert.alert('Success', 'Database reset and synchronized correctly.', [
          { text: 'OK', onPress: resetStatus },
        ]);
      } else if (mode === 'meta') {
        loadLastMetaSync();
        Alert.alert('Success', 'Meta data synchronized successfully.', [
          { text: 'OK', onPress: resetStatus },
        ]);
      } else {
        resetStatus();
      }
    } else if (prev === 'syncing' && status === 'error' && error) {
      Alert.alert('Error', `Error during synchronization: ${error}`, [
        { text: 'OK', onPress: resetStatus },
      ]);
    }
  }, [status, mode, error, resetStatus]);

  const loadLastMetaSync = async () => {
    try {
      const { SyncDAO } = await import('@/src/database/dao/sync.dao');
      const lastSync = await SyncDAO.getMetadata('pikalytics_last_sync');
      setLastMetaSync(lastSync);
    } catch { /* ignore if DB not ready */ }
  };

  const handleMetaSync = () => {
    Alert.alert(
      'Sync Meta Data',
      'Download the latest competitive usage data from Pikalytics (moves, abilities, items). This takes about 15 seconds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync Now',
          onPress: () => syncMeta(true),
        },
      ]
    );
  };

  const handleFullReset = () => {
    Alert.alert(
      'Full Reset',
      'This action will erase the entire local database and reload everything from scratch. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset and Sync',
          style: 'destructive',
          onPress: () => cleanSync(),
        },
      ]
    );
  };

  const syncing = status === 'syncing';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>

          <Pressable
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={handleFullReset}
          >
            <View style={styles.optionIcon}>
              <FontAwesome name="trash" size={20} color="#ef4444" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Clear & Sync Everything</Text>
              <Text style={styles.optionDescription}>
                Deletes cached Pokédex and meta data, then re-downloads from Pikalytics and PokeAPI.
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={handleMetaSync}
          >
            <View style={[styles.optionIcon, styles.optionIconMeta]}>
              <FontAwesome name="line-chart" size={20} color="#818cf8" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Sync Meta Data</Text>
              <Text style={styles.optionDescription}>
                Downloads competitive usage data from Pikalytics (moves, abilities, items).
              </Text>
              {lastMetaSync && (
                <Text style={styles.lastSyncText}>
                  Last sync: {new Date(lastMetaSync).toLocaleDateString()}
                </Text>
              )}
            </View>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Developed for</Text>
            <Text style={styles.infoValue}>Pokemon Champions Dex</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <FontAwesome name="info-circle" size={16} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={styles.noteText}>
            Note: Local images must be in the 'assets' folder to be visible in the application.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={syncing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.syncTitle}>
              {phase === 'pikalytics'
                ? 'Synchronizing Meta Data...'
                : 'Synchronizing Pokemon...'}
            </Text>
            {progress.total > 0 && (
              <Text style={styles.syncSubtitle}>
                {phase === 'pikalytics'
                  ? 'Fetching Pikalytics data:'
                  : 'Processing Pokemon:'}{' '}
                {progress.current} / {progress.total}
              </Text>
            )}
            <Text style={styles.syncWaitText}>
              {phase === 'pikalytics'
                ? 'Downloading competitive usage data...'
                : 'Deleting database and rebuilding...'}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d4af37',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
    opacity: 0.8,
    backgroundColor: 'transparent',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  optionContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    lineHeight: 18,
  },
  optionIconMeta: {
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#818cf8',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'transparent',
  },
  infoLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d4af37',
  },
  noteBox: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    marginTop: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    padding: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    width: '85%',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  syncTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 25,
    color: '#fff',
    textAlign: 'center',
  },
  syncSubtitle: {
    fontSize: 16,
    marginTop: 12,
    color: '#d4af37',
  },
  syncWaitText: {
    fontSize: 13,
    marginTop: 25,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
