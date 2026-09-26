import React, { useEffect, useState } from "react";

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

import { resendVerification, verifyEmail } from "../../api/auth";
import useKeyboardInset from "../../hooks/useKeyboardInset";

const RESEND_SECONDS = 60;

export default function VerifyEmailScreen({ navigation, route }) {
  const keyboardInset = useKeyboardInset();

  const [email, setEmail] = useState(route?.params?.email || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    if (code.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyEmail(email.trim(), code);

      if (result.error) {
        Alert.alert("Verification Failed", result.error.message);
        return;
      }

      Alert.alert(
        "Email Verified",
        "Your account is verified. Please log in to continue.",
        [
          {
            text: "Go to Log In",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Login", params: { email: email.trim() } }],
              }),
          },
        ],
      );
    } catch (error) {
      console.error("Verification error:", error);

      Alert.alert(
        "Verification Failed",
        error.message || "Unable to verify your email right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    if (cooldown > 0) {
      return;
    }

    try {
      setResendLoading(true);

      const result = await resendVerification(email.trim());

      if (result.error) {
        Alert.alert("Could Not Resend", result.error.message);
        return;
      }

      setCode("");
      setCooldown(RESEND_SECONDS);

      Alert.alert("Code Sent", "A new verification code was sent to your email.");
    } catch (error) {
      console.error("Resend error:", error);

      Alert.alert(
        "Could Not Resend",
        error.message || "Unable to resend the code right now.",
      );
    } finally {
      setResendLoading(false);
    }
  };

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

      <Text style={styles.title}>Verify Your Email</Text>

      <Text style={styles.subtitle}>
        Enter the 6-digit code we sent to {email || "your email"}.
      </Text>

      {!route?.params?.email && (
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
      )}

      <TextInput
        style={styles.codeInput}
        placeholder="------"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ""))}
        textAlign="center"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Verify Account</Text>
        )}
      </Pressable>

      <Pressable onPress={handleResend} disabled={cooldown > 0 || resendLoading}>
        <Text style={[styles.resend, cooldown > 0 && styles.resendDisabled]}>
          {resendLoading
            ? "Sending..."
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </Text>
      </Pressable>

      <Pressable onPress={() => navigation.replace("Login")}>
        <Text style={styles.loginLink}>Back to Log In</Text>
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

  codeInput: {
    height: 60,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 10,
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

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  resend: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
    color: "#111111",
  },

  resendDisabled: {
    color: "#999999",
  },

  loginLink: {
    textAlign: "center",
    fontSize: 14,
    color: "#1D4ED8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
