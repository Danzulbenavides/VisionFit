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
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "../../utils/validators";

// ---------- indicator colors ----------
const COLOR_VALID = "#188038";
const COLOR_INVALID = "#D93025";
const COLOR_BLANK = "#6B6B6B";
const PLACEHOLDER_COLOR = "#8A8A8A";

const STATE_ICON = {
  valid: "checkmark-circle",
  invalid: "close-circle",
  blank: "remove-circle-outline",
};

// Only real, well-known email providers can register.
// Fake/dev domains like @example.com are treated as invalid.
const KNOWN_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.com.ph",
  "ymail.com",
  "outlook.com",
  "outlook.ph",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
];

// ---------- live status helpers ----------
// Every helper returns { state: "blank" | "invalid" | "valid", text }

const nameStatus = (value, label) => {
  if (!value.trim()) {
    return {
      state: "blank",
      text: `Enter your ${label.toLowerCase()} (letters only)`,
    };
  }

  const error = validateName(value, label);

  if (error) return { state: "invalid", text: error };

  return { state: "valid", text: "Looks good" };
};

const emailStatus = (value) => {
  if (!value.trim()) {
    return {
      state: "blank",
      text: "Enter your email address, e.g. name@email.com",
    };
  }

  const error = validateEmail(value);

  if (error) return { state: "invalid", text: error };

  const domain = value.trim().toLowerCase().split("@")[1];

  if (!KNOWN_EMAIL_DOMAINS.includes(domain)) {
    return {
      state: "invalid",
      text: "Invalid email. Use a real email like Gmail, Yahoo, or Outlook.",
    };
  }

  return { state: "valid", text: "Valid email" };
};

const phoneStatus = (value) => {
  const v = value.trim();

  if (!v) {
    return {
      state: "blank",
      text: "Enter your 11-digit mobile number, e.g. 09123456789",
    };
  }

  // "0" and "09" are fine while typing, anything else is not
  if (!"09".startsWith(v.slice(0, 2))) {
    return { state: "invalid", text: "Must start with 09" };
  }

  if (v.length < 11) {
    return { state: "invalid", text: `${v.length}/11 digits` };
  }

  const error = validatePhone(v);

  if (error) return { state: "invalid", text: error };

  return { state: "valid", text: "Valid mobile number" };
};

const passwordStatus = (value) => {
  if (!value) {
    return {
      state: "blank",
      text: "Create a password that meets all the rules below",
    };
  }

  if (validatePassword(value)) {
    return { state: "invalid", text: "Not strong enough yet" };
  }

  return { state: "valid", text: "Strong password" };
};

const confirmStatus = (password, confirm) => {
  if (!confirm) {
    return { state: "blank", text: "Re-enter your password to confirm it" };
  }

  if (validateConfirmPassword(password, confirm)) {
    return { state: "invalid", text: "Passwords do not match" };
  }

  return { state: "valid", text: "Passwords match" };
};

const passwordRules = (value) => [
  { label: "At least 8 characters", ok: value.length >= 8 },
  { label: "Uppercase letter", ok: /[A-Z]/.test(value) },
  { label: "Lowercase letter", ok: /[a-z]/.test(value) },
  { label: "Number", ok: /\d/.test(value) },
  { label: "Special character", ok: /[^A-Za-z0-9]/.test(value) },
];

// ---------- small UI pieces ----------

function Indicator({ status, submitted, tight = false }) {
  // A blank field turns red once the user tries to submit
  const color =
    status.state === "valid"
      ? COLOR_VALID
      : status.state === "invalid"
        ? COLOR_INVALID
        : submitted
          ? COLOR_INVALID
          : COLOR_BLANK;

  return (
    <View style={[styles.indicatorRow, !tight && styles.indicatorSpaced]}>
      <Ionicons name={STATE_ICON[status.state]} size={14} color={color} />

      <Text style={[styles.indicatorText, { color }]}>{status.text}</Text>
    </View>
  );
}

function PasswordChecklist({ value, submitted }) {
  const empty = value.length === 0;

  return (
    <View style={styles.checklist}>
      {passwordRules(value).map((rule) => {
        const color = rule.ok
          ? COLOR_VALID
          : empty
            ? submitted
              ? COLOR_INVALID
              : COLOR_BLANK
            : COLOR_INVALID;

        const icon = rule.ok
          ? "checkmark-circle"
          : empty
            ? "ellipse-outline"
            : "close-circle";

        return (
          <View key={rule.label} style={styles.indicatorRow}>
            <Ionicons name={icon} size={14} color={color} />

            <Text style={[styles.indicatorText, { color }]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const borderFor = (status, submitted) => {
  if (status.state === "valid") return COLOR_VALID;
  if (status.state === "invalid") return COLOR_INVALID;
  if (submitted) return COLOR_INVALID;

  return "#D0D0D0";
};

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

  // Becomes true after the first "Create Account" tap
  const [submitted, setSubmitted] = useState(false);

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

  // Live statuses, recalculated on every keystroke
  const firstNameState = nameStatus(firstName, "First name");
  const lastNameState = nameStatus(lastName, "Last name");
  const emailState = emailStatus(email);
  const phoneState = phoneStatus(phone);
  const passwordState = passwordStatus(password);
  const confirmState = confirmStatus(password, confirmPassword);

  const handleRegister = async () => {
    setSubmitted(true);

    const allStates = [
      firstNameState,
      lastNameState,
      emailState,
      phoneState,
      passwordState,
      confirmState,
    ];

    if (allStates.some((status) => status.state !== "valid")) {
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
      // No console.error here: in Expo it pops a red toast at the bottom.
      // The Alert below already tells the user what went wrong.
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

        {/* First name */}
        <TextInput
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={[
            styles.input,
            { borderColor: borderFor(firstNameState, submitted) },
          ]}
          placeholder="First name"
          autoCapitalize="words"
          maxLength={50}
          value={firstName}
          onChangeText={(value) => setFirstName(filterName(value))}
        />
        <Indicator status={firstNameState} submitted={submitted} />

        {/* Last name */}
        <TextInput
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={[
            styles.input,
            { borderColor: borderFor(lastNameState, submitted) },
          ]}
          placeholder="Last name"
          autoCapitalize="words"
          maxLength={50}
          value={lastName}
          onChangeText={(value) => setLastName(filterName(value))}
        />
        <Indicator status={lastNameState} submitted={submitted} />

        {/* Email */}
        <TextInput
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={[
            styles.input,
            { borderColor: borderFor(emailState, submitted) },
          ]}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <Indicator status={emailState} submitted={submitted} />

        {/* Phone */}
        <TextInput
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={[
            styles.input,
            { borderColor: borderFor(phoneState, submitted) },
          ]}
          placeholder="Phone number"
          keyboardType="number-pad"
          maxLength={11}
          value={phone}
          onChangeText={(value) => setPhone(filterPhone(value))}
        />
        <Indicator status={phoneState} submitted={submitted} />

        {/* Password */}
        <View
          style={[
            styles.passwordContainer,
            { borderColor: borderFor(passwordState, submitted) },
          ]}
        >
          <TextInput
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
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
        <Indicator status={passwordState} submitted={submitted} tight />
        <PasswordChecklist value={password} submitted={submitted} />

        {/* Confirm password */}
        <View
          style={[
            styles.passwordContainer,
            { borderColor: borderFor(confirmState, submitted) },
          ]}
        >
          <TextInput
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={styles.passwordInput}
            placeholder="Confirm password"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
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
        <Indicator status={confirmState} submitted={submitted} />

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
    marginBottom: 6,
    fontSize: 16,
    color: "#111111",
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingLeft: 16,
    paddingRight: 12,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#111111",
  },

  eyeButton: {
    paddingLeft: 10,
  },

  // ---------- indicators ----------
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  indicatorSpaced: {
    marginBottom: 14,
  },

  indicatorText: {
    fontSize: 12,
    marginLeft: 6,
  },

  checklist: {
    marginBottom: 12,
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