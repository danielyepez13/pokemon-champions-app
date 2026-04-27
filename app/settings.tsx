import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { SyncOrchestrator, syncEvents } from '@/src/services/sync-orchestrator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack } from 'expo-router';

export default function SettingsScreen() {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, phase: '' });
  const colorScheme = useColorScheme();

  useEffect(() => {
    const onProgress = (data: { current: number, total: number, phase: string }) => {
      setSyncProgress(data);
    };

    const onComplete = () => {
      setSyncing(false);
      Alert.alert('Éxito', 'Base de datos reiniciada y sincronizada correctamente.');
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

  const handleFullReset = () => {
    Alert.alert(
      'Reinicio Total',
      'Esta acción borrará toda la base de datos local y volverá a cargar todo desde cero. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reiniciar y Sincronizar', 
          style: 'destructive',
          onPress: async () => {
            setSyncing(true);
            SyncOrchestrator.cleanSync();
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Configuración' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos y Almacenamiento</Text>
          
          <Pressable 
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]} 
            onPress={handleFullReset}
          >
            <View style={styles.optionIcon}>
              <FontAwesome name="trash" size={20} color="#ef4444" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Borrar y Sincronizar Todo</Text>
              <Text style={styles.optionDescription}>
                Elimina la base de datos actual y descarga todo de nuevo (Pokémon y Objetos).
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Desarrollado para</Text>
            <Text style={styles.infoValue}>Pokémon Champions Dex</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <FontAwesome name="info-circle" size={16} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={styles.noteText}>
            Nota: Las imágenes locales deben estar en la carpeta 'assets' para que sean visibles en la aplicación.
          </Text>
        </View>
      </ScrollView>

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
            <Text style={styles.syncWaitText}>Borrando base de datos y reconstruyendo...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  noteBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
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
    textAlign: 'center',
  }
});
