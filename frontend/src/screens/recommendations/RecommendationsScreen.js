import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { getRecommendations } from "../../api/recommendations";

export default function RecommendationsScreen({ navigation, route }) {
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /*
   * Result passed directly from FaceScanScreen.
   *
   * The face image URI is intentionally checked
   * in several possible property names so this
   * screen can work with the existing FaceScan flow.
   */
  const passedFaceScan = route?.params?.faceScan || null;

  const faceImageUri =
    route?.params?.faceImageUri ||
    passedFaceScan?.imageUri ||
    passedFaceScan?.photoUri ||
    passedFaceScan?.faceImageUri ||
    passedFaceScan?.uri ||
    null;

  // =========================================
  // LOAD RECOMMENDATIONS
  // =========================================

  const loadRecommendations = async ({ showFullLoading = true } = {}) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      }

      setError("");

      console.log("RECOMMENDATIONS: LOADING");

      const result = await getRecommendations();

      console.log("RECOMMENDATIONS: RESPONSE", result);

      if (result?.error) {
        setError(result.error.message || "Unable to load recommendations.");
        return;
      }

      setData(result?.data || null);
    } catch (err) {
      console.error("Load recommendations error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Unable to load recommendations.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================
  // LOAD WHEN SCREEN GETS FOCUS
  // =========================================

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();

      return undefined;
    }, []),
  );

  // =========================================
  // UPDATE DATA FROM NEW FACE SCAN PARAM
  // =========================================

  useEffect(() => {
    if (!passedFaceScan) {
      return;
    }

    console.log("RECOMMENDATIONS: RECEIVED FACE SCAN", passedFaceScan);

    setData((current) => ({
      ...(current || {}),

      faceShape: passedFaceScan.faceShape,

      pupilDistance: passedFaceScan.pupilDistance,

      faceWidth: passedFaceScan.faceWidth,

      faceLength: passedFaceScan.faceLength,

      confidence: passedFaceScan.confidence,
    }));
  }, [passedFaceScan]);

  // =========================================
  // LOADING
  // =========================================

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Finding frames for you...</Text>
      </View>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error && !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No Recommendations Yet</Text>

        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("FaceScan")}
        >
          <Text style={styles.buttonText}>Start Face Scan</Text>
        </Pressable>
      </View>
    );
  }

  // =========================================
  // DATA
  // =========================================

  const recommendations = data?.recommendations || [];

  const faceShape = passedFaceScan?.faceShape || data?.faceShape;

  const pupilDistance = passedFaceScan?.pupilDistance ?? data?.pupilDistance;

  const faceWidth = passedFaceScan?.faceWidth ?? data?.faceWidth;

  const faceLength = passedFaceScan?.faceLength ?? data?.faceLength;

  const confidence = passedFaceScan?.confidence ?? data?.confidence;

  // =========================================
  // TRY ON HANDLER
  // =========================================

  const openVirtualTryOn = (product) => {
    if (!product?._id) {
      return;
    }

    /*
     * A Virtual Try-On requires the original
     * face image. The recommendation result
     * contains measurements, not the raw image.
     *
     * We pass the image URI separately and never
     * send/store the photo through MongoDB.
     */

    if (!faceImageUri) {
      navigation.navigate("FaceScan", {
        returnTo: "VirtualTryOn",
        productId: product._id,
      });

      return;
    }

    navigation.navigate("VirtualTryOn", {
      product,
      productId: product._id,
      imageUri: faceImageUri,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);

            await loadRecommendations({
              showFullLoading: false,
            });
          }}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* =====================================
          HEADER
      ====================================== */}

      <Text style={styles.title}>Recommended for You</Text>

      <Text style={styles.subtitle}>
        Frames selected based on your face shape and saved prescription.
      </Text>

      {/* =====================================
          FACE SCAN RESULT
      ====================================== */}

      <View style={styles.scanCard}>
        <View style={styles.scanHeader}>
          <View>
            <Text style={styles.scanEyebrow}>YOUR FACE ANALYSIS</Text>

            <Text style={styles.scanTitle}>
              {formatValue(faceShape) || "Not available"}
            </Text>
          </View>

          {confidence != null ? (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(Number(confidence) * 100)}%
              </Text>

              <Text style={styles.confidenceLabel}>confidence</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.scanDivider} />

        <View style={styles.measurementsRow}>
          <Measurement
            label="Estimated PD"
            value={pupilDistance != null ? `${pupilDistance} mm` : "—"}
          />

          <Measurement
            label="Face Width"
            value={faceWidth != null ? `${faceWidth} mm` : "—"}
          />

          <Measurement
            label="Face Length"
            value={faceLength != null ? `${faceLength} mm` : "—"}
          />
        </View>

        <Text style={styles.scanDisclaimer}>
          Measurements are estimates for eyewear recommendations and are not
          clinical measurements.
        </Text>
      </View>

      {/* =====================================
          COMPATIBLE SHAPES
      ====================================== */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Frame Shapes For You</Text>

        <Text style={styles.sectionSubtitle}>
          Based on your detected face shape.
        </Text>
      </View>

      <View style={styles.shapeList}>
        {(data?.compatibleFrameShapes || []).map((shape) => (
          <View key={shape} style={styles.shapeChip}>
            <Text style={styles.shapeChipText}>{formatValue(shape)}</Text>
          </View>
        ))}
      </View>

      {/* =====================================
          PRESCRIPTION
      ====================================== */}

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Prescription Used</Text>

        <Text style={styles.summaryValue}>
          {data?.prescriptionUsed ? "Yes" : "No"}
        </Text>
      </View>

      {/* =====================================
          RECOMMENDATIONS
      ====================================== */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended Frames</Text>

        <Text style={styles.sectionSubtitle}>
          Personalized picks based on your scan.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{error}</Text>
        </View>
      ) : null}

      {recommendations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No matching frames</Text>

          <Text style={styles.emptyText}>
            We couldn't find a frame that matches your current measurements.
          </Text>

          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate("ProductList")}
          >
            <Text style={styles.buttonText}>Browse All Frames</Text>
          </Pressable>
        </View>
      ) : (
        recommendations.map((recommendation) => {
          const product = recommendation.product;

          const image = product?.images?.[0];

          const hasTryOnImage = Boolean(product?.tryOnImage);

          return (
            <View key={product?._id} style={styles.card}>
              {/* =================================
                  PRODUCT IMAGE
              ================================= */}

              <Pressable
                onPress={() =>
                  navigation.navigate("ProductDetails", {
                    productId: product?._id,
                  })
                }
              >
                <View style={styles.imageContainer}>
                  {image ? (
                    <Image
                      source={{
                        uri: image,
                      }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholder}>
                      <Text style={styles.placeholderText}>VisionFit</Text>
                    </View>
                  )}
                </View>
              </Pressable>

              {/* =================================
                  PRODUCT INFORMATION
              ================================= */}

              <View style={styles.productInfo}>
                <Text style={styles.brand}>
                  {product?.brand || "VisionFit"}
                </Text>

                <Text style={styles.name} numberOfLines={2}>
                  {product?.name || "Eyewear"}
                </Text>

                <Text style={styles.price}>
                  ₱{Number(product?.price || 0).toLocaleString()}
                </Text>

                <View style={styles.matchRow}>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchScore}>
                      {recommendation.matchScore}%
                    </Text>

                    <Text style={styles.matchLabel}>
                      {recommendation.matchLabel}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reason}>
                  {recommendation.reason || "Recommended for your face shape."}
                </Text>

                {/* =================================
                    TRY ON BUTTON
                ================================= */}

                <Pressable
                  style={[
                    styles.tryOnButton,
                    !hasTryOnImage && styles.tryOnButtonDisabled,
                  ]}
                  disabled={!hasTryOnImage}
                  onPress={() => openVirtualTryOn(product)}
                >
                  <Text style={styles.tryOnButtonText}>
                    {hasTryOnImage ? "Try On" : "Try On Unavailable"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      {/* =====================================
          RESCAN
      ====================================== */}

      <Pressable
        style={styles.rescanButton}
        onPress={() => navigation.navigate("FaceScan")}
      >
        <Text style={styles.rescanButtonText}>Scan Again</Text>
      </Pressable>
    </ScrollView>
  );
}

// =========================================
// MEASUREMENT COMPONENT
// =========================================

function Measurement({ label, value }) {
  return (
    <View style={styles.measurement}>
      <Text style={styles.measurementLabel}>{label}</Text>

      <Text style={styles.measurementValue}>{value}</Text>
    </View>
  );
}

// =========================================
// FORMAT VALUE
// =========================================

function formatValue(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// =========================================
// STYLES
// =========================================

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

  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 7,
  },

  errorText: {
    textAlign: "center",
    color: "#666666",
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 19,
  },

  // =========================================
  // SCAN CARD
  // =========================================

  scanCard: {
    backgroundColor: "#111111",
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },

  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scanEyebrow: {
    fontSize: 10,
    color: "#AAAAAA",
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  scanTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 5,
  },

  confidenceBadge: {
    backgroundColor: "#2B2B2B",
    minWidth: 62,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  confidenceText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  confidenceLabel: {
    color: "#AAAAAA",
    fontSize: 8,
    marginTop: 1,
  },

  scanDivider: {
    height: 1,
    backgroundColor: "#2D2D2D",
    marginVertical: 17,
  },

  measurementsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  measurement: {
    flex: 1,
  },

  measurementLabel: {
    color: "#AAAAAA",
    fontSize: 9,
    marginBottom: 4,
  },

  measurementValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  scanDisclaimer: {
    color: "#8F8F8F",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 16,
  },

  // =========================================
  // SECTIONS
  // =========================================

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#777777",
    marginTop: 3,
  },

  // =========================================
  // SHAPES
  // =========================================

  shapeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },

  shapeChip: {
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 7,
    marginBottom: 7,
  },

  shapeChipText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // =========================================
  // SUMMARY
  // =========================================

  summary: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },

  summaryLabel: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  // =========================================
  // ERROR
  // =========================================

  errorBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  errorBoxText: {
    color: "#666666",
    fontSize: 11,
    lineHeight: 17,
  },

  // =========================================
  // PRODUCT CARD
  // =========================================

  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
    marginRight: 14,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: 13,
    color: "#888888",
    fontWeight: "700",
  },

  productInfo: {
    flex: 1,
  },

  brand: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 3,
  },

  name: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },

  price: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },

  matchRow: {
    marginBottom: 8,
  },

  matchBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  matchScore: {
    fontSize: 12,
    fontWeight: "800",
  },

  matchLabel: {
    fontSize: 8,
    color: "#777777",
    marginTop: 1,
  },

  reason: {
    fontSize: 11,
    color: "#666666",
    lineHeight: 16,
    marginBottom: 12,
  },

  // =========================================
  // TRY ON
  // =========================================

  tryOnButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  tryOnButtonDisabled: {
    backgroundColor: "#D6D6D6",
  },

  tryOnButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // =========================================
  // EMPTY
  // =========================================

  empty: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 6,
  },

  emptyText: {
    textAlign: "center",
    color: "#666666",
    lineHeight: 20,
    marginBottom: 18,
  },

  // =========================================
  // BUTTONS
  // =========================================

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

  rescanButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  rescanButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
