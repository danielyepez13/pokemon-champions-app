import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Pressable, Alert, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { ItemDAO } from '@/src/database/dao/pokemon.dao';
import { Item } from '@/src/models/pokemon';
import { ItemCard } from '@/components/item-card';
import { SyncOrchestrator, syncEvents } from '@/src/services/sync-orchestrator';
import { useNavigation } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, phase: '' });
  
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

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

  const handleSync = () => {
    Alert.alert(
      'Sincronizar',
      '¿Deseas actualizar la base de datos de Pokémon y Objetos? Esto puede tardar unos minutos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sincronizar', 
          onPress: async () => {
            setSyncing(true);
            SyncOrchestrator.startSync();
          }
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleSync} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginRight: 15 })}>
          <FontAwesome name="refresh" size={20} color={Colors[colorScheme ?? 'light'].text} />
        </Pressable>
      ),
    });
  }, [navigation, colorScheme]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
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
            <Text style={styles.emptyText}>No hay objetos disponibles.</Text>
            <Pressable onPress={handleSync} style={styles.syncButton}>
              <Text style={styles.syncButtonText}>Sincronizar ahora</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={syncing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  syncButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  syncTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#1f2937',
  },
  syncSubtitle: {
    fontSize: 14,
    marginTop: 10,
    color: '#4b5563',
  },
  syncWaitText: {
    fontSize: 12,
    marginTop: 20,
    color: '#9ca3af',
    fontStyle: 'italic',
  }
});
