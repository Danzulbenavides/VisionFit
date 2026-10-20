import React from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

export default function SettingsScreen({ navigation }) {
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleNotificationsPress = () => {
    navigation.navigate("Notifications");
  };

  const handleChangePasswordPress = () => {
    navigation.navigate("ChangePassword");
  };

  const handleLanguagePress = () => {
    Alert.alert(
      "Language & Region",
      "VisionFit uses your device's language and region settings. Change them in your phone's Settings app, and the app will reflect your preferred language.",
      [{ text: "OK", style: "cancel" }],
    );
  };

  const handleAppVersionPress = () => {
    Alert.alert(
      "App Version",
      `VisionFit version ${appVersion}`,
      [{ text: "OK", style: "cancel" }],
    );
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Settings</Text>
        </View>

        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={handleNotificationsPress}>
            <View style={s.rowIcon}>
              <Ionicons name="notifications-outline" size={21} />
            </View>
            <Text style={s.rowTitle}>Notifications</Text>
            <Text style={s.rowSubtitle}>Manage push and email alerts</Text>
            <Ionicons name="chevron-forward" size={15} color="#888" />
          </TouchableOpacity>
          <View style={s.divider} />

          <TouchableOpacity style={s.row} onPress={handleChangePasswordPress}>
            <View style={s.rowIcon}>
              <Ionicons name="lock-closed-outline" size={21} />
            </View>
            <Text style={s.rowTitle}>Change Password</Text>
            <Text style={s.rowSubtitle}>Update your account password</Text>
            <Ionicons name="chevron-forward" size={15} color="#888" />
          </TouchableOpacity>
          <View style={s.divider} />

          <TouchableOpacity style={s.row} onPress={handleLanguagePress}>
            <View style={s.rowIcon}>
              <Ionicons name="language-outline" size={21} />
            </View>
            <Text style={s.rowTitle}>Language & Region</Text>
            <Text style={s.rowSubtitle}>English (Philippines)</Text>
            <Ionicons name="chevron-forward" size={15} color="#888" />
          </TouchableOpacity>
          <View style={s.divider} />

          <TouchableOpacity style={s.row} onPress={handleAppVersionPress}>
            <View style={s.rowIcon}>
              <Ionicons name="information-circle-outline" size={21} />
            </View>
            <Text style={s.rowTitle}>App Version</Text>
            <Text style={s.rowSubtitle}>VisionFit {appVersion}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { padding: 16, paddingBottom: 30 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.6 },
  card: { backgroundColor: "#fff", borderRadius: 13, overflow: "hidden" },
  row: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: { width: 28, alignItems: "center" },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: "700" },
  rowSubtitle: { fontSize: 11, color: "#888", marginTop: 1 },
  divider: { height: 1, backgroundColor: "#ECECEC", marginLeft: 40 },
});
