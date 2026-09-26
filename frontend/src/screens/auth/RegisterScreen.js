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

import { register } from "../../api/auth";
import useKeyboardInset from "../../hooks/useKeyboardInset";

export default function RegisterScreen({ navigation }) {
  const keyboardInset = useKeyboardInset();

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const filterName = (value) => value.replace(/[^A-Za-z\s-]/g, "");

  const filterPhone = (value) => value.replace(/[^0-9]/g, "");

  const formatName = (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(
        /(^|[\s-])([a-z])/g,
        (_, separator, letter) => `${separator}${letter.toUpperCase()}`,
      );

  const handleRegister = async () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }
    const phoneRegex = /^09\d{9}$/;

    if (!phoneRegex.test(phone.trim())) {
      Alert.alert(
        "Phone Number Error",
        "Please enter a valid 11-digit Philippine mobile number starting with 09.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Error", "Passwords do not match.");

      return;
    }

    const passwordRequirements =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!passwordRequirements) {
      Alert.alert(
        "Password Error",
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.",
      );
      return;
    }

    try {
      setLoading(true);

      const result = await register({
        firstName: formatName(firstName),
        lastName: formatName(lastName),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      if (result.error) {
        Alert.alert("Registration Failed", result.error.message);

        return;
      }

      Alert.alert(
        "Check Your Email",
        "We sent a 6-digit verification code to your email address.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.replace("VerifyEmail", { email: email.trim() }),
          },
        ],
      );
    } catch (error) {
      console.error("Registration error:", error);

      const message =
        error.response?.data?.error?.message ||
        "Unable to connect to the VisionFit server.";

      Alert.alert("Registration Failed", message);
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

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>Join VisionFit today</Text>

        <TextInput
          style={styles.input}
          placeholder="First name"
          autoCapitalize="words"
          value={firstName}
          onChangeText={(value) => setFirstName(filterName(value))}
        />
        <TextInput
          style={styles.input}
          placeholder="Last name"
          autoCapitalize="words"
          value={lastName}
          onChangeText={(value) => setLastName(filterName(value))}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone number"
          keyboardType="number-pad"
          maxLength={11}
          value={phone}
          onChangeText={(value) => setPhone(filterPhone(value))}
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

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm password"
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
        <Text style={styles.passwordHint}>
          Use 8+ characters with uppercase, lowercase, number, and special
          character.
        </Text>

        <Pressable
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}>
            Already have an account? <Text style={styles.loginLinkText}>Log in</Text>
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
    marginBottom: 24,
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
    marginBottom: 28,
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

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loginLink: {
    textAlign: "center",
    fontSize: 14,
    color: "#333333",
  },

  loginLinkText: {
    color: "#1D4ED8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
