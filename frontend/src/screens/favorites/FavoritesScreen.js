import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getFavorites, removeFavorite } from "../../api/favorites";

import { useFocusEffect } from "@react-navigation/native";

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [removingId, setRemovingId] = useState(null);

  const loadFavorites = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const result = await getFavorites();

      if (result.error) {
        setError(result.error.message);

        return;
      }

      setFavorites(result.data || []);
    } catch (err) {
      console.error("Load favorites error:", err);

      setError(
        err.response?.data?.error?.message || "Unable to load favorites.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadFavorites({
      showLoader: false,
    });
  };

  const handleRemove = (favorite) => {
    const product = favorite.productId;

    Alert.alert(
      "Remove Favorite",
      `Remove "${product?.name || "this product"}" from your favorites?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setRemovingId(favorite._id);

              const result = await removeFavorite(product._id);

              if (result.error) {
                Alert.alert("Unable to Remove", result.error.message);

                return;
              }

              setFavorites((current) =>
                current.filter((item) => item._id !== favorite._id),
              );
            } catch (err) {
              console.error("Remove favorite error:", err);

              Alert.alert(
                "Unable to Remove",
                err.response?.data?.error?.message ||
                  "Unable to remove favorite.",
              );
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.button} onPress={() => loadFavorites()}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.heart}>♡</Text>

        <Text style={styles.emptyTitle}>No favorites yet</Text>

        <Text style={styles.emptyText}>
          Save frames you love so you can easily find them later.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            navigation.navigate("MainTabs", {
              screen: "Shop",
            })
          }
        >
          <Text style={styles.buttonText}>Browse Eyewear</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Favorites</Text>

      <Text style={styles.subtitle}>
        {favorites.length}{" "}
        {favorites.length === 1 ? "saved frame" : "saved frames"}
      </Text>

      {favorites.map((favorite) => {
        const product = favorite.productId;

        const image = product?.images?.[0];

        const removing = removingId === favorite._id;

        return (
          <View key={favorite._id} style={styles.card}>
            <Pressable
              style={styles.imageContainer}
              onPress={() =>
                navigation.navigate("ProductDetails", {
                  productId: product?._id,
                })
              }
            >
              {image ? (
                <Image
                  source={{
                    uri: image,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>VisionFit</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.content}>
              <Text style={styles.brand}>{product?.brand}</Text>

              <Text style={styles.name} numberOfLines={2}>
                {product?.name}
              </Text>

              <Text style={styles.price}>
                ₱{Number(product?.price || 0).toLocaleString()}
              </Text>

              <Text style={styles.details}>
                {product?.frameShape} · {product?.material}
              </Text>

              <View style={styles.bottomRow}>
                <Pressable
                  style={styles.viewButton}
                  onPress={() =>
                    navigation.navigate("ProductDetails", {
                      productId: product?._id,
                    })
                  }
                >
                  <Text style={styles.viewButtonText}>View Product</Text>
                </Pressable>

                <Pressable
                  disabled={removing}
                  onPress={() => handleRemove(favorite)}
                >
                  <Text style={styles.removeText}>
                    {removing ? "Removing..." : "Remove"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 10,
    color: "#666666",
  },

  errorText: {
    textAlign: "center",
    marginBottom: 18,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  heart: {
    fontSize: 52,
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#666666",
    lineHeight: 20,
    marginBottom: 24,
  },

  button: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 11,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
    marginBottom: 20,
  },

  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  imageContainer: {
    width: 115,
    height: 115,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
    marginRight: 13,
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
    color: "#888888",
    fontSize: 13,
    fontWeight: "700",
  },

  content: {
    flex: 1,
  },

  brand: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 3,
  },

  name: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },

  price: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },

  details: {
    fontSize: 11,
    color: "#666666",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  viewButton: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  viewButtonText: {
    fontSize: 10,
    fontWeight: "700",
  },

  removeText: {
    fontSize: 10,
    color: "#777777",
    fontWeight: "600",
  },
});
