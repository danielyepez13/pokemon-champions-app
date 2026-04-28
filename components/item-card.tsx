import { Item } from "@/src/models/pokemon";
import { ITEM_IMAGES } from "@/src/utils/image-mapping";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

interface ItemCardProps {
  item: Item;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const imageSource = ITEM_IMAGES[item.spriteUrl];

  return (
    <View style={styles.cardContainer}>
      {/* Background layer */}
      <View style={styles.backgroundLayer} />
      
      {/* Golden corner accents */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      <View style={styles.contentContainer}>
        {/* Sprite Container */}
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.image}
              contentFit="contain"
            />
          ) : (
            <View style={styles.placeholderIcon}>
              <FontAwesome name="briefcase" size={24} color="rgba(212, 175, 55, 0.4)" />
            </View>
          )}
        </View>

        {/* Info Container */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
          
          <Text style={styles.effect} numberOfLines={3}>
            {item.effect}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
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
    zIndex: 1,
  },
  imageContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 50,
    height: 50,
  },
  placeholderIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d4af37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d4af37',
    textTransform: 'uppercase',
  },
  effect: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
});

