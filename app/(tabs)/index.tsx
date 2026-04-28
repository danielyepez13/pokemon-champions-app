import { StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect } from 'react';
import { usePokemonStore } from '@/src/stores/pokemon-store';
import { useSyncStore } from '@/src/stores/sync-store';
import { PokemonCard } from '@/src/components/pokemon-card';
import { router } from 'expo-router';

export default function PokedexScreen() {
  const { pokemons, filteredPokemons, isLoading, loadPokemons } = usePokemonStore();
  const { status, progress, phase, startSync } = useSyncStore();

  useEffect(() => {
    loadPokemons();
  }, []);

  if (status === 'syncing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.syncText}>Synchronizing {phase}...</Text>
        <Text style={styles.progressText}>{progress.current} / {progress.total}</Text>
      </View>
    );
  }

  if (pokemons.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No local data found</Text>
        <Pressable style={styles.button} onPress={startSync}>
          <Text style={styles.buttonText}>Sync now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={filteredPokemons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PokemonCard 
            pokemon={item} 
            onPress={(pokemon) => router.push(`/pokemon/${pokemon.id}`)} 
          />
        )}
        refreshing={isLoading}
        onRefresh={loadPokemons}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#050505',
    width: '100%',
  },
  flatListContent: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  syncText: {
    marginTop: 10,
    fontSize: 16,
    color: '#d4af37',
  },
  progressText: {
    fontSize: 14,
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#d4af37',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    width: '100%',
  },
  itemText: {
    fontSize: 16,
  },
});
