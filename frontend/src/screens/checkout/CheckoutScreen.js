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

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getCart } from "../../api/cart";

import { getAddresses } from "../../api/addresses";

import { createOrder } from "../../api/orders";

import { useFocusEffect } from "@react-navigation/native";

const PAYMENT_METHODS = [
  {
    value: "COD",
    label: "Cash on Delivery",
    icon: "cash-outline",
  },
  {
    value: "E_WALLET",
    label: "E-Wallet",
    icon: "wallet-outline",
  },
  {
    value: "CARD",
    label: "Card",
    icon: "card-outline",
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

  const BackButton = () =>
    navigation.canGoBack() ? (
      <Pressable style={s.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color="#183B2B" />
      </Pressable>
    ) : null;

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#315B4A" />
          <Text style={s.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>

          <Pressable style={s.button} onPress={loadCheckout}>
            <Text style={s.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!cart?.items?.length) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={s.title}>Your cart is empty</Text>

          <Pressable
            style={s.button}
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: "Shop",
              })
            }
          >
            <Text style={s.buttonText}>Shop Eyewear</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadCheckout();
            }}
            tintColor="#315B4A"
          />
        }
      >
        <BackButton />

        <Text style={s.overline}>SECURE CHECKOUT</Text>
        <Text style={s.title}>Almost yours.</Text>

        {/* ADDRESS */}

        <View style={s.sectionHeader}>
          <Text style={s.section}>SHIPPING ADDRESS</Text>

          <Pressable onPress={() => navigation.navigate("AddAddress")}>
            <Text style={s.link}>+ Add</Text>
          </Pressable>
        </View>

        {addresses.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyCardTitle}>No address saved</Text>

            <Text style={s.emptyCardText}>
              Add a shipping address to continue.
            </Text>

            <Pressable
              style={s.button}
              onPress={() => navigation.navigate("AddAddress")}
            >
              <Text style={s.buttonText}>Add Address</Text>
            </Pressable>
          </View>
        ) : (
          addresses.map((address) => {
            const selected = selectedAddressId === address._id;

            return (
              <Pressable
                key={address._id}
                style={[s.addressCard, selected && s.addressSelected]}
                onPress={() => setSelectedAddressId(address._id)}
              >
                <View style={s.addressTop}>
                  <Text style={s.addressName}>
                    {address.firstName} {address.lastName}
                  </Text>

                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color="#315B4A"
                    />
                  ) : null}
                </View>

                {address.isDefault ? (
                  <Text style={s.defaultBadge}>Default</Text>
                ) : null}

                <Text style={s.addressText}>{address.street}</Text>

                {address.apartment ? (
                  <Text style={s.addressText}>{address.apartment}</Text>
                ) : null}

                <Text style={s.addressText}>
                  {address.city}, {address.province} {address.postalCode}
                </Text>

                <Text style={s.addressText}>{address.country}</Text>

                <Text style={s.addressPhone}>{address.phone}</Text>
              </Pressable>
            );
          })
        )}

        {/* PAYMENT */}

        <Text style={[s.section, s.spacedSection]}>PAYMENT</Text>

        {PAYMENT_METHODS.map((method) => {
          const selected = paymentMethod === method.value;

          return (
            <Pressable
              key={method.value}
              style={[s.payment, selected && s.paymentSelected]}
              onPress={() => setPaymentMethod(method.value)}
            >
              <Ionicons name={method.icon} size={21} color="#315B4A" />

              <Text style={s.paymentText}>{method.label}</Text>

              {selected ? (
                <Ionicons name="checkmark-circle" size={19} color="#315B4A" />
              ) : null}
            </Pressable>
          );
        })}

        {/* ORDER SUMMARY */}

        <Text style={[s.section, s.spacedSection]}>ORDER SUMMARY</Text>

        <View style={s.summary}>
          {cart.items.map((item, index) => {
            const productId = item?.productId?._id || item?.productId;

            const itemKey = item?._id || productId || `checkout-item-${index}`;

            return (
              <View key={itemKey} style={s.summaryRow}>
                <View style={s.itemInfo}>
                  <Text style={s.summaryText}>
                    {item?.productId?.name || "Product"} ×{" "}
                    {Number(item?.quantity || 0)}
                  </Text>

                  <Text style={s.itemDetails}>
                    {formatValue(item?.lensType)} lenses ·{" "}
                    {formatValue(item?.coating)}
                  </Text>
                </View>

                <Text style={s.summaryPrice}>
                  ₱
                  {(
                    Number(item?.unitPrice || 0) * Number(item?.quantity || 0)
                  ).toLocaleString()}
                </Text>
              </View>
            );
          })}

          <View style={[s.summaryRow, s.summaryDivider]}>
            <Text style={s.summaryText}>Subtotal</Text>

            <Text style={s.summaryPrice}>₱{subtotal.toLocaleString()}</Text>
          </View>

          <View style={s.summaryRow}>
            <Text style={s.summaryText}>Shipping</Text>

            <Text style={s.summaryPrice}>
              ₱{shippingFee.toLocaleString()}
            </Text>
          </View>

          <View style={[s.summaryRow, s.summaryDivider]}>
            <Text style={s.summaryTotalText}>Total</Text>

            <Text style={s.summaryTotalPrice}>₱{total.toLocaleString()}</Text>
          </View>
        </View>

        <Pressable
          style={[s.button, placingOrder && s.disabled]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={s.buttonText}>
                Place order · ₱{total.toLocaleString()}
              </Text>

              <Ionicons name="lock-closed" size={16} color="#fff" />
            </>
          )}
        </Pressable>

        <Text style={s.terms}>
          Please review your prescription, shipping address, and order
          details before placing your order.
        </Text>
      </ScrollView>
    </SafeAreaView>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F6F1" },

  content: { padding: 22, paddingBottom: 35 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: { marginTop: 10, color: "#526259" },

  errorText: { textAlign: "center", color: "#183B2B", marginBottom: 18 },

  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  overline: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#779081",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#183B2B",
    marginTop: 6,
    marginBottom: 30,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  section: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#526259",
  },

  spacedSection: { marginTop: 26, marginBottom: 12 },

  link: { fontSize: 13, fontWeight: "700", color: "#315B4A" },

  addressCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D7DBD8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },

  addressSelected: {
    borderColor: "#315B4A",
    backgroundColor: "#E2F0E5",
  },

  addressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  addressName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#183B2B",
    marginBottom: 6,
  },

  defaultBadge: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: "#315B4A",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },

  addressText: { fontSize: 12, color: "#555555", marginBottom: 2 },

  addressPhone: { fontSize: 12, color: "#555555", marginTop: 5 },

  emptyCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D7DBD8",
    borderRadius: 12,
    padding: 18,
  },

  emptyCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#183B2B",
    marginBottom: 5,
  },

  emptyCardText: { color: "#666666", fontSize: 12, marginBottom: 14 },

  payment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D7DBD8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
  },

  paymentSelected: {
    borderColor: "#315B4A",
    backgroundColor: "#E2F0E5",
  },

  paymentText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#183B2B" },

  summary: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 10,
    marginTop: 2,
  },

  itemInfo: { flex: 1, marginRight: 10 },

  summaryText: { fontSize: 13, color: "#333333", fontWeight: "600" },

  itemDetails: { fontSize: 11, color: "#888888", marginTop: 3 },

  summaryPrice: { fontSize: 13, color: "#333333" },

  summaryTotalText: { fontSize: 15, fontWeight: "800", color: "#183B2B" },

  summaryTotalPrice: { fontSize: 15, fontWeight: "800", color: "#183B2B" },

  button: {
    height: 55,
    borderRadius: 14,
    backgroundColor: "#315B4A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
  },

  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  disabled: { opacity: 0.6 },

  terms: {
    fontSize: 11,
    color: "#888888",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },
});
