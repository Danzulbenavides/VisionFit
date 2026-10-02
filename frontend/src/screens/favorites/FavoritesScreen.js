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

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

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
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#111111" />
          <Text style={s.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>

          <Pressable style={s.cta} onPress={() => loadFavorites()}>
            <Text style={s.ctaText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Favorites</Text>

          {favorites.length > 0 ? (
            <Text style={s.subtitle}>
              {favorites.length}{" "}
              {favorites.length === 1 ? "saved frame" : "saved frames"}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {favorites.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="heart-outline" size={104} color="#222" />

            <Text style={s.emptyTitle}>No favorites yet</Text>

            <Text style={s.emptyText}>
              Save frames you love so you can easily find them later.
            </Text>

            <Pressable
              style={s.cta}
              onPress={() =>
                navigation.navigate("MainTabs", {
                  screen: "Shop",
                })
              }
            >
              <Text style={s.ctaText}>Browse Eyewear</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.grid}>
            {favorites.map((favorite) => {
              const product = favorite.productId;
              const image = product?.images?.[0];
              const removing = removingId === favorite._id;

              const colors = Array.isArray(product?.colors)
                ? product.colors.slice(0, 3)
                : [];

              return (
                <Pressable
                  key={favorite._id}
                  style={s.product}
                  onPress={() =>
                    navigation.navigate("ProductDetails", {
                      productId: product?._id,
                    })
                  }
                >
                  <Pressable
                    style={s.heartBtn}
                    disabled={removing}
                    onPress={() => handleRemove(favorite)}
                  >
                    {removing ? (
                      <ActivityIndicator size="small" color="#E53935" />
                    ) : (
                      <Ionicons name="heart" size={17} color="#E53935" />
                    )}
                  </Pressable>

                  <View style={s.frameArt}>
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={s.frameImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={s.placeholder}>
                        <Text style={s.placeholderText}>VisionFit</Text>
                      </View>
                    )}
                  </View>

                  <Text style={s.brand} numberOfLines={1}>
                    {product?.brand || "VisionFit"}
                  </Text>

                  <Text style={s.name} numberOfLines={2}>
                    {product?.name || "Product"}
                  </Text>

                  <Text style={s.price}>
                    ₱{Number(product?.price || 0).toLocaleString()}
                  </Text>

                  {colors.length > 0 ? (
                    <View style={s.colorRow}>
                      {colors.map((color, i) => (
                        <Text key={`${favorite._id}-${i}`} style={s.colorTag}>
                          {color}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },

  content: { paddingBottom: 28, flexGrow: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: { marginTop: 10, color: "#666666" },

  errorText: { textAlign: "center", marginBottom: 18 },

  header: {
    height: 57,
    backgroundColor: "#fff",
    paddingHorizontal: 19,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  title: { fontSize: 17, fontWeight: "800", color: "#171717" },

  subtitle: { fontSize: 11, color: "#888888", marginTop: 2 },

  empty: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 36,
    paddingTop: 67,
    paddingBottom: 37,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
    marginTop: 18,
  },

  emptyText: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },

  cta: {
    height: 44,
    minWidth: 180,
    borderRadius: 24,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 23,
    paddingHorizontal: 20,
  },

  ctaText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },

  product: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  heartBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  frameArt: {
    height: 110,
    backgroundColor: "#F2F4F3",
    alignItems: "center",
    justifyContent: "center",
  },

  frameImage: { width: "100%", height: "100%" },

  placeholder: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: { color: "#888888", fontSize: 12, fontWeight: "700" },

  brand: {
    fontSize: 10,
    color: "#888888",
    marginTop: 10,
    marginHorizontal: 10,
  },

  name: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
    marginHorizontal: 10,
    color: "#111111",
  },

  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444444",
    marginTop: 4,
    marginHorizontal: 10,
  },

  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },

  colorTag: {
    fontSize: 9,
    fontWeight: "700",
    color: "#555555",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: "capitalize",
  },
});
