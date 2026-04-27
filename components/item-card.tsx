import { Item } from "@/src/models/pokemon";
import { TYPE_COLORS } from "@/src/utils/colors";
import { ITEM_IMAGES } from "@/src/utils/image-mapping";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface ItemCardProps {
  item: Item;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const imageSource = ITEM_IMAGES[item.spriteUrl];

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderIcon}>
            <FontAwesome name="briefcase" size={24} color="#d1d5db" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.name}</Text>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: TYPE_COLORS.default },
            ]}
          >
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.effect} numberOfLines={3}>
          {item.effect}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginRight: 12,
  },
  image: {
    width: 48,
    height: 48,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  effect: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 18,
  },
});
