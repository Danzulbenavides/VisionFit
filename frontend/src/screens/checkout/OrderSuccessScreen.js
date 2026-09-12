import React from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

export default function OrderSuccessScreen({ route, navigation }) {
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✓</Text>

      <Text style={styles.title}>Order Placed!</Text>

      <Text style={styles.subtitle}>
        Thank you for shopping with VisionFit.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Order Number</Text>

        <Text style={styles.orderNumber}>{order.orderNumber}</Text>

        <Text style={styles.label}>Total</Text>

        <Text style={styles.total}>
          ₱{Number(order.total).toLocaleString()}
        </Text>

        <Text style={styles.label}>Payment</Text>

        <Text style={styles.value}>{formatValue(order.paymentMethod)}</Text>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => navigation.navigate("Orders")}
      >
        <Text style={styles.primaryButtonText}>View My Orders</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          navigation.navigate("MainTabs", {
            screen: "Home",
          })
        }
      >
        <Text style={styles.secondaryButtonText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

function formatValue(value) {
  return value
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111111",
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
    textAlignVertical: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 25,
  },

  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    padding: 20,
    marginBottom: 20,
  },

  label: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 4,
    marginTop: 8,
  },

  orderNumber: {
    fontSize: 16,
    fontWeight: "800",
  },

  total: {
    fontSize: 20,
    fontWeight: "800",
  },

  value: {
    fontSize: 14,
    fontWeight: "700",
  },

  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
