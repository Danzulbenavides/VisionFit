import React, { useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import { changePassword } from "../../api/auth";
import useKeyboardInset from "../../hooks/useKeyboardInset";

const passwordRules = (value) => [
  { label: "At least 8 characters", ok: value.length >= 8 },
  { label: "Uppercase letter", ok: /[A-Z]/.test(value) },
  { label: "Lowercase letter", ok: /[a-z]/.test(value) },
  { label: "Number", ok: /\d/.test(value) },
  { label: "Special character", ok: /[^A-Za-z0-9]/.test(value) },
];

const toMessage = (error, fallback) =>
  error.response?.data?.error?.message || error.message || fallback;

export default function ChangePasswordScreen({ navigation }) {
  const keyboardInset = useKeyboardInset();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(
        "Missing Information",
        "Please fill in all password fields.",
      );
      return;
    }

    const rulesOk = passwordRules(newPassword).every((rule) => rule.ok);

    if (!rulesOk) {
      Alert.alert(
        "Weak Password",
        "New password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords Do Not Match", "Please re-enter your new password.");
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const result = await changePassword(currentPassword, newPassword);

      if (result.error) {
        Alert.alert("Password Change Failed", result.error.message);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Password Changed",
        "Your password has been updated successfully. You can now log in with your new password.",
        [
          { text: "OK", style: "cancel" },
        ],
      );
    } catch (error) {
      console.error("Change password error:", error);

      Alert.alert(
        "Password Change Failed",
        toMessage(error, "Unable to change your password right now."),
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.logo}>VisionFit</Text>

          <Text style={styles.title}>Password Changed</Text>

          <Text style={styles.subtitle}>
            Your password has been updated successfully.
          </Text>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Back to Settings</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          keyboardInset > 0 ? { paddingBottom: keyboardInset + 24 } : null,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>VisionFit</Text>

        <Text style={styles.title}>Change Password</Text>

        <Text style={styles.subtitle}>
          Update your account password for {user?.email || "your account"}.
        </Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Current password"
            secureTextEntry={!showCurrentPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowCurrentPassword((value) => !value)}
            hitSlop={8}
          >
            <Ionicons
              name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#555555"
            />
          </Pressable>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="New password"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowNewPassword((value) => !value)}
            hitSlop={8}
          >
            <Ionicons
              name={showNewPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#555555"
            />
          </Pressable>
        </View>

        <View style={styles.checklist}>
          {passwordRules(newPassword).map((rule) => (
            <View key={rule.label} style={styles.ruleRow}>
              <Ionicons
                name={rule.ok ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={rule.ok ? "#16A34A" : "#999999"}
              />

              <Text
                style={[
                  styles.ruleText,
                  { color: rule.ok ? "#16A34A" : "#999999" },
                ]}
              >
                {rule.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm new password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((value) => !value)}
            hitSlop={8}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#555555"
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.loginLink}>Back to Settings</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 48,
  },

  logo: {
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#555555",
    marginBottom: 30,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingLeft: 16,
    paddingRight: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
  },

  eyeButton: {
    paddingLeft: 10,
  },

  checklist: {
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 4,
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ruleText: {
    fontSize: 13,
  },

  button: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  secondaryButton: {
    marginTop: 24,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loginLink: {
    textAlign: "center",
    fontSize: 14,
    color: "#1D4ED8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
