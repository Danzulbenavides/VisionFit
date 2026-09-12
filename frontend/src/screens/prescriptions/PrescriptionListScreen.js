import React, { useCallback, useState } from "react";

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

import { deletePrescription, getPrescriptions } from "../../api/prescriptions";

import { useFocusEffect } from "@react-navigation/native";

export default function PrescriptionListScreen({ navigation }) {
  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getPrescriptions();

      if (result.error) {
        setError(result.error.message);

        return;
      }

      setPrescriptions(result.data || []);
    } catch (err) {
      console.error("Load prescriptions error:", err);

      setError(
        err.response?.data?.error?.message || "Unable to load prescriptions.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPrescriptions();
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadPrescriptions();
  };

  const handleDelete = (prescription) => {
    Alert.alert("Delete Prescription", `Delete "${prescription.name}"?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await deletePrescription(prescription._id);

            if (result.error) {
              Alert.alert("Unable to Delete", result.error.message);

              return;
            }

            await loadPrescriptions();
          } catch (err) {
            console.error("Delete prescription error:", err);

            Alert.alert(
              "Unable to Delete",
              err.response?.data?.error?.message ||
                "Unable to delete prescription.",
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading prescriptions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.button} onPress={loadPrescriptions}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
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
          <Text style={styles.title}>My Prescriptions</Text>

          <Text style={styles.subtitle}>
            Manage your saved eye prescriptions.
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AddPrescription")}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      {prescriptions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No prescriptions yet</Text>

          <Text style={styles.emptyText}>
            Add your prescription to make lens customization easier.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate("AddPrescription")}
          >
            <Text style={styles.primaryButtonText}>Add Prescription</Text>
          </Pressable>
        </View>
      ) : (
        prescriptions.map((prescription) => (
          <View key={prescription._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{prescription.name}</Text>

                <Text style={styles.type}>
                  {formatValue(prescription.prescriptionType)}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  navigation.navigate("EditPrescription", {
                    prescriptionId: prescription._id,
                  })
                }
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.prescriptionSection}>
              <Text style={styles.sectionTitle}>OD</Text>

              <Text style={styles.sectionSubtitle}>Right Eye</Text>

              <View style={styles.valuesRow}>
                <Value label="SPH" value={prescription.OD?.sph} />

                <Value label="CYL" value={prescription.OD?.cyl} />

                <Value label="AXIS" value={prescription.OD?.axis} />

                <Value label="ADD" value={prescription.OD?.add} />
              </View>
            </View>

            <View style={styles.prescriptionSection}>
              <Text style={styles.sectionTitle}>OS</Text>

              <Text style={styles.sectionSubtitle}>Left Eye</Text>

              <View style={styles.valuesRow}>
                <Value label="SPH" value={prescription.OS?.sph} />

                <Value label="CYL" value={prescription.OS?.cyl} />

                <Value label="AXIS" value={prescription.OS?.axis} />

                <Value label="ADD" value={prescription.OS?.add} />
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View>
                <Text style={styles.pdLabel}>Pupillary Distance</Text>

                <Text style={styles.pdValue}>
                  {prescription.pd}
                  mm
                </Text>
              </View>

              <Pressable onPress={() => handleDelete(prescription)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Value({ label, value }) {
  return (
    <View style={styles.value}>
      <Text style={styles.valueLabel}>{label}</Text>

      <Text style={styles.valueText}>{value ?? "—"}</Text>
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
    marginTop: 12,
    color: "#666666",
  },

  errorText: {
    textAlign: "center",
    marginBottom: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
    maxWidth: 230,
  },

  addButton: {
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  empty: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#666666",
    lineHeight: 20,
    marginBottom: 22,
  },

  primaryButton: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  button: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  card: {
    borderWidth: 1,
    borderColor: "#E4E4E4",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },

  type: {
    fontSize: 12,
    color: "#777777",
  },

  editText: {
    fontSize: 13,
    fontWeight: "700",
  },

  prescriptionSection: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#888888",
    marginTop: 2,
    marginBottom: 10,
  },

  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  value: {
    alignItems: "center",
  },

  valueLabel: {
    fontSize: 10,
    color: "#888888",
    marginBottom: 4,
  },

  valueText: {
    fontSize: 13,
    fontWeight: "700",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  pdLabel: {
    fontSize: 11,
    color: "#888888",
  },

  pdValue: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },

  deleteText: {
    fontSize: 12,
    color: "#777777",
    fontWeight: "600",
  },
});
