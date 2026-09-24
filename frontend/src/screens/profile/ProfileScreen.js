import React from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.name}>
        {user?.firstName} {user?.lastName}
      </Text>

      <Text style={styles.email}>{user?.email}</Text>

      <Text style={styles.role}>{user?.role}</Text>

      <Pressable
        style={styles.historyButton}
        onPress={() => navigation.navigate("FaceScanHistory")}
      >
        <Text style={styles.historyButtonText}>Face Scan History</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },

  email: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 6,
  },

  role: {
    fontSize: 13,
    color: "#888888",
    marginBottom: 28,
  },

  historyButton: {
    width: "100%",
    maxWidth: 320,
    height: 50,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  historyButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  logoutButton: {
    width: "100%",
    maxWidth: 320,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
