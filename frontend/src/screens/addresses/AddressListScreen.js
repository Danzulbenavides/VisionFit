import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getAddresses, deleteAddress } from "../../api/addresses";
import { useFocusEffect } from "@react-navigation/native";

export default function AddressListScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAddresses = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const result = await getAddresses();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setAddresses(result.data || []);
    } catch (err) {
      console.error("Load addresses error:", err);

      setError(
        err.response?.data?.error?.message || "Unable to load your addresses.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadAddresses({
      showLoader: false,
    });
  };

  const handleDelete = (address) => {
    Alert.alert(
      "Delete Address",
      `Remove "${address.street || "this address"}" from your saved addresses?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteAddress(address._id);

              if (result.error) {
                Alert.alert("Unable to Delete", result.error.message);
                return;
              }

              setAddresses((current) =>
                current.filter((item) => item._id !== address._id),
              );
            } catch (err) {
              console.error("Delete address error:", err);

              Alert.alert(
                "Unable to Delete",
                err.response?.data?.error?.message ||
                  "Unable to delete address.",
              );
            }
          },
        },
      ],
    );
  };

  const formatAddress = (address) => {
    const parts = [
      address.street,
      address.apartment,
      address.barangay,
      address.city,
      address.province,
    ].filter(Boolean);

    return parts.join(", ");
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#111111" />
          <Text style={s.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>

          <Pressable style={s.button} onPress={() => loadAddresses()}>
            <Text style={s.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {addresses.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="location-outline" size={80} color="#DDD" />

            <Text style={s.emptyTitle}>No saved addresses</Text>

            <Text style={s.emptyText}>
              Add a shipping address to use it at checkout.
            </Text>

            <Pressable
              style={s.button}
              onPress={() => navigation.navigate("AddAddress")}
            >
              <Text style={s.buttonText}>Add Address</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {addresses.map((address) => (
              <TouchableOpacity
                key={address._id}
                style={[s.card, address.isDefault && s.cardDefault]}
              >
                <View style={s.cardContent}>
                  <View style={s.nameRow}>
                    <Text style={s.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                      {address.firstName} {address.lastName}
                    </Text>
                    {address.isDefault ? (
                      <Text style={s.defaultBadge}>Default</Text>
                    ) : null}
                  </View>

                  <Text style={s.cardSubtitle} numberOfLines={2} ellipsizeMode="tail">
                    {formatAddress(address)}
                  </Text>

                  <Text style={s.cardPhone}>{address.phone}</Text>
                </View>

                <Pressable
                  style={s.deleteBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(address);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#E53935" />
                </Pressable>
              </TouchableOpacity>
            ))}

            <Pressable
              style={s.addButton}
              onPress={() => navigation.navigate("AddAddress")}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={s.addButtonText}>Add new address</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },

  content: { padding: 16, paddingBottom: 28, flexGrow: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: { marginTop: 10, color: "#666666" },

  errorText: { textAlign: "center", marginBottom: 18 },

  button: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 11,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: { color: "#FFFFFF", fontWeight: "700" },

  empty: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 36,
    paddingTop: 60,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
    marginTop: 16,
  },

  emptyText: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 24,
  },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  cardDefault: { borderColor: "#B45A3C" },

  cardContent: { flex: 1, minWidth: 0 },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 6,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
    minWidth: 0,
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },

  defaultBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45A3C",
    flexShrink: 0,
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#555555",
    marginBottom: 4,
    flex: 1,
  },

  cardPhone: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 8,
    flex: 1,
  },

  deleteBtn: {
    padding: 8,
    flexShrink: 0,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 11,
    backgroundColor: "#111111",
    marginTop: 4,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
