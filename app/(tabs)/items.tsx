import { ItemCard } from '@/components/item-card';
import { Text, View } from '@/components/Themed';
import { ItemDAO } from '@/src/database/dao/pokemon.dao';
import { Item } from '@/src/models/pokemon';
import { syncEvents } from '@/src/services/sync-orchestrator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet } from 'react-native';

import { router } from 'expo-router';

export default function ItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, phase: '' });

  const loadItems = async () => {
    try {
      const data = await ItemDAO.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();

    const onProgress = (data: { current: number, total: number, phase: string }) => {
      setSyncProgress(data);
    };

    const onComplete = () => {
      setSyncing(false);
      loadItems();
      Alert.alert('Éxito', 'Sincronización completada correctamente.');
    };

    const onError = (msg: string) => {
      setSyncing(false);
      Alert.alert('Error', `Error durante la sincronización: ${msg}`);
    };

    syncEvents.on('progress', onProgress);
    syncEvents.on('complete', onComplete);
    syncEvents.on('error', onError);

    return () => {
      syncEvents.off('progress', onProgress);
      syncEvents.off('complete', onComplete);
      syncEvents.off('error', onError);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ItemCard item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="briefcase" size={60} color="rgba(212, 175, 55, 0.2)" />
            <Text style={styles.emptyText}>No hay objetos disponibles.</Text>
            <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
              <Text style={styles.settingsButtonText}>Ir a Configuración</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={syncing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.syncTitle}>
              {syncProgress.phase === 'items' ? 'Sincronizando Objetos...' : 'Sincronizando Pokémon...'}
            </Text>
            {syncProgress.total > 0 && (
              <Text style={styles.syncSubtitle}>
                {syncProgress.phase === 'items' ? 'Procesando objeto:' : 'Procesando Pokémon:'} {syncProgress.current} / {syncProgress.total}
              </Text>
            )}
            <Text style={styles.syncWaitText}>Por favor, no cierres la aplicación.</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  listContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 20,
    fontWeight: '500',
  },
  settingsButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  settingsButtonText: {
    color: '#d4af37',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  corner: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderColor: 'rgba(212, 175, 55, 0.8)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
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
  }
});

