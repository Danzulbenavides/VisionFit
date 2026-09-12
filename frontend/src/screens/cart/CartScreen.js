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
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={() => loadCart()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const items = Array.isArray(cart?.items) ? cart.items : [];

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = Number(item?.unitPrice || 0);
    const quantity = Number(item?.quantity || 0);

    return sum + unitPrice * quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.emptyIcon}>🛒</Text>

        <Text style={styles.emptyTitle}>Your cart is empty</Text>

        <Text style={styles.emptyText}>
          Find a frame you love and add it to your cart.
        </Text>

        <Pressable
          style={styles.shopButton}
          onPress={() => navigation.navigate("Shop")}
        >
          <Text style={styles.shopButtonText}>Shop Eyewear</Text>
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Cart</Text>

          <Text style={styles.subtitle}>
            {cart?.totalItems || items.length}{" "}
            {(cart?.totalItems || items.length) === 1 ? "item" : "items"}
          </Text>
        </View>

        <Pressable onPress={handleClearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      {items.map((item, index) => {
        const product = item?.productId;
        const image = product?.images?.[0];
        const isUpdating = updatingItem === item?._id;

        /*
         * Guaranteed unique React key.
         *
         * Priority:
         * 1. Cart item ID
         * 2. Product ID
         * 3. Fallback using index
         */
        const itemKey = item?._id || product?._id || `cart-item-${index}`;

        return (
          <View key={itemKey} style={styles.cartItem}>
            <Pressable
              style={styles.productImageContainer}
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
                  source={{
                    uri: image,
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>VisionFit</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.itemContent}>
              <Text style={styles.brand}>{product?.brand || "VisionFit"}</Text>

              <Text style={styles.productName} numberOfLines={2}>
                {product?.name || "Product"}
              </Text>

              <Text style={styles.itemPrice}>
                ₱{Number(item?.unitPrice || 0).toLocaleString()}
              </Text>

              <Text style={styles.itemDetail}>
                Lens: {formatValue(item?.lensType)}
              </Text>

              <Text style={styles.itemDetail}>
                Coating: {formatValue(item?.coating)}
              </Text>

              <View style={styles.itemBottomRow}>
                <View style={styles.quantityRow}>
                  <Pressable
                    style={[
                      styles.quantityButton,
                      isUpdating && styles.disabledButton,
                    ]}
                    disabled={isUpdating}
                    onPress={() => handleDecrease(item)}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>

                  <Text style={styles.quantityText}>{item?.quantity || 0}</Text>

                  <Pressable
                    style={[
                      styles.quantityButton,
                      isUpdating && styles.disabledButton,
                    ]}
                    disabled={isUpdating}
                    onPress={() => handleIncrease(item)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>

                <Pressable
                  disabled={isUpdating}
                  onPress={() => handleRemove(item)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>

          <Text style={styles.summaryValue}>₱{subtotal.toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>

          <Text style={styles.totalValue}>₱{subtotal.toLocaleString()}</Text>
        </View>
      </View>

      <Pressable
        style={styles.checkoutButton}
        onPress={() => navigation.navigate("Checkout")}
      >
        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
      </Pressable>
    </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#666666",
  },

  errorText: {
    textAlign: "center",
    color: "#444444",
    marginBottom: 18,
  },

  retryButton: {
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  emptyIcon: {
    fontSize: 48,
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

  shopButton: {
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 3,
  },

  clearText: {
    fontSize: 13,
    fontWeight: "700",
  },

  cartItem: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 18,
    marginBottom: 18,
  },

  productImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
    marginRight: 14,
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888888",
  },

  itemContent: {
    flex: 1,
  },

  brand: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 3,
  },

  productName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },

  itemDetail: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 3,
  },

  itemBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },

  quantityText: {
    width: 35,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.35,
  },

  removeText: {
    fontSize: 11,
    color: "#777777",
    fontWeight: "600",
  },

  summary: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 14,
    color: "#666666",
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 14,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "800",
  },

  checkoutButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
