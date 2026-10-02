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

import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../api/cart";

import { useFocusEffect } from "@react-navigation/native";

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingItem, setUpdatingItem] = useState(null);

  const loadCart = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const result = await getCart();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setCart(result.data);
    } catch (err) {
      console.error("Load cart error:", err);

      setError(
        err.response?.data?.error?.message || "Unable to load your cart.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadCart({
      showLoader: false,
    });
  };

  const handleIncrease = async (item) => {
    const currentQuantity = item.quantity;
    const stock = item.productId?.stock ?? 0;

    if (currentQuantity >= stock) {
      Alert.alert("Stock Limit", "You cannot add more of this product.");
      return;
    }

    try {
      setUpdatingItem(item._id);

      const result = await updateCartItem(item.productId._id, {
        quantity: currentQuantity + 1,
      });

      if (result.error) {
        Alert.alert("Unable to Update", result.error.message);
        return;
      }

      setCart(result.data);
    } catch (err) {
      console.error("Increase cart item error:", err);

      Alert.alert(
        "Unable to Update",
        err.response?.data?.error?.message || "Unable to update cart item.",
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleDecrease = async (item) => {
    if (item.quantity <= 1) {
      await handleRemove(item);
      return;
    }

    try {
      setUpdatingItem(item._id);

      const result = await updateCartItem(item.productId._id, {
        quantity: item.quantity - 1,
      });

      if (result.error) {
        Alert.alert("Unable to Update", result.error.message);
        return;
      }

      setCart(result.data);
    } catch (err) {
      console.error("Decrease cart item error:", err);

      Alert.alert(
        "Unable to Update",
        err.response?.data?.error?.message || "Unable to update cart item.",
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemove = async (item) => {
    Alert.alert(
      "Remove Item",
      `Remove ${item.productId?.name || "this item"} from your cart?`,
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
              setUpdatingItem(item._id);

              const result = await removeCartItem(item.productId._id);

              if (result.error) {
                Alert.alert("Unable to Remove", result.error.message);
                return;
              }

              await loadCart({
                showLoader: false,
              });
            } catch (err) {
              console.error("Remove cart item error:", err);

              Alert.alert(
                "Unable to Remove",
                err.response?.data?.error?.message || "Unable to remove item.",
              );
            } finally {
              setUpdatingItem(null);
            }
          },
        },
      ],
    );
  };

  const handleClearCart = () => {
    Alert.alert("Clear Cart", "Remove all items from your cart?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            const result = await clearCart();

            if (result.error) {
              Alert.alert("Unable to Clear", result.error.message);
              return;
            }

            await loadCart({
              showLoader: false,
            });
          } catch (err) {
            console.error("Clear cart error:", err);

            Alert.alert(
              "Unable to Clear",
              err.response?.data?.error?.message ||
                "Unable to clear your cart.",
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#111111" />
          <Text style={s.loadingText}>Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>

          <Pressable style={s.retryButton} onPress={() => loadCart()}>
            <Text style={s.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const items = Array.isArray(cart?.items) ? cart.items : [];

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = Number(item?.unitPrice || 0);
    const quantity = Number(item?.quantity || 0);

    return sum + unitPrice * quantity;
  }, 0);

  const itemCount = cart?.totalItems || items.length;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <Pressable
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={25} />
        </Pressable>

        <Text style={s.headerTitle}>Shopping cart ({itemCount})</Text>

        <Pressable onPress={handleClearCart} disabled={items.length === 0}>
          <Text style={[s.clearText, items.length === 0 && s.clearTextDisabled]}>
            Clear
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {items.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="cart-outline" size={80} color="#CCCCCC" />
            <Text style={s.emptyTitle}>Your cart is empty</Text>
            <Text style={s.emptyText}>
              Find a frame you love and add it to your cart.
            </Text>
            <Pressable
              style={s.shopButton}
              onPress={() => navigation.navigate("Shop")}
            >
              <Text style={s.shopButtonText}>Browse products</Text>
            </Pressable>
          </View>
        ) : (
          items.map((item, index) => {
            const product = item?.productId;
            const image = product?.images?.[0];
            const isUpdating = updatingItem === item?._id;
            const itemKey = item?._id || product?._id || `cart-item-${index}`;

            return (
              <View style={s.cartItem} key={itemKey}>
                <Pressable
                  style={s.itemArt}
                  onPress={() => {
                    if (!product?._id) {
                      return;
                    }

                    navigation.navigate("ProductDetails", {
                      productId: product._id,
                    });
                  }}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={s.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={s.imagePlaceholder}>
                      <Text style={s.placeholderText}>VisionFit</Text>
                    </View>
                  )}
                </Pressable>

                <View style={s.itemInfo}>
                  <Text style={s.brand}>{product?.brand || "VisionFit"}</Text>

                  <Text style={s.itemName} numberOfLines={2}>
                    {product?.name || "Product"}
                  </Text>

                  <View style={s.optionRow}>
                    <Text style={s.option}>
                      Lens: {formatValue(item?.lensType)}
                    </Text>
                    <Text style={s.option}>
                      Coating: {formatValue(item?.coating)}
                    </Text>
                  </View>

                  <View style={s.itemBottomRow}>
                    <Text style={s.itemPrice}>
                      ₱{Number(item?.unitPrice || 0).toLocaleString()}
                    </Text>

                    <View style={s.quantityRow}>
                      <Pressable
                        style={[
                          s.quantityButton,
                          isUpdating && s.disabledButton,
                        ]}
                        disabled={isUpdating}
                        onPress={() => handleDecrease(item)}
                      >
                        <Text style={s.quantityButtonText}>−</Text>
                      </Pressable>

                      <Text style={s.quantityText}>{item?.quantity || 0}</Text>

                      <Pressable
                        style={[
                          s.quantityButton,
                          isUpdating && s.disabledButton,
                        ]}
                        disabled={isUpdating}
                        onPress={() => handleIncrease(item)}
                      >
                        <Text style={s.quantityButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={s.trashButton}
                  disabled={isUpdating}
                  onPress={() => handleRemove(item)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color="#6A6A6A" />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={s.checkout}>
          <View>
            <Text style={s.totalLabel}>TOTAL</Text>
            <Text style={s.total}>₱{subtotal.toLocaleString()}</Text>
            <Text style={s.delivery}>Delivery at checkout</Text>
          </View>

          <Pressable
            style={s.checkoutButton}
            onPress={() => navigation.navigate("Checkout")}
          >
            <Text style={s.checkoutText}>Check out</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function formatValue(value) {
  if (!value) {
    return "None";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: { marginTop: 12, color: "#666666" },

  errorText: { textAlign: "center", color: "#444444", marginBottom: 18 },

  retryButton: {
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 24,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  retryButtonText: { color: "#FFFFFF", fontWeight: "700" },

  header: {
    height: 55,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },

  headerTitle: { fontSize: 14, fontWeight: "800" },

  clearText: { fontSize: 12, fontWeight: "700", color: "#444444" },

  clearTextDisabled: { color: "#CCCCCC" },

  content: { padding: 14, paddingBottom: 40 },

  empty: { alignItems: "center", paddingTop: 80 },

  emptyTitle: { fontSize: 17, fontWeight: "800", marginTop: 16 },

  emptyText: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },

  shopButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  shopButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 10,
  },

  itemArt: {
    height: 88,
    width: 94,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
  },

  itemImage: { width: "100%", height: "100%" },

  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: { fontSize: 11, fontWeight: "700", color: "#888888" },

  itemInfo: { flex: 1 },

  brand: { fontSize: 10, color: "#888888", marginBottom: 3 },

  itemName: { fontSize: 14, fontWeight: "800", marginBottom: 6 },

  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },

  option: {
    fontSize: 9,
    color: "#555555",
    backgroundColor: "#F0F0F0",
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 5,
    marginBottom: 4,
  },

  itemBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  itemPrice: { fontSize: 13, fontWeight: "800" },

  quantityRow: { flexDirection: "row", alignItems: "center" },

  quantityButton: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  quantityButtonText: { fontSize: 16, fontWeight: "600" },

  quantityText: {
    width: 28,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },

  disabledButton: { opacity: 0.35 },

  trashButton: { padding: 4 },

  checkout: {
    height: 75,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalLabel: { fontSize: 9, fontWeight: "800", color: "#666666" },

  total: { fontSize: 16, fontWeight: "800" },

  delivery: { fontSize: 10, color: "#888888" },

  checkoutButton: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
