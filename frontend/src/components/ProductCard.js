import React from "react";

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function ProductCard({ product, onPress }) {
  const image = product.images?.[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>VisionFit</Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>

      <Text style={styles.brand}>{product.brand}</Text>

      <Text style={styles.price}>
        ₱{Number(product.price).toLocaleString()}
      </Text>

      <Text style={styles.shape}>{product.frameShape}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    marginBottom: 18,
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
    marginBottom: 10,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#888888",
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  brand: {
    fontSize: 12,
    color: "#777777",
    marginBottom: 5,
  },

  price: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },

  shape: {
    fontSize: 11,
    color: "#777777",
  },
});
