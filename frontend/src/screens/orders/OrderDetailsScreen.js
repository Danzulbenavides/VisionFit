import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getOrderById } from "../../api/orders";

const STEPS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderDetailsScreen({ route }) {
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getOrderById(orderId);

        if (result.error) {
          setError(result.error.message);
          return;
        }

        setOrder(result.data);
      } catch (err) {
        console.error("Load order details error:", err);

        setError(err.response?.data?.error?.message || "Unable to load order.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Order not found."}</Text>
      </View>
    );
  }

  const cancelled = order.orderStatus === "CANCELLED";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Order Details</Text>

      <View style={styles.headerCard}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>

        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {formatValue(order.orderStatus)}
          </Text>
        </View>
      </View>

      {!cancelled ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>

          {STEPS.map((step, index) => {
            const currentIndex = STEPS.indexOf(order.orderStatus);

            const complete = currentIndex >= index;

            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[styles.stepCircle, complete && styles.stepComplete]}
                >
                  <Text style={styles.stepNumber}>
                    {complete ? "✓" : index + 1}
                  </Text>
                </View>

                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      complete && styles.stepTitleComplete,
                    ]}
                  >
                    {formatValue(step)}
                  </Text>

                  {index < STEPS.length - 1 ? (
                    <View
                      style={[
                        styles.stepLine,
                        complete && styles.stepLineComplete,
                      ]}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.cancelledCard}>
          <Text style={styles.cancelledTitle}>Order Cancelled</Text>

          <Text style={styles.cancelledText}>
            This order has been cancelled.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>

        {order.items.map((item, index) => (
          <View
            key={item._id || `${item.productId}-${index}`}
            style={styles.itemCard}
          >
            <Text style={styles.productName}>{item.productName}</Text>

            <Text style={styles.itemDetail}>Quantity: {item.quantity}</Text>

            <Text style={styles.itemDetail}>
              Lens: {formatValue(item.lensType)}
            </Text>

            <Text style={styles.itemDetail}>
              Coating: {formatValue(item.coating)}
            </Text>

            {item.prescriptionId ? (
              <Text style={styles.prescriptionText}>Prescription attached</Text>
            ) : (
              <Text style={styles.itemDetail}>No prescription</Text>
            )}

            <View style={styles.itemPriceRow}>
              <Text style={styles.itemUnitPrice}>
                ₱{Number(item.unitPrice).toLocaleString()} each
              </Text>

              <Text style={styles.itemTotal}>
                ₱{(Number(item.unitPrice) * item.quantity).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>

        <View style={styles.addressCard}>
          <Text style={styles.addressName}>
            {order.addressSnapshot.firstName} {order.addressSnapshot.lastName}
          </Text>

          <Text style={styles.addressText}>{order.addressSnapshot.street}</Text>

          {order.addressSnapshot.apartment ? (
            <Text style={styles.addressText}>
              {order.addressSnapshot.apartment}
            </Text>
          ) : null}

          <Text style={styles.addressText}>
            {order.addressSnapshot.city}, {order.addressSnapshot.province}{" "}
            {order.addressSnapshot.postalCode}
          </Text>

          <Text style={styles.addressText}>
            {order.addressSnapshot.country}
          </Text>

          <Text style={styles.addressPhone}>{order.addressSnapshot.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>

        <View style={styles.summaryCard}>
          <SummaryRow
            label="Payment Method"
            value={formatValue(order.paymentMethod)}
          />

          <SummaryRow
            label="Payment Status"
            value={formatValue(order.paymentStatus)}
          />
        </View>
      </View>

      <View style={styles.totalCard}>
        <SummaryRow label="Subtotal" value={order.subtotal} />

        <SummaryRow label="Shipping" value={order.shippingFee} />

        <SummaryRow label="Discount" value={order.discount} />

        <View style={styles.divider} />

        <SummaryRow label="Total" value={order.total} bold />
      </View>
    </ScrollView>
  );
}

function SummaryRow({ label, value, bold = false }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>
        {label}
      </Text>

      {typeof value === "number" ? (
        <Text style={[styles.summaryValue, bold && styles.summaryBold]}>
          ₱{Number(value).toLocaleString()}
        </Text>
      ) : (
        <Text style={[styles.summaryValue, bold && styles.summaryBold]}>
          {value}
        </Text>
      )}
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
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 18,
  },

  headerCard: {
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 16,
    padding: 17,
  },

  orderNumber: {
    fontSize: 17,
    fontWeight: "800",
  },

  date: {
    fontSize: 11,
    color: "#888888",
    marginTop: 4,
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  section: {
    marginTop: 22,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 11,
  },

  stepRow: {
    flexDirection: "row",
    minHeight: 58,
  },

  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },

  stepComplete: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },

  stepNumber: {
    fontSize: 11,
    fontWeight: "800",
  },

  stepContent: {
    flex: 1,
    marginLeft: 12,
  },

  stepTitle: {
    fontSize: 13,
    color: "#888888",
    paddingTop: 6,
  },

  stepTitleComplete: {
    color: "#111111",
    fontWeight: "700",
  },

  stepLine: {
    position: "absolute",
    width: 1,
    height: 28,
    left: -27,
    top: 30,
    backgroundColor: "#DDDDDD",
  },

  stepLineComplete: {
    backgroundColor: "#111111",
  },

  cancelledCard: {
    marginTop: 22,
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 16,
  },

  cancelledTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },

  cancelledText: {
    fontSize: 12,
    color: "#666666",
  },

  itemCard: {
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  productName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },

  itemDetail: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 3,
  },

  prescriptionText: {
    fontSize: 11,
    color: "#111111",
    fontWeight: "600",
    marginTop: 3,
  },

  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  itemUnitPrice: {
    fontSize: 11,
    color: "#777777",
  },

  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
  },

  addressCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 16,
  },

  addressName: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
  },

  addressText: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 3,
  },

  addressPhone: {
    fontSize: 12,
    color: "#555555",
    marginTop: 5,
  },

  summaryCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 16,
  },

  totalCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 18,
    marginTop: 22,
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
    textAlign: "right",
  },

  summaryBold: {
    fontSize: 17,
    color: "#111111",
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 8,
  },
});
