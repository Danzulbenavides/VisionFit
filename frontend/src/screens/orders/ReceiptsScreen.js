import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getOrders } from "../../api/orders";

export default function ReceiptsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReceipts = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) setLoading(true);
      setError("");
      const result = await getOrders();
      if (result.error) {
        setError(result.error.message || "Unable to load receipts.");
        return;
      }
      // These are order confirmation receipts, not proof of successful payment.
      // Payment status is shown on each receipt to avoid implying unpaid orders are paid.
      setOrders(
        (result.data || []).filter(
          (order) => order.orderStatus !== "CANCELLED",
        ),
      );
    } catch (err) {
      setError(
        err?.response?.data?.error?.message || "Unable to load receipts.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadReceipts({ showLoader: false });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={styles.muted}>Loading receipts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.button} onPress={() => loadReceipts()}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <Text style={styles.title}>Receipts</Text>
      <Text style={styles.subtitle}>
        View the confirmation details for your orders.
      </Text>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No receipts yet</Text>
          <Text style={styles.muted}>
            Your order receipts will appear here after you place an order.
          </Text>
        </View>
      ) : (
        orders.map((order) => (
          <Pressable
            key={order._id}
            style={styles.card}
            onPress={() =>
              navigation.navigate("ReceiptDetails", { orderId: order._id })
            }
          >
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.orderNumber}>
                  {order.orderNumber || "Order receipt"}
                </Text>
                <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
              </View>
              <Text style={styles.link}>View receipt ›</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.muted}>{formatValue(order.orderStatus)}</Text>
              <Text style={styles.total}>
                ₱{Number(order.total || 0).toLocaleString("en-PH")}
              </Text>
            </View>
            <Text style={styles.payment}>
              Payment: {formatValue(order.paymentStatus || "PENDING")}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function formatValue(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#111111" },
  subtitle: { fontSize: 13, color: "#777777", marginTop: 5, marginBottom: 20 },
  card: {
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  flex: { flex: 1 },
  orderNumber: { fontSize: 15, fontWeight: "800", color: "#111111" },
  date: { fontSize: 11, color: "#888888", marginTop: 4 },
  link: { fontSize: 11, fontWeight: "800", color: "#315B4A" },
  total: { fontSize: 16, fontWeight: "800", color: "#111111" },
  payment: { fontSize: 11, color: "#666666" },
  muted: { fontSize: 12, color: "#777777", textAlign: "center" },
  error: { color: "#B42318", textAlign: "center", marginBottom: 14 },
  empty: { alignItems: "center", paddingVertical: 44, gap: 8 },
  emptyTitle: { fontSize: 19, fontWeight: "800", color: "#111111" },
  button: {
    backgroundColor: "#111111",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
});
