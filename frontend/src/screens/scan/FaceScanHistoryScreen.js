import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import {
  deleteFaceMeasurement,
  getFaceMeasurements,
} from "../../api/faceMeasurements";

import { removeFaceScanConsent } from "../../utils/storage";

export default function FaceScanHistoryScreen() {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadMeasurements = async () => {
    try {
      setLoading(true);

      const response = await getFaceMeasurements();

      setMeasurements(response?.data || []);
    } catch (error) {
      console.error("FACE SCAN HISTORY LOAD ERROR:", error);

      Alert.alert(
        "Unable to Load",
        error?.message || "Unable to load your face scan history.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasurements();
    }, []),
  );

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Face Scan",
      "Are you sure you want to delete this saved face measurement?",
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
              setDeletingId(id);

              await deleteFaceMeasurement(id);

              setMeasurements((current) =>
                current.filter((item) => item._id !== id),
              );
            } catch (error) {
              console.error("FACE SCAN HISTORY DELETE ERROR:", error);

              Alert.alert(
                "Unable to Delete",
                error?.message || "Unable to delete this face measurement.",
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleRemoveConsent = () => {
    Alert.alert(
      "Remove Face Scan Consent",
      "This will remove your face scan consent. You will need to accept the privacy notice again before using Face Scan.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove Consent",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFaceScanConsent();

              Alert.alert(
                "Consent Removed",
                "Your Face Scan consent has been removed.",
              );
            } catch (error) {
              console.error("FACE SCAN CONSENT REMOVE ERROR:", error);

              Alert.alert(
                "Unable to Remove",
                "VisionFit could not remove your face scan consent. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const renderMeasurement = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.faceShape}>{formatValue(item.faceShape)}</Text>

          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id)}
            disabled={deletingId === item._id}
          >
            {deletingId === item._id ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.deleteText}>Delete</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.divider} />

        <InfoRow label="Face Width" value={`${item.faceWidth} mm`} />

        <InfoRow label="Face Length" value={`${item.faceLength} mm`} />

        <InfoRow label="Pupil Distance" value={`${item.pupilDistance} mm`} />

        <InfoRow
          label="Confidence"
          value={`${Math.round((item.confidence || 0) * 100)}%`}
        />

        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.helperText}>Loading face scan history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Scan History</Text>

      <Text style={styles.subtitle}>
        Your saved face measurements are shown here. You can remove measurements
        you no longer want to keep.
      </Text>

      <Pressable style={styles.consentButton} onPress={handleRemoveConsent}>
        <Text style={styles.consentButtonText}>Remove Face Scan Consent</Text>
      </Pressable>

      {measurements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Face Scans Yet</Text>

          <Text style={styles.emptyText}>
            Your saved face measurements will appear here after you complete a
            face scan.
          </Text>
        </View>
      ) : (
        <FlatList
          data={measurements}
          keyExtractor={(item) => item._id}
          renderItem={renderMeasurement}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatValue(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `Scanned on ${date.toLocaleDateString()}`;
}

const styles = StyleSheet.create({
  consentButton: {
    height: 50,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  consentButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },

  helperText: {
    marginTop: 12,
    color: "#666666",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 18,
  },

  list: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  faceShape: {
    fontSize: 21,
    fontWeight: "800",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E2E2",
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  infoLabel: {
    fontSize: 12,
    color: "#666666",
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  date: {
    marginTop: 5,
    fontSize: 11,
    color: "#999999",
  },

  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 13,
    color: "#777777",
    textAlign: "center",
    lineHeight: 20,
  },
});
