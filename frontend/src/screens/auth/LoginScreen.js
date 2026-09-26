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
import useKeyboardInset from "../../hooks/useKeyboardInset";

export default function LoginScreen({ navigation, route }) {
  const keyboardInset = useKeyboardInset();

  const [email, setEmail] = useState(route?.params?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (email.trim() === "" || password === "") {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password.",
      );

      return;
    }

    try {
      setLoading(true);

      await login(email.trim(), password);
    } catch (error) {
      console.error("Login error:", error);

      const serverError = error.response?.data?.error;

      if (serverError?.requiresVerification) {
        Alert.alert("Email Not Verified", serverError.message, [
          {
            text: "Verify Now",
            onPress: () =>
              navigation.navigate("VerifyEmail", {
                email: serverError.email || email.trim(),
              }),
          },
          { text: "Cancel", style: "cancel" },
        ]);

        return;
      }

      Alert.alert(
        "Login Failed",
        error.message || "Unable to connect to the VisionFit server.",
      );
    } finally {
      setLoading(false);
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

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((value) => !value)}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#555555"
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.register}>
            Don't have an account?{" "}
            <Text style={styles.registerLink}>Register</Text>
          </Text>
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
    marginBottom: 16,
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

  register: {
    textAlign: "center",
    fontSize: 14,
    color: "#333333",
  },

  registerLink: {
    color: "#1D4ED8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
