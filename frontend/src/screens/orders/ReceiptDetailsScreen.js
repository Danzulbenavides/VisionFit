import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getOrderById } from "../../api/orders";

export default function ReceiptDetailsScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params || {};
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      if (!initialOrder) setError("The order information is not available.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const result = await getOrderById(orderId);
      if (result.error) {
        setError(result.error.message || "Unable to load this receipt.");
        return;
      }
      setOrder(result.data);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message || "Unable to load this receipt.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, initialOrder]);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [loadOrder, orderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={styles.muted}>Loading receipt...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Receipt not found."}</Text>
        <Pressable
          style={styles.button}
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate("Receipts")
          }
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const address = order.addressSnapshot || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.receipt}>
        <Text style={styles.brand}>VisionFit</Text>
        <Text style={styles.heading}>Order Receipt</Text>
        <Text style={styles.note}>
          Confirmation of your order. Payment status is listed below.
        </Text>

        <View style={styles.divider} />
        <InfoRow
          label="Order Number"
          value={order.orderNumber || order._id || "—"}
        />
        <InfoRow label="Order Date" value={formatDate(order.createdAt)} />
        <InfoRow label="Order Status" value={formatValue(order.orderStatus)} />
        <InfoRow
          label="Payment Method"
          value={formatValue(order.paymentMethod)}
        />
        <InfoRow
          label="Payment Status"
          value={formatValue(order.paymentStatus)}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Items</Text>
        {(order.items || []).map((item, index) => (
          <View
            key={item._id || `${item.productId || item.productName}-${index}`}
            style={styles.item}
          >
            <View style={styles.flex}>
              <Text style={styles.itemName}>
                {item.productName || item.name || "Eyewear item"}
              </Text>
              <Text style={styles.itemSub}>
                Qty {item.quantity || 1} ·{" "}
                {formatValue(item.lensType || "Frame only")}
              </Text>
              {item.coating ? (
                <Text style={styles.itemSub}>
                  {formatValue(item.coating)} coating
                </Text>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>
              ₱
              {(
                Number(item.unitPrice || item.price || 0) *
                Number(item.quantity || 1)
              ).toLocaleString("en-PH")}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />
        <InfoRow label="Subtotal" value={currency(order.subtotal)} />
        <InfoRow label="Shipping" value={currency(order.shippingFee)} />
        <InfoRow label="Discount" value={currency(order.discount)} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{currency(order.total)}</Text>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.address}>
          {`${address.firstName || ""} ${address.lastName || ""}`.trim() || "—"}
        </Text>
        {address.street ? (
          <Text style={styles.address}>{address.street}</Text>
        ) : null}
        {address.apartment ? (
          <Text style={styles.address}>{address.apartment}</Text>
        ) : null}
        <Text style={styles.address}>
          {[address.city, address.province, address.postalCode]
            .filter(Boolean)
            .join(", ")}
        </Text>
        {address.country ? (
          <Text style={styles.address}>{address.country}</Text>
        ) : null}
        {address.phone ? (
          <Text style={styles.address}>{address.phone}</Text>
        ) : null}
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          navigation.navigate("OrderDetails", { orderId: order._id || orderId })
        }
      >
        <Text style={styles.buttonText}>View Order Details</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>
        {value === undefined || value === null || value === ""
          ? "—"
          : String(value)}
      </Text>
    </View>
  );
}

function currency(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH")}`;
}

function formatValue(value) {
  return String(value || "—")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 36, backgroundColor: "#F5F5F5" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  receipt: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E4E4E4",
  },
  brand: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#315B4A",
    textAlign: "center",
  },
  heading: {
    marginTop: 7,
    fontSize: 25,
    fontWeight: "900",
    color: "#111111",
    textAlign: "center",
  },
  note: {
    marginTop: 5,
    marginBottom: 10,
    color: "#777777",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
  },
  divider: { height: 1, backgroundColor: "#E8E8E8", marginVertical: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 5,
  },
  infoLabel: { fontSize: 12, color: "#777777", flex: 1 },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#222222",
    flex: 1,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
  },
  flex: { flex: 1 },
  itemName: { fontSize: 12, fontWeight: "800", color: "#222222" },
  itemSub: { fontSize: 10, color: "#777777", marginTop: 3 },
  itemPrice: { fontSize: 12, fontWeight: "800", color: "#111111" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: "900", color: "#111111" },
  totalValue: { fontSize: 19, fontWeight: "900", color: "#111111" },
  address: { fontSize: 12, color: "#555555", lineHeight: 18 },
  muted: { marginTop: 10, color: "#777777" },
  error: { textAlign: "center", color: "#B42318", marginBottom: 14 },
  button: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800" },
});
