import React, { useEffect, useState } from "react";

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

import {
  forgotPassword,
  resetPassword,
  verifyResetCode,
} from "../../api/auth";
import useKeyboardInset from "../../hooks/useKeyboardInset";

const RESEND_SECONDS = 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRules = (value) => [
  { label: "At least 8 characters", ok: value.length >= 8 },
  { label: "Uppercase letter", ok: /[A-Z]/.test(value) },
  { label: "Lowercase letter", ok: /[a-z]/.test(value) },
  { label: "Number", ok: /\d/.test(value) },
  { label: "Special character", ok: /[^A-Za-z0-9]/.test(value) },
];

const toMessage = (error, fallback) =>
  error.response?.data?.error?.message || error.message || fallback;

export default function ForgotPasswordScreen({ navigation }) {
  const keyboardInset = useKeyboardInset();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const result = await forgotPassword(email.trim());

      if (result.error) {
        Alert.alert("Could Not Send Code", result.error.message);
        return;
      }

      setCode("");
      setStep("code");
      setCooldown(RESEND_SECONDS);

      Alert.alert(
        "Code Sent",
        `A 6-digit reset code was sent to ${email.trim()}.`,
      );
    } catch (error) {
      console.error("Forgot password error:", error);

      Alert.alert(
        "Could Not Send Code",
        toMessage(error, "Unable to connect to the VisionFit server."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    if (code.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyResetCode(email.trim(), code);

      if (result.error) {
        Alert.alert("Incorrect Code", result.error.message);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setStep("password");
    } catch (error) {
      console.error("Verify reset code error:", error);

      Alert.alert(
        "Incorrect Code",
        toMessage(error, "Unable to verify the code right now."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) {
      return;
    }

    try {
      setResendLoading(true);

      const result = await forgotPassword(email.trim());

      if (result.error) {
        Alert.alert("Could Not Resend", result.error.message);
        return;
      }

      setCode("");
      setCooldown(RESEND_SECONDS);

      Alert.alert("Code Sent", "A new reset code was sent to your email.");
    } catch (error) {
      console.error("Resend error:", error);

      Alert.alert(
        "Could Not Resend",
        toMessage(error, "Unable to resend the code right now."),
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const rulesOk = passwordRules(password).every((rule) => rule.ok);

    if (!rulesOk) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords Do Not Match", "Please re-enter your password.");
      return;
    }

    try {
      setLoading(true);

      const result = await resetPassword(email.trim(), code, password);

      if (result.error) {
        Alert.alert("Password Reset Failed", result.error.message);
        return;
      }

      Alert.alert(
        "Password Reset",
        "Your password was changed. Please log in with your new password.",
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
      console.error("Reset password error:", error);

      Alert.alert(
        "Password Reset Failed",
        toMessage(error, "Unable to reset your password right now."),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.title}>Forgot Password</Text>

      <Text style={styles.subtitle}>
        Enter the email you used to create your VisionFit account.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send Code</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.replace("Login")}>
        <Text style={styles.loginLink}>Back to Log In</Text>
      </Pressable>
    </>
  );

  const renderCodeStep = () => (
    <>
      <Text style={styles.title}>Enter Reset Code</Text>

      <Text style={styles.subtitle}>
        Enter the 6-digit code we sent to {email}.
      </Text>

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
        onPress={handleConfirmCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Confirm Code</Text>
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

      <Pressable
        onPress={() => {
          setStep("email");
          setCode("");
        }}
      >
        <Text style={styles.secondaryLink}>Change email</Text>
      </Pressable>

      <Pressable onPress={() => navigation.replace("Login")}>
        <Text style={styles.loginLink}>Back to Log In</Text>
      </Pressable>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <Text style={styles.title}>Create New Password</Text>

      <Text style={styles.subtitle}>Choose a strong password for {email}.</Text>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="New password"
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

      <View style={styles.checklist}>
        {passwordRules(password).map((rule) => (
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
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.replace("Login")}>
        <Text style={styles.loginLink}>Back to Log In</Text>
      </Pressable>
    </>
  );

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

        {step === "email" && renderEmailStep()}

        {step === "code" && renderCodeStep()}

        {step === "password" && renderPasswordStep()}
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

  secondaryLink: {
    textAlign: "center",
    fontSize: 14,
    color: "#1D4ED8",
    fontWeight: "600",
    textDecorationLine: "underline",
    marginBottom: 16,
  },

  loginLink: {
    textAlign: "center",
    fontSize: 14,
    color: "#1D4ED8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
