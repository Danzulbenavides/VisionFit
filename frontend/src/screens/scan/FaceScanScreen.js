import React, { useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";

import { analyzeFaceScan } from "../../api/faceScan";
import { createFaceMeasurement } from "../../api/faceMeasurements";

export default function FaceScanScreen({ navigation }) {
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.helperText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>

        <Text style={styles.permissionText}>
          VisionFit needs camera access to analyze your face and recommend
          eyewear frames.
        </Text>

        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current || scanning) {
      return;
    }

    try {
      setScanning(true);
      setResult(null);

      console.log("========================================");
      console.log("FACE SCAN: CAPTURE START");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo?.uri) {
        throw new Error("Camera did not return an image.");
      }

      console.log("FACE SCAN: PHOTO CAPTURED", photo.uri);

      setPhotoUri(photo.uri);

      console.log("FACE SCAN: STARTING SERVER ANALYSIS");

      const response = await analyzeFaceScan(photo.uri);

      console.log("FACE SCAN: SERVER RESULT", response);

      if (response?.error) {
        throw new Error(response.error.message || "Face analysis failed.");
      }

      if (!response?.data) {
        throw new Error("The server returned no face analysis data.");
      }

      console.log("FACE SCAN: ANALYSIS SUCCESS");

      console.log("FACE SCAN DATA:", response.data);

      setResult(response.data);
    } catch (error) {
      console.error("========================================");

      console.error("FACE SCAN ERROR:", error);

      console.error("FACE SCAN ERROR MESSAGE:", error?.message);

      console.error("========================================");

      Alert.alert(
        "Face Scan Failed",
        error?.message || "Unable to analyze your face.",
      );
    } finally {
      setScanning(false);
    }
  };

  const saveResult = async () => {
    if (!result || scanning) {
      return;
    }

    try {
      setScanning(true);

      console.log("FACE SCAN: SAVING MEASUREMENT");

      const response = await createFaceMeasurement({
        faceShape: result.faceShape,
        pupilDistance: result.pupilDistance,
        faceWidth: result.faceWidth,
        faceLength: result.faceLength,
        confidence: result.confidence,
        scanImageUrl: null,
      });

      console.log("FACE SCAN: SAVE RESPONSE", response);

      if (response?.error) {
        throw new Error(
          response.error.message || "Unable to save face measurement.",
        );
      }

      console.log("FACE SCAN: SAVE SUCCESS");

      navigation.navigate("Recommendations", {
        faceScan: result,
        faceImageUri: photoUri,
      });
    } catch (error) {
      console.error("FACE SCAN SAVE ERROR:", error);

      Alert.alert(
        "Unable to Save",
        error?.message || "Unable to save your face measurement.",
      );
    } finally {
      setScanning(false);
    }
  };

  const retake = () => {
    console.log("FACE SCAN: RETAKE");

    setResult(null);
    setPhotoUri(null);
  };

  if (result) {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Face Scan Complete</Text>

        <Text style={styles.subtitle}>
          VisionFit automatically analyzed your face using facial landmarks.
        </Text>

        <View style={styles.resultCard}>
          <Text style={styles.smallLabel}>Detected Face Shape</Text>

          <Text style={styles.faceShape}>{formatValue(result.faceShape)}</Text>

          <View style={styles.divider} />

          <ResultRow
            label="Estimated Face Width"
            value={`${result.faceWidth} mm`}
          />

          <ResultRow
            label="Estimated Face Length"
            value={`${result.faceLength} mm`}
          />

          <ResultRow
            label="Estimated PD"
            value={`${result.pupilDistance} mm`}
          />

          <ResultRow
            label="Confidence"
            value={`${Math.round(result.confidence * 100)}%`}
          />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Important</Text>

          <Text style={styles.noticeText}>
            These dimensions are estimates derived from facial landmarks for
            eyewear recommendations. They are not clinical or optometrist-grade
            measurements.
          </Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={saveResult}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Save & View Recommendations
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={retake}
          disabled={scanning}
        >
          <Text style={styles.secondaryButtonText}>Scan Again</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (scanning) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.analyzingTitle}>Analyzing your face...</Text>

        <Text style={styles.analyzingText}>
          VisionFit is sending your photo to the face analysis service.
        </Text>

        <Text style={styles.analyzingSubtext}>Please wait a few seconds.</Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      {/* CAMERA */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="picture"
        mirror
      />

      {/* EVERYTHING BELOW IS ABOVE THE CAMERA */}
      <View pointerEvents="none" style={styles.overlay}>
        {/* FACE GUIDE */}
        <View style={styles.faceGuide}>
          <View style={[styles.guideCorner, styles.guideTopLeft]} />

          <View style={[styles.guideCorner, styles.guideTopRight]} />

          <View style={[styles.guideCorner, styles.guideBottomLeft]} />

          <View style={[styles.guideCorner, styles.guideBottomRight]} />
        </View>

        {/* GUIDE TEXT */}
        <Text style={styles.guideText}>Center your face inside the guide</Text>

        <Text style={styles.guideSubtext}>
          Look straight at the camera and keep your head level.
        </Text>
      </View>

      {/* HEADER */}
      <View style={styles.cameraHeader}>
        <Text style={styles.cameraTitle}>VisionFit Face Scan</Text>

        <Text style={styles.cameraSubtitle}>
          Take a clear front-facing photo
        </Text>
      </View>

      {/* CAPTURE BUTTON */}
      <View style={styles.captureArea}>
        <Pressable style={styles.captureButtonOuter} onPress={takePhoto}>
          <View style={styles.captureButtonInner} />
        </Pressable>

        <Text style={styles.captureHint}>Tap to scan</Text>
      </View>
    </View>
  );
}

function ResultRow({ label, value }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>

      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function formatValue(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  /* =========================
     GENERAL
  ========================= */

  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
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

  /* =========================
     PERMISSION
  ========================= */

  permissionTitle: {
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },

  permissionText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "#666666",
    marginBottom: 22,
  },

  /* =========================
     CAMERA
  ========================= */

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },

  camera: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },

  /* =========================
     CAMERA OVERLAY
  ========================= */

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    justifyContent: "center",
    alignItems: "center",

    zIndex: 50,

    elevation: 50,
  },

  /* =========================
     FACE GUIDE
  ========================= */

  faceGuide: {
    width: 280,
    height: 380,

    position: "relative",

    zIndex: 100,

    elevation: 100,
  },

  guideCorner: {
    position: "absolute",

    width: 55,
    height: 55,

    borderColor: "#FFFFFF",

    zIndex: 101,

    elevation: 101,
  },

  guideTopLeft: {
    top: 0,
    left: 0,

    borderTopWidth: 5,
    borderLeftWidth: 5,

    borderTopLeftRadius: 18,
  },

  guideTopRight: {
    top: 0,
    right: 0,

    borderTopWidth: 5,
    borderRightWidth: 5,

    borderTopRightRadius: 18,
  },

  guideBottomLeft: {
    bottom: 0,
    left: 0,

    borderBottomWidth: 5,
    borderLeftWidth: 5,

    borderBottomLeftRadius: 18,
  },

  guideBottomRight: {
    bottom: 0,
    right: 0,

    borderBottomWidth: 5,
    borderRightWidth: 5,

    borderBottomRightRadius: 18,
  },

  /* =========================
     GUIDE TEXT
  ========================= */

  guideText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "700",

    textAlign: "center",

    marginTop: 18,

    zIndex: 100,

    textShadowColor: "#000000",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  guideSubtext: {
    color: "#FFFFFF",

    fontSize: 12,

    textAlign: "center",

    marginTop: 7,

    paddingHorizontal: 40,

    zIndex: 100,

    textShadowColor: "#000000",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  /* =========================
     CAMERA HEADER
  ========================= */

  cameraHeader: {
    position: "absolute",

    top: 55,

    left: 20,
    right: 20,

    alignItems: "center",

    zIndex: 80,

    elevation: 80,
  },

  cameraTitle: {
    color: "#FFFFFF",

    fontSize: 24,

    fontWeight: "800",

    textShadowColor: "#000000",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  cameraSubtitle: {
    color: "#FFFFFF",

    fontSize: 12,

    marginTop: 5,

    textShadowColor: "#000000",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  /* =========================
     CAPTURE BUTTON
  ========================= */

  captureArea: {
    position: "absolute",

    bottom: 40,

    width: "100%",

    alignItems: "center",

    zIndex: 80,

    elevation: 80,
  },

  captureButtonOuter: {
    width: 78,
    height: 78,

    borderRadius: 39,

    borderWidth: 5,

    borderColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",
  },

  captureButtonInner: {
    width: 62,
    height: 62,

    borderRadius: 31,

    backgroundColor: "#FFFFFF",
  },

  captureHint: {
    color: "#FFFFFF",

    fontSize: 12,

    marginTop: 8,

    textShadowColor: "#000000",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  /* =========================
     ANALYZING
  ========================= */

  analyzingTitle: {
    fontSize: 23,

    fontWeight: "800",

    marginTop: 20,

    textAlign: "center",
  },

  analyzingText: {
    fontSize: 13,

    color: "#666666",

    lineHeight: 20,

    textAlign: "center",

    marginTop: 8,
  },

  analyzingSubtext: {
    fontSize: 12,

    color: "#999999",

    marginTop: 8,
  },

  /* =========================
     RESULTS
  ========================= */

  title: {
    fontSize: 29,

    fontWeight: "800",

    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,

    color: "#666666",

    lineHeight: 20,

    marginBottom: 22,
  },

  resultCard: {
    backgroundColor: "#F7F7F7",

    borderRadius: 18,

    padding: 20,
  },

  smallLabel: {
    fontSize: 11,

    color: "#888888",
  },

  faceShape: {
    fontSize: 28,

    fontWeight: "800",

    marginTop: 5,
  },

  divider: {
    height: 1,

    backgroundColor: "#E2E2E2",

    marginVertical: 18,
  },

  resultRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 14,
  },

  resultLabel: {
    flex: 1,

    color: "#666666",

    fontSize: 12,
  },

  resultValue: {
    fontSize: 14,

    fontWeight: "800",
  },

  notice: {
    backgroundColor: "#F5F5F5",

    borderRadius: 12,

    padding: 14,

    marginVertical: 18,
  },

  noticeTitle: {
    fontSize: 13,

    fontWeight: "800",

    marginBottom: 5,
  },

  noticeText: {
    fontSize: 12,

    color: "#666666",

    lineHeight: 18,
  },

  /* =========================
     BUTTONS
  ========================= */

  primaryButton: {
    height: 52,

    borderRadius: 12,

    backgroundColor: "#111111",

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: 20,
  },

  primaryButtonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "700",

    textAlign: "center",
  },

  secondaryButton: {
    height: 50,

    borderWidth: 1,

    borderColor: "#D5D5D5",

    borderRadius: 12,

    justifyContent: "center",

    alignItems: "center",

    marginTop: 10,
  },

  secondaryButtonText: {
    fontSize: 14,

    fontWeight: "700",
  },
});
