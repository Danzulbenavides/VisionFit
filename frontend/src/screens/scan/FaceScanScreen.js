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

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#315B4A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={s.content}>
          <Pressable
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={s.back}
          >
            <Ionicons name="arrow-back" size={22} color="#183B2B" />
          </Pressable>

          <View style={s.permIconWrap}>
            <Ionicons name="camera-outline" size={48} color="#315B4A" />
          </View>

          <Text style={s.overline}>CAMERA ACCESS</Text>

          <Text style={s.title}>Enable your camera</Text>

          <Text style={s.text}>
            VisionFit needs camera access to analyze your face and recommend
            eyewear frames.
          </Text>

          <Pressable style={s.button} onPress={requestPermission}>
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={s.buttonText}>Allow Camera</Text>
          </Pressable>

          {navigation.canGoBack() ? (
            <Pressable
              style={s.textBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={s.textBtnText}>Go back</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
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
      <SafeAreaView style={s.container} edges={["top"]}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={s.back}
          >
            <Ionicons name="arrow-back" size={22} color="#183B2B" />
          </Pressable>

          <View style={s.resultIcon}>
            <Ionicons name="sparkles" size={42} color="#315B4A" />
          </View>

          <Text style={s.overline}>ANALYSIS COMPLETE</Text>

          <Text style={s.title}>
            Your face shape is{"\n"}
            {formatValue(result.faceShape)}
          </Text>

          <Text style={s.text}>
            VisionFit analyzed your face using facial landmarks. Here's what
            it found.
          </Text>

          <View style={s.resultCard}>
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

          <View style={s.notice}>
            <Text style={s.noticeTitle}>Important</Text>

            <Text style={s.noticeText}>
              These dimensions are estimates derived from facial landmarks for
              eyewear recommendations. They are not clinical or
              optometrist-grade measurements.
            </Text>
          </View>

          <Pressable
            style={[s.button, scanning && s.disabled]}
            onPress={saveResult}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.buttonText}>See my frame matches</Text>
                <Ionicons name="arrow-forward" size={19} color="#fff" />
              </>
            )}
          </Pressable>

          <Pressable
            style={s.retakeBtn}
            onPress={retake}
            disabled={scanning}
          >
            <Ionicons name="refresh-outline" size={18} color="#315B4A" />
            <Text style={s.retakeBtnText}>Scan again</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={s.camera}
        facing="front"
        mode="picture"
        mirror
      />

      {/* Overlay is a sibling positioned on top of the camera, not a
          child of CameraView — CameraView does not support children. */}
      <View style={s.cameraOverlay}>
        <Pressable
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          style={s.cameraBack}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={s.guideWrap} pointerEvents="none">
          <View style={s.guide}>
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>

          <Text style={s.guideText}>Center your face inside the guide</Text>

          <Text style={s.guideSubtext}>
            Look straight at the camera and keep your head level.
          </Text>
        </View>

        <View style={s.bottomBar}>
          <Text style={s.privacy}>
            <Ionicons
              name="lock-closed-outline"
              size={12}
              color="rgba(255,255,255,0.7)"
            />{" "}
            Your scan is only used to generate your face-shape result.
          </Text>

          <Pressable
            style={[s.captureBtn, scanning && s.captureBtnDisabled]}
            onPress={takePhoto}
            disabled={scanning}
          >
            {scanning ? (
              <View style={s.analyzingWrap}>
                <Ionicons name="hourglass-outline" size={22} color="#fff" />
                <Text style={s.captureBtnText}>Analyzing...</Text>
              </View>
            ) : (
              <Ionicons name="camera" size={28} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ResultRow({ label, value }) {
  return (
    <View style={s.resultRow}>
      <Text style={s.resultLabel}>{label}</Text>

      <Text style={s.resultValue}>{value}</Text>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F6F1" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  content: { padding: 22, paddingBottom: 40 },

  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  overline: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#779081",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    color: "#183B2B",
    marginTop: 6,
  },

  text: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64736A",
    marginTop: 11,
  },

  permIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#DDEDDC",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 48,
    marginBottom: 30,
  },

  button: {
    height: 55,
    borderRadius: 14,
    backgroundColor: "#315B4A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 23,
  },

  buttonText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  disabled: { opacity: 0.6 },

  textBtn: { marginTop: 16, alignItems: "center" },

  textBtnText: { fontSize: 14, fontWeight: "600", color: "#315B4A" },

  /* Camera */

  cameraContainer: { flex: 1, backgroundColor: "#000", position: "relative" },

  camera: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: 20,
  },

  cameraBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  guideWrap: { alignItems: "center" },

  guide: { width: 240, height: 280, borderRadius: 20 },

  corner: { position: "absolute", width: 36, height: 36, borderColor: "#fff" },

  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 16,
  },

  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 16,
  },

  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 16,
  },

  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 16,
  },

  guideText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  guideSubtext: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 30,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  bottomBar: { alignItems: "center", paddingBottom: 20 },

  privacy: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
    textAlign: "center",
  },

  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#315B4A",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  captureBtnDisabled: { opacity: 0.7 },

  captureBtnText: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 2 },

  analyzingWrap: { alignItems: "center" },

  /* Result */

  resultIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#DDEDDC",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 30,
  },

  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 19,
    marginTop: 24,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  resultLabel: { flex: 1, color: "#64736A", fontSize: 12 },

  resultValue: { fontSize: 14, fontWeight: "800", color: "#183B2B" },

  notice: {
    backgroundColor: "#EFEFEA",
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    marginBottom: 4,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 5,
    color: "#183B2B",
  },

  noticeText: { fontSize: 12, color: "#64736A", lineHeight: 18 },

  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingVertical: 12,
  },

  retakeBtnText: { fontSize: 14, fontWeight: "600", color: "#315B4A" },
});
