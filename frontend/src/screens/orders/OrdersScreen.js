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

import { getOrders } from "../../api/orders";

import { useFocusEffect } from "@react-navigation/native";

export default function OrdersScreen({ navigation, route }) {
  const statusFilter = route?.params?.statusFilter || null;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const result = await getOrders();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setOrders(result.data || []);
    } catch (err) {
      console.error("Load orders error:", err);

      setError(
        err.response?.data?.error?.message || "Unable to load your orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [statusFilter]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadOrders({
      showLoader: false,
    });
  };

  const visibleOrders = orders.filter((order) => {
    switch (statusFilter) {
      case "UNPAID":
        return (
          order.paymentStatus !== "PAID" && order.orderStatus !== "CANCELLED"
        );
      case "PROCESSING":
        return order.orderStatus === "PROCESSING";
      case "SHIPPED":
        return order.orderStatus === "SHIPPED";
      case "DELIVERY":
        return ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
          order.orderStatus,
        );
      default:
        return true;
    }
  });

  const filterLabel =
    {
      UNPAID: "Unpaid",
      PROCESSING: "Processing",
      SHIPPED: "Shipped",
      DELIVERY: "Delivery",
    }[statusFilter] || "All Orders";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.button} onPress={() => loadOrders()}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.emptyTitle}>No orders yet</Text>

        <Text style={styles.emptyText}>
          Your completed purchases will appear here.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            navigation.navigate("MainTabs", {
              screen: "Shop",
            })
          }
        >
          <Text style={styles.buttonText}>Shop Now</Text>
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
      <Text style={styles.title}>My Orders</Text>

      <Text style={styles.subtitle}>
        {statusFilter
          ? `Showing ${filterLabel.toLowerCase()} orders.`
          : "Track your VisionFit purchases."}
      </Text>

      {statusFilter ? (
        <Pressable
          style={styles.clearFilter}
          onPress={() => navigation.setParams({ statusFilter: undefined })}
        >
          <Text style={styles.clearFilterText}>View all orders</Text>
        </Pressable>
      ) : null}

      {visibleOrders.length === 0 ? (
        <View style={styles.filteredEmpty}>
          <Text style={styles.emptyTitle}>
            No {filterLabel.toLowerCase()} orders
          </Text>
          <Text style={styles.emptyText}>
            Orders in this category will appear here.
          </Text>
        </View>
      ) : (
        visibleOrders.map((order) => (
          <Pressable
            key={order._id}
            style={[
              styles.card,
              order.orderStatus === "CANCELLED" && styles.cardCancelled,
            ]}
            onPress={() =>
              navigation.navigate("OrderDetails", {
                orderId: order._id,
              })
            }
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>

                <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
              </View>

              <StatusBadge status={order.orderStatus} />
            </View>

            <Text style={styles.itemCount}>
              {order.items?.length || 0}{" "}
              {order.items?.length === 1 ? "item" : "items"}
            </Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>

              <Text style={styles.totalValue}>
                ₱{Number(order.total || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.payment}>
                {formatValue(order.paymentMethod)}
              </Text>

              <Text style={styles.viewText}>View Details →</Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function StatusBadge({ status }) {
  return (
    <View style={styles.statusBadge}>
      <Text style={styles.statusText}>{formatValue(status)}</Text>
    </View>
  );
}

function formatValue(value) {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#666666",
    marginBottom: 22,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
    marginBottom: 22,
  },

  card: {
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 16,
    padding: 17,
    marginBottom: 13,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderNumber: {
    fontSize: 15,
    fontWeight: "800",
  },

  date: {
    fontSize: 11,
    color: "#888888",
    marginTop: 4,
  },

  statusBadge: {
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "#F0F0F0",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  itemCount: {
    fontSize: 12,
    color: "#666666",
    marginTop: 16,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 9,
  },

  totalLabel: {
    fontSize: 13,
    color: "#666666",
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "800",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  payment: {
    fontSize: 11,
    color: "#777777",
  },

  viewText: {
    fontSize: 11,
    fontWeight: "700",
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

  cardCancelled: {
    backgroundColor: "#FDF2F2",
    borderColor: "#F3B4B4",
  },

  clearFilter: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#EEEEEE",
    marginBottom: 14,
  },
  clearFilterText: { fontSize: 12, fontWeight: "700", color: "#222222" },
  filteredEmpty: { paddingVertical: 36, alignItems: "center" },
});
