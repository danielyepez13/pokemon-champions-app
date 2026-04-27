import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { PokemonDAO } from '@/src/database/dao/pokemon.dao';
import { Pokemon } from '@/src/models/pokemon';
import { TypeBadge } from '@/src/components/type-badge';
import { getTypeColor } from '@/src/utils/colors';

import { POKEMON_IMAGES } from '@/src/utils/image-mapping';

export default function PokemonDetailScreen() {
  const { id } = useLocalSearchParams();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);

  useEffect(() => {
    if (id) {
      PokemonDAO.getById(Number(id)).then(setPokemon);
    }
  }, [id]);

  if (!pokemon) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Invocando espíritu...</Text>
      </View>
    );
  }

  const mainColor = pokemon.types.length > 0 ? getTypeColor(pokemon.types[0]) : '#d4af37';
  const dexString = String(pokemon.dexNumber).padStart(3, '0');
  const imageSource = POKEMON_IMAGES[pokemon.spriteDefault];

  // Helper for Stats
  const statLabels: Record<keyof typeof pokemon.stats, string> = {
    hp: 'PS',
    attack: 'Ataque',
    defense: 'Defensa',
    spAttack: 'At. Especial',
    spDefense: 'Def. Especial',
    speed: 'Velocidad',
    total: 'Total'
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={16} color="#d4af37" />
          <Text style={styles.backText}>Volver al Registro</Text>
        </Pressable>

        {/* Outer Frame */}
        <View style={styles.frameContainer}>
          <View style={styles.innerFrame}>
            
            {/* Image Section */}
            <View style={styles.imageBox}>
              <View style={[styles.glowRing, { borderColor: mainColor }]} />
              <View style={[styles.imageGlow, { backgroundColor: mainColor }]} />
              {imageSource ? (
                <Image 
                  source={imageSource} 
                  style={styles.mainImage} 
                  contentFit="contain" 
                />
              ) : (
                <FontAwesome name="image" size={60} color="#333" />
              )}
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.dexLabel}>Especie #{dexString}</Text>
              <Text style={styles.pokemonName}>{pokemon.name}</Text>
              <View style={styles.typesRow}>
                {pokemon.types.map(type => <TypeBadge key={type} type={type} />)}
              </View>
            </View>

            {/* Description Box */}
            <View style={styles.descBox}>
              <FontAwesome name="info-circle" size={20} color="rgba(212, 175, 55, 0.6)" style={styles.descIcon} />
              <Text style={styles.descText}>
                {pokemon.description || 'No hay descripción disponible para este Pokémon.'}
              </Text>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>
                <FontAwesome name="bolt" size={14} color="#d4af37" /> Estadísticas
              </Text>
              
              {Object.entries(pokemon.stats).filter(([key]) => key !== 'total').map(([key, value]) => (
                <View key={key} style={styles.statRow}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>{statLabels[key as keyof typeof statLabels]}</Text>
                    <Text style={styles.statValue}>{value} / 150</Text>
                  </View>
                  <View style={styles.statBarBackground}>
                    <View style={[
                      styles.statBarFill, 
                      { width: `${Math.min((Number(value) / 150) * 100, 100)}%` }
                    ]} />
                  </View>
                </View>
              ))}
            </View>

          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  loadingText: {
    color: '#d4af37',
    fontSize: 18,
    fontStyle: 'italic',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backText: {
    color: '#d4af37',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  frameContainer: {
    padding: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)', // gradient approximation
    borderRadius: 16,
  },
  innerFrame: {
    backgroundColor: '#0a0a0a',
    borderRadius: 15,
    padding: 20,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    width: '60%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  imageGlow: {
    position: 'absolute',
    width: '40%',
    aspectRatio: 1,
    borderRadius: 999,
    opacity: 0.2,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  mainImage: {
    width: '80%',
    height: '80%',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dexLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  pokemonName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  typesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  descBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    padding: 16,
    paddingTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  descIcon: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 8,
  },
  descText: {
    color: 'rgba(212, 175, 55, 0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsSection: {
    gap: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  statRow: {
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    letterSpacing: 1,
  },
  statBarBackground: {
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: '#d4af37',
  },
});
