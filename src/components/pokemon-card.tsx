import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { Pokemon } from '../models/pokemon';
import { TypeBadge } from './type-badge';
import { getTypeColor } from '../utils/colors';

import { POKEMON_IMAGES } from '../utils/image-mapping';

interface PokemonCardProps {
  pokemon: Pokemon;
  onPress: (pokemon: Pokemon) => void;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onPress }) => {
  // Use the first type's color for subtle accents if available, else gold
  const mainColor = pokemon.types.length > 0 ? getTypeColor(pokemon.types[0]) : '#d4af37';
  
  // Format dex number to 3 digits
  const dexString = String(pokemon.dexNumber).padStart(3, '0');

  // Resolve image source from mapping
  const imageSource = POKEMON_IMAGES[pokemon.spriteDefault];

  return (
    <Pressable onPress={() => onPress(pokemon)} style={({ pressed }) => [
      styles.cardContainer,
      pressed && styles.cardPressed
    ]}>
      {/* Background layer */}
      <View style={styles.backgroundLayer} />
      
      {/* Golden corner accents - Top Left */}
      <View style={[styles.corner, styles.cornerTL]} />
      {/* Golden corner accents - Bottom Right */}
      <View style={[styles.corner, styles.cornerBR]} />

      <View style={styles.contentContainer}>
        {/* Sprite Container */}
        <View style={styles.imageContainer}>
          <View style={[styles.glow, { backgroundColor: mainColor }]} />
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.image}
              contentFit="contain"
              transition={300}
            />
          ) : (
            <View style={styles.placeholderIcon}>
              <FontAwesome name="image" size={24} color="#333" />
            </View>
          )}
        </View>

        {/* Info Container */}
        <View style={styles.infoContainer}>
          <Text style={styles.dexNumber}>Species #{dexString}</Text>
          <Text style={styles.name}>{pokemon.name}</Text>
          
          <View style={styles.typesContainer}>
            {pokemon.types.map(type => (
              <TypeBadge key={type} type={type} />
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)', // #d4af37/20
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    // Shadow for that magical depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  cardPressed: {
    borderColor: '#d4af37',
    transform: [{ scale: 0.98 }],
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
  },
  corner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    zIndex: 1, // Ensure content is above background
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.15, // Subtle elemental glow behind sprite
  },
  image: {
    width: 64,
    height: 64,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  dexNumber: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
