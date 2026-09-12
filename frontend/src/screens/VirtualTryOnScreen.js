import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaContextView,
} from "react-native-safe-area-context";

import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";

import { virtualTryOn } from "../api/virtualTryOnApi";

const MAX_FRAME_OPTIONS = 8;

// =========================================
// SAFE AREA WRAPPER
// =========================================

function ScreenSafeArea({ children, style }) {
  return (
    <SafeAreaProvider>
      <SafeAreaContextView
        edges={["top", "bottom", "left", "right"]}
        style={style}
      >
        {children}
      </SafeAreaContextView>
    </SafeAreaProvider>
  );
}

// =========================================
// MAIN SCREEN
// =========================================

export default function VirtualTryOnScreen({ route, navigation }) {
  const initialProduct = route?.params?.product || null;

  const initialProductId = route?.params?.productId || initialProduct?._id;

  const initialImageUri =
    route?.params?.imageUri ||
    route?.params?.faceImageUri ||
    route?.params?.photoUri ||
    null;

  const incomingFrameOptions = route?.params?.frameOptions || [];

  const [selectedProduct, setSelectedProduct] = useState(initialProduct);

  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId || null,
  );

  const [photoUri, setPhotoUri] = useState(initialImageUri);

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [sharing, setSharing] = useState(false);

  const [frameModalVisible, setFrameModalVisible] = useState(false);

  const [error, setError] = useState("");

  // =========================================
  // NORMALIZE FRAME OPTIONS
  // =========================================

  const frameOptions = useMemo(() => {
    const candidates = [selectedProduct, ...incomingFrameOptions].filter(
      Boolean,
    );

    const unique = [];
    const seen = new Set();

    for (const frame of candidates) {
      const id = frame?._id || frame?.id;

      if (!id || seen.has(id)) {
        continue;
      }

      if (!frame?.tryOnImage) {
        continue;
      }

      seen.add(id);
      unique.push(frame);
    }

    return unique.slice(0, MAX_FRAME_OPTIONS);
  }, [selectedProduct, incomingFrameOptions]);

  // =========================================
  // LOG
  // =========================================

  const logStart = (product) => {
    console.log("========================================");

    console.log("VTO SCREEN: STARTING");

    console.log("VTO SCREEN: PRODUCT", product?._id);

    console.log("VTO SCREEN: IMAGE", photoUri);

    console.log("========================================");
  };

  // =========================================
  // RUN VIRTUAL TRY-ON
  // =========================================

  const runTryOn = async (product, image) => {
    if (!product?._id) {
      setError("This frame is missing a product ID.");

      return;
    }

    if (!image) {
      setError("No face photo is available.");

      return;
    }

    if (!product?.tryOnImage) {
      setError("This frame does not have a Virtual Try-On image.");

      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      logStart(product);

      const response = await virtualTryOn(product._id, image);

      console.log("VTO SCREEN: RESULT RECEIVED");

      if (response?.error) {
        throw new Error(response.error.message || "Virtual Try-On failed.");
      }

      if (!response?.data?.image) {
        throw new Error("Virtual Try-On did not return a result image.");
      }

      setResult(response);
    } catch (err) {
      console.error("VTO SCREEN ERROR:", err);

      setError(err?.message || "Unable to create the Virtual Try-On result.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // INITIAL / UPDATED TRY-ON
  // =========================================

  useEffect(() => {
    if (!selectedProductId || !photoUri) {
      return;
    }

    const productForRun =
      selectedProduct?._id === selectedProductId
        ? selectedProduct
        : frameOptions.find((item) => item?._id === selectedProductId);

    if (!productForRun) {
      return;
    }

    runTryOn(productForRun, photoUri);
  }, [selectedProductId, photoUri]);

  // =========================================
  // ACCEPT NEW PHOTO FROM FACE SCAN
  // =========================================

  useEffect(() => {
    const updatedImage =
      route?.params?.imageUri ||
      route?.params?.faceImageUri ||
      route?.params?.photoUri ||
      null;

    if (updatedImage && updatedImage !== photoUri) {
      console.log("VTO SCREEN: NEW PHOTO RECEIVED", updatedImage);

      setPhotoUri(updatedImage);
      setResult(null);
    }
  }, [
    route?.params?.imageUri,
    route?.params?.faceImageUri,
    route?.params?.photoUri,
  ]);

  // =========================================
  // CHANGE PHOTO
  // =========================================

  const handleChangePhoto = () => {
    if (!selectedProductId) {
      return;
    }

    navigation.navigate("FaceScan", {
      returnTo: "VirtualTryOn",
      returnProductId: selectedProductId,
      returnProduct: selectedProduct,
    });
  };

  // =========================================
  // SELECT ANOTHER FRAME
  // =========================================

  const handleSelectFrame = (frame) => {
    if (!frame?._id || !frame?.tryOnImage) {
      return;
    }

    console.log("VTO SCREEN: SWITCHING FRAME", frame._id, frame.name);

    setFrameModalVisible(false);

    setSelectedProduct(frame);

    setSelectedProductId(frame._id);

    setResult(null);
    setError("");
  };

  // =========================================
  // BROWSE RECOMMENDATIONS
  // =========================================

  const handleBrowseFrames = () => {
    setFrameModalVisible(false);

    navigation.navigate("Recommendations", {
      faceImageUri: photoUri,
    });
  };

  // =========================================
  // DATA URI -> LOCAL FILE
  // =========================================

  const saveResultToCache = async () => {
    if (!result?.data?.image) {
      throw new Error("No Virtual Try-On image is available.");
    }

    const dataUri = result.data.image;

    const commaIndex = dataUri.indexOf(",");

    if (commaIndex === -1) {
      throw new Error("Invalid Virtual Try-On image format.");
    }

    const metadata = dataUri.slice(0, commaIndex);

    const base64Data = dataUri.slice(commaIndex + 1);

    const extension = metadata.includes("image/png") ? "png" : "jpg";

    const fileName = `visionfit-vto-${Date.now()}.${extension}`;

    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  };

  // =========================================
  // SAVE TO DEVICE
  // =========================================

  const handleSave = async () => {
    if (!result?.data?.image || saving) {
      return;
    }

    try {
      setSaving(true);

      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "VisionFit needs photo library access to save your Virtual Try-On result.",
        );

        return;
      }

      const localUri = await saveResultToCache();

      await MediaLibrary.saveToLibraryAsync(localUri);

      console.log("VTO SCREEN: RESULT SAVED", localUri);

      Alert.alert(
        "Saved",
        "Your Virtual Try-On result was saved to your photo library.",
      );
    } catch (err) {
      console.error("VTO SAVE ERROR:", err);

      Alert.alert(
        "Save Failed",
        err?.message || "Unable to save the Virtual Try-On result.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // SHARE RESULT
  // =========================================

  const handleShare = async () => {
    if (!result?.data?.image || sharing) {
      return;
    }

    try {
      setSharing(true);

      const localUri = await saveResultToCache();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: localUri.toLowerCase().endsWith(".png")
            ? "image/png"
            : "image/jpeg",

          dialogTitle: "Share your VisionFit look",

          UTI: Platform.OS === "ios" ? "public.image" : undefined,
        });

        console.log("VTO SCREEN: SHARE COMPLETE");

        return;
      }

      await Share.share({
        title: "VisionFit Virtual Try-On",

        message: `My Virtual Try-On result for ${
          selectedProduct?.name || "this frame"
        } on VisionFit.`,
      });
    } catch (err) {
      console.error("VTO SHARE ERROR:", err);

      if (err?.message !== "User did not share") {
        Alert.alert(
          "Share Failed",
          err?.message || "Unable to share the Virtual Try-On result.",
        );
      }
    } finally {
      setSharing(false);
    }
  };

  // =========================================
  // RETRY
  // =========================================

  const handleRetry = () => {
    if (!selectedProduct || !photoUri) {
      return;
    }

    runTryOn(selectedProduct, photoUri);
  };

  // =========================================
  // PRODUCT LABELS
  // =========================================

  const productName = selectedProduct?.name || "VisionFit Frame";

  const brandName = selectedProduct?.brand || "VisionFit";

  const price =
    selectedProduct?.price != null
      ? `₱${Number(selectedProduct.price).toLocaleString()}`
      : "";

  const detectionScore = result?.data?.detectionScore;

  const confidenceText =
    typeof detectionScore === "number"
      ? `${Math.round(detectionScore * 100)}%`
      : null;

  // =========================================
  // NO IMAGE
  // =========================================

  if (!photoUri) {
    return (
      <ScreenSafeArea style={styles.safeArea}>
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Text style={styles.stateIconText}>⌁</Text>
          </View>

          <Text style={styles.stateTitle}>No Photo Available</Text>

          <Text style={styles.stateText}>
            Take a clear front-facing photo first, then VisionFit will place
            this frame on your face.
          </Text>

          <Pressable style={styles.primaryButton} onPress={handleChangePhoto}>
            <Text style={styles.primaryButtonText}>Take / Change Photo</Text>
          </Pressable>
        </View>
      </ScreenSafeArea>
    );
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <ScreenSafeArea style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Virtual Try-On</Text>

            <Text style={styles.headerSubtitle}>Preparing your look</Text>
          </View>

          <View style={styles.headerButtonSpacer} />
        </View>

        <View style={styles.loadingState}>
          <View style={styles.loadingImageContainer}>
            <Image
              source={{
                uri: photoUri,
              }}
              style={styles.loadingImage}
              resizeMode="cover"
            />

            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />

              <Text style={styles.loadingTitle}>Trying on {productName}</Text>

              <Text style={styles.loadingText}>
                Detecting your face and positioning the frame...
              </Text>
            </View>
          </View>
        </View>
      </ScreenSafeArea>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error && !result) {
    return (
      <ScreenSafeArea style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Virtual Try-On</Text>
          </View>

          <View style={styles.headerButtonSpacer} />
        </View>

        <View style={styles.centerState}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>

          <Text style={styles.stateTitle}>Try-On Failed</Text>

          <Text style={styles.stateText}>{error}</Text>

          <Pressable style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleChangePhoto}>
            <Text style={styles.secondaryButtonText}>Change Photo</Text>
          </Pressable>
        </View>
      </ScreenSafeArea>
    );
  }

  // =========================================
  // RESULT
  // =========================================

  return (
    <ScreenSafeArea style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Virtual Try-On</Text>

            <Text style={styles.headerSubtitle}>Preview your look</Text>
          </View>

          <Pressable style={styles.headerButton} onPress={handleChangePhoto}>
            <Text style={styles.headerActionText}>Photo</Text>
          </Pressable>
        </View>

        {/* RESULT HERO */}

        <View style={styles.heroCard}>
          <Image
            source={{
              uri: result?.data?.image,
            }}
            style={styles.resultImage}
            resizeMode="cover"
          />

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>VIRTUAL TRY-ON</Text>
          </View>
        </View>

        {/* RESULT SUMMARY */}

        <View style={styles.summaryCard}>
          <Text style={styles.resultEyebrow}>YOUR LOOK</Text>

          <Text style={styles.productName}>{productName}</Text>

          <Text style={styles.brandName}>{brandName}</Text>

          {price ? <Text style={styles.price}>{price}</Text> : null}

          <View style={styles.summaryDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{confidenceText || "—"}</Text>

              <Text style={styles.statLabel}>Detection</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{photoUri ? "✓" : "—"}</Text>

              <Text style={styles.statLabel}>Photo</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>✓</Text>

              <Text style={styles.statLabel}>Preview</Text>
            </View>
          </View>
        </View>

        {/* MAIN ACTIONS */}

        <View style={styles.actionSection}>
          <Pressable
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator color="#FFFFFF" />

                <Text style={styles.primaryButtonText}>Saving...</Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <Text style={styles.buttonIcon}>↓</Text>

                <Text style={styles.primaryButtonText}>Save Result</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.outlineButton, sharing && styles.buttonDisabled]}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator />

                <Text style={styles.outlineButtonText}>Sharing...</Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <Text style={styles.outlineButtonIcon}>↗</Text>

                <Text style={styles.outlineButtonText}>Share Result</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* FRAME CONTROLS */}

        <View style={styles.controlCard}>
          <View style={styles.controlHeader}>
            <View>
              <Text style={styles.controlTitle}>Change Your Look</Text>

              <Text style={styles.controlSubtitle}>
                Try another recommended frame
              </Text>
            </View>

            <View style={styles.controlCount}>
              <Text style={styles.controlCountText}>{frameOptions.length}</Text>
            </View>
          </View>

          <Pressable
            style={styles.switchFrameButton}
            onPress={() => {
              if (frameOptions.length > 1) {
                setFrameModalVisible(true);
              } else {
                handleBrowseFrames();
              }
            }}
          >
            <Text style={styles.switchFrameIcon}>◇</Text>

            <Text style={styles.switchFrameText}>
              {frameOptions.length > 1 ? "Switch Frame" : "Try Another Frame"}
            </Text>

            <Text style={styles.switchFrameArrow}>›</Text>
          </Pressable>

          <Pressable
            style={styles.changePhotoButton}
            onPress={handleChangePhoto}
          >
            <Text style={styles.changePhotoText}>Change / Retake Photo</Text>
          </Pressable>
        </View>

        {/* DISCLAIMER */}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>ⓘ</Text>

          <Text style={styles.disclaimerText}>
            Virtual Try-On is a visual styling preview. Frame size and
            positioning are estimated from your photo and may not represent the
            exact physical fit.
          </Text>
        </View>
      </ScrollView>

      {/* FRAME SELECTOR MODAL */}

      <Modal
        visible={frameModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFrameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose a Frame</Text>

                <Text style={styles.modalSubtitle}>
                  Your current photo will be reused
                </Text>
              </View>

              <Pressable
                style={styles.modalClose}
                onPress={() => setFrameModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.frameList}
            >
              {frameOptions
                .filter((frame) => frame?._id !== selectedProduct?._id)
                .map((frame) => (
                  <Pressable
                    key={frame._id}
                    style={styles.frameOption}
                    onPress={() => handleSelectFrame(frame)}
                  >
                    <View style={styles.frameThumbnail}>
                      {frame.images?.[0] ? (
                        <Image
                          source={{
                            uri: frame.images[0],
                          }}
                          style={styles.frameThumbnailImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.frameThumbnailPlaceholder}>
                          <Text>VisionFit</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.frameOptionInfo}>
                      <Text style={styles.frameOptionName} numberOfLines={2}>
                        {frame.name || "VisionFit Frame"}
                      </Text>

                      <Text style={styles.frameOptionBrand}>
                        {frame.brand || "VisionFit"}
                      </Text>

                      {frame.price != null ? (
                        <Text style={styles.frameOptionPrice}>
                          ₱{Number(frame.price).toLocaleString()}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={styles.frameOptionArrow}>›</Text>
                  </Pressable>
                ))}

              {frameOptions.filter(
                (frame) => frame?._id !== selectedProduct?._id,
              ).length === 0 ? (
                <View style={styles.emptyFrames}>
                  <Text style={styles.emptyFramesTitle}>
                    No alternate frames loaded
                  </Text>

                  <Text style={styles.emptyFramesText}>
                    Browse your recommendations to choose another Virtual Try-On
                    frame.
                  </Text>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={handleBrowseFrames}
                  >
                    <Text style={styles.primaryButtonText}>
                      Browse Recommendations
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenSafeArea>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scrollContent: {
    paddingBottom: 36,
  },

  // =========================================
  // HEADER
  // =========================================

  header: {
    minHeight: 74,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  headerButtonText: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "300",
    color: "#111111",
    marginTop: -3,
  },

  headerActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },

  headerButtonSpacer: {
    width: 48,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#777777",
  },

  // =========================================
  // HERO
  // =========================================

  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#E9E9E9",
  },

  resultImage: {
    width: "100%",
    aspectRatio: 0.72,
  },

  heroBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // =========================================
  // SUMMARY
  // =========================================

  summaryCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  resultEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#858585",
    marginBottom: 7,
  },

  productName: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
    color: "#111111",
  },

  brandName: {
    marginTop: 4,
    fontSize: 15,
    color: "#777777",
  },

  price: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 18,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111111",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#858585",
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#EAEAEA",
  },

  // =========================================
  // ACTIONS
  // =========================================

  actionSection: {
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },

  primaryButton: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  buttonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  outlineButton: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#111111",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  outlineButtonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "800",
  },

  outlineButtonIcon: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  // =========================================
  // CONTROLS
  // =========================================

  controlCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  controlHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  controlTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111111",
  },

  controlSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#858585",
  },

  controlCount: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 9,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },

  controlCountText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  switchFrameButton: {
    marginTop: 16,
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: "#F1F1F1",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  switchFrameIcon: {
    fontSize: 21,
    color: "#111111",
    marginRight: 10,
  },

  switchFrameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#111111",
  },

  switchFrameArrow: {
    fontSize: 26,
    color: "#666666",
  },

  changePhotoButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  changePhotoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555555",
  },

  // =========================================
  // DISCLAIMER
  // =========================================

  disclaimerCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  disclaimerIcon: {
    fontSize: 18,
    color: "#6D6D6D",
    marginRight: 10,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#6D6D6D",
  },

  // =========================================
  // LOADING
  // =========================================

  loadingState: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },

  loadingImageContainer: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#222222",
  },

  loadingImage: {
    width: "100%",
    aspectRatio: 0.72,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  loadingText: {
    marginTop: 8,
    color: "#E5E5E5",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  // =========================================
  // EMPTY / ERROR
  // =========================================

  centerState: {
    flex: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E9E9E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  stateIconText: {
    fontSize: 30,
    color: "#111111",
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EDEDED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  errorIconText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111111",
  },

  stateTitle: {
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    color: "#111111",
  },

  stateText: {
    marginTop: 10,
    maxWidth: 360,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#737373",
    marginBottom: 22,
  },

  secondaryButton: {
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#D8D8D8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111111",
  },

  // =========================================
  // MODAL
  // =========================================

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  modalSheet: {
    maxHeight: "82%",
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 26,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
  },

  modalHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#D7D7D7",
  },

  modalHeader: {
    marginTop: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#858585",
  },

  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCloseText: {
    fontSize: 28,
    lineHeight: 30,
    color: "#111111",
  },

  frameList: {
    paddingBottom: 20,
    gap: 10,
  },

  frameOption: {
    minHeight: 92,
    padding: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    alignItems: "center",
  },

  frameThumbnail: {
    width: 82,
    height: 70,
    borderRadius: 13,
    backgroundColor: "#EEEEEE",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  frameThumbnailImage: {
    width: "90%",
    height: "90%",
  },

  frameThumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  frameOptionInfo: {
    flex: 1,
    marginHorizontal: 12,
  },

  frameOptionName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#111111",
  },

  frameOptionBrand: {
    marginTop: 2,
    fontSize: 12,
    color: "#777777",
  },

  frameOptionPrice: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  frameOptionArrow: {
    fontSize: 26,
    color: "#666666",
    paddingHorizontal: 4,
  },

  emptyFrames: {
    padding: 20,
    alignItems: "center",
  },

  emptyFramesTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
  },

  emptyFramesText: {
    marginTop: 7,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 19,
    color: "#777777",
    textAlign: "center",
  },
});
