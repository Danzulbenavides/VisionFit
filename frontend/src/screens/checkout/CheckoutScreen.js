import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getCart } from "../../api/cart";

import { getAddresses } from "../../api/addresses";

import { createOrder } from "../../api/orders";

import { useFocusEffect } from "@react-navigation/native";

const PAYMENT_METHODS = [
  {
    value: "COD",
    label: "Cash on Delivery",
  },
  {
    value: "E_WALLET",
    label: "E-Wallet",
  },
  {
    value: "CARD",
    label: "Card",
  },
];

export default function CheckoutScreen({ navigation }) {
  const [cart, setCart] = useState(null);

  const [addresses, setAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [loading, setLoading] = useState(true);

  const [placingOrder, setPlacingOrder] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    if (!Array.isArray(cart?.items)) {
      return 0;
    }

    return cart.items.reduce((sum, item) => {
      const unitPrice = Number(item?.unitPrice || 0);
      const quantity = Number(item?.quantity || 0);

      return sum + unitPrice * quantity;
    }, 0);
  }, [cart?.items]);

  const shippingFee = 60;

  const total = subtotal + shippingFee;

  const loadCheckout = async () => {
    try {
      setLoading(true);
      setError("");

      const [cartResult, addressResult] = await Promise.all([
        getCart(),
        getAddresses(),
      ]);

      if (cartResult.error) {
        setError(cartResult.error.message);

        return;
      }

      if (addressResult.error) {
        setError(addressResult.error.message);

        return;
      }

      setCart(cartResult.data);

      const userAddresses = addressResult.data || [];

      setAddresses(userAddresses);

      const defaultAddress = userAddresses.find((address) => address.isDefault);

      setSelectedAddressId(
        (current) =>
          current || defaultAddress?._id || userAddresses[0]?._id || null,
      );
    } catch (err) {
      console.error("Load checkout error:", err);

      setError(
        err.response?.data?.error?.message || "Unable to load checkout.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCheckout();
    }, []),
  );

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert("Address Required", "Please select a shipping address.");

      return;
    }

    if (!cart?.items?.length) {
      Alert.alert("Cart Empty", "Your cart has no items.");

      return;
    }

    try {
      setPlacingOrder(true);

      const result = await createOrder({
        addressId: selectedAddressId,
        paymentMethod,
      });

      if (result.error) {
        Alert.alert("Unable to Place Order", result.error.message);

        return;
      }

      navigation.replace("OrderSuccess", {
        order: result.data,
      });
    } catch (err) {
      console.log("CREATE ORDER STATUS:", err.response?.status);

      console.log(
        "CREATE ORDER RESPONSE:",
        JSON.stringify(err.response?.data, null, 2),
      );

      console.log(
        "CREATE ORDER REQUEST:",
        JSON.stringify(err.config?.data, null, 2),
      );

      Alert.alert(
        "Unable to Place Order",
        err.response?.data?.error?.message || "The server rejected the order.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadCheckout}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!cart?.items?.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>

        <Pressable
          style={styles.retryButton}
          onPress={() =>
            navigation.navigate("MainTabs", {
              screen: "Shop",
            })
          }
        >
          <Text style={styles.retryText}>Shop Eyewear</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadCheckout();
          }}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Checkout</Text>

      {/* ADDRESS */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>

        <Pressable onPress={() => navigation.navigate("AddAddress")}>
          <Text style={styles.link}>+ Add</Text>
        </Pressable>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardTitle}>No address saved</Text>

          <Text style={styles.emptyCardText}>
            Add a shipping address to continue.
          </Text>

          <Pressable
            style={styles.darkButton}
            onPress={() => navigation.navigate("AddAddress")}
          >
            <Text style={styles.darkButtonText}>Add Address</Text>
          </Pressable>
        </View>
      ) : (
        addresses.map((address) => {
          const selected = selectedAddressId === address._id;

          return (
            <Pressable
              key={address._id}
              style={[styles.addressCard, selected && styles.addressSelected]}
              onPress={() => setSelectedAddressId(address._id)}
            >
              <View style={styles.addressTop}>
                <Text style={styles.addressName}>
                  {address.firstName} {address.lastName}
                </Text>

                {selected ? <Text style={styles.selectedCheck}>✓</Text> : null}
              </View>

              {address.isDefault ? (
                <Text style={styles.defaultBadge}>Default</Text>
              ) : null}

              <Text style={styles.addressText}>{address.street}</Text>

              {address.apartment ? (
                <Text style={styles.addressText}>{address.apartment}</Text>
              ) : null}

              <Text style={styles.addressText}>
                {address.city}, {address.province} {address.postalCode}
              </Text>

              <Text style={styles.addressText}>{address.country}</Text>

              <Text style={styles.addressPhone}>{address.phone}</Text>
            </Pressable>
          );
        })
      )}

      {/* ITEMS */}

      <Text style={[styles.sectionTitle, styles.spacedTitle]}>
        Order Summary
      </Text>

      {cart.items.map((item, index) => {
        const productId = item?.productId?._id || item?.productId;

        const itemKey = item?._id || productId || `checkout-item-${index}`;

        return (
          <View key={itemKey} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item?.productId?.name || "Product"}
              </Text>

              <Text style={styles.itemDetails}>
                Qty: {Number(item?.quantity || 0)} ·{" "}
                {formatValue(item?.lensType)}
              </Text>

              <Text style={styles.itemDetails}>
                Coating: {formatValue(item?.coating)}
              </Text>
            </View>

            <Text style={styles.itemPrice}>
              ₱
              {(
                Number(item?.unitPrice || 0) * Number(item?.quantity || 0)
              ).toLocaleString()}
            </Text>
          </View>
        );
      })}
      {/* PAYMENT */}

      <Text style={[styles.sectionTitle, styles.spacedTitle]}>
        Payment Method
      </Text>

      {PAYMENT_METHODS.map((method) => {
        const selected = paymentMethod === method.value;

        return (
          <Pressable
            key={method.value}
            style={[styles.paymentOption, selected && styles.paymentSelected]}
            onPress={() => setPaymentMethod(method.value)}
          >
            <Text style={styles.paymentText}>{method.label}</Text>

            {selected ? <Text style={styles.selectedCheck}>✓</Text> : null}
          </Pressable>
        );
      })}

      {/* TOTAL */}

      <View style={styles.totalCard}>
        <SummaryRow label="Subtotal" value={subtotal} />

        <SummaryRow label="Shipping" value={shippingFee} />

        <View style={styles.divider} />

        <SummaryRow label="Total" value={total} bold />
      </View>

      <Pressable
        style={[styles.placeOrderButton, placingOrder && styles.disabled]}
        onPress={handlePlaceOrder}
        disabled={placingOrder}
      >
        {placingOrder ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.placeOrderText}>Place Order</Text>
        )}
      </Pressable>

      <Text style={styles.disclaimer}>
        Please review your prescription, shipping address, and order details
        before placing your order.
      </Text>
    </ScrollView>
  );
}

function SummaryRow({ label, value, bold = false }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>
        {label}
      </Text>

      <Text style={[styles.summaryValue, bold && styles.summaryBold]}>
        ₱{Number(value || 0).toLocaleString()}
      </Text>
    </View>
  );
}

function formatValue(value) {
  if (!value) {
    return "None";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  spacedTitle: {
    marginTop: 26,
    marginBottom: 12,
  },

  link: {
    fontSize: 13,
    fontWeight: "700",
  },

  addressCard: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  addressSelected: {
    borderColor: "#111111",
    backgroundColor: "#F7F7F7",
  },

  addressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  addressName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },

  selectedCheck: {
    fontSize: 18,
    fontWeight: "800",
  },

  defaultBadge: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: "#111111",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },

  addressText: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 2,
  },

  addressPhone: {
    fontSize: 12,
    color: "#555555",
    marginTop: 5,
  },

  emptyCard: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    padding: 18,
  },

  emptyCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  emptyCardText: {
    color: "#666666",
    fontSize: 12,
    marginBottom: 14,
  },

  darkButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  darkButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingVertical: 13,
  },

  itemInfo: {
    flex: 1,
    marginRight: 10,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  itemDetails: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 2,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
  },

  paymentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    marginBottom: 9,
  },

  paymentSelected: {
    borderColor: "#111111",
    backgroundColor: "#F7F7F7",
  },

  paymentText: {
    fontSize: 14,
    fontWeight: "600",
  },

  totalCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 15,
    padding: 18,
    marginTop: 20,
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#666666",
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  summaryBold: {
    fontSize: 17,
    color: "#111111",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 8,
  },

  placeOrderButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  placeOrderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  disclaimer: {
    textAlign: "center",
    color: "#777777",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 14,
  },

  retryButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 18,
  },

  disabled: {
    opacity: 0.5,
  },
});
