import React, { useState } from "react";

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

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
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
        "Account Created",
        "Your account has been created successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.replace("Login"),
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
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>VisionFit</Text>

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>Join VisionFit today</Text>

        <TextInput
          style={styles.input}
          placeholder="First name"
          autoCapitalize="words"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last name"
          autoCapitalize="words"
          value={lastName}
          onChangeText={setLastName}
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
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
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
          <Text style={styles.loginLink}>Already have an account? Log in</Text>
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

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
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
  },
});
