import React from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome to</Text>

          <Text style={styles.logo}>VisionFit</Text>
        </View>

        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.iconText}>👤</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find frames that fit you.</Text>

        <Text style={styles.heroText}>
          Discover eyewear based on your face shape, prescription, and personal
          style.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Shop")}
        >
          <Text style={styles.primaryButtonText}>Shop Eyewear</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Personalized for You</Text>

      <View style={styles.featureRow}>
        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("FaceScan")}
        >
          <Text style={styles.featureIcon}>◉</Text>

          <Text style={styles.featureTitle}>Face Scan</Text>

          <Text style={styles.featureText}>Discover your face shape.</Text>
        </Pressable>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("Recommendations")}
        >
          <Text style={styles.featureIcon}>★</Text>

          <Text style={styles.featureTitle}>Recommendations</Text>

          <Text style={styles.featureText}>Find frames selected for you.</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Your Eyewear</Text>

      <Pressable
        style={styles.listCard}
        onPress={() => navigation.navigate("Prescriptions")}
      >
        <View>
          <Text style={styles.listTitle}>Prescription</Text>

          <Text style={styles.listText}>Manage your eye grade details.</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.listCard}
        onPress={() => navigation.navigate("Orders")}
      >
        <View>
          <Text style={styles.listTitle}>Orders</Text>

          <Text style={styles.listText}>Track your eyewear purchases.</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>VisionFit Guides</Text>

        <Text style={styles.guideText}>
          Learn about prescriptions, lens coatings, and choosing the right
          eyewear.
        </Text>

        <Pressable onPress={() => navigation.navigate("EducationalHub")}>
          <Text style={styles.guideLink}>Explore guides</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  welcome: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },

  logo: {
    fontSize: 30,
    fontWeight: "800",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
  },

  iconText: {
    fontSize: 18,
  },

  hero: {
    backgroundColor: "#F3F3F3",
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },

  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    marginBottom: 20,
  },

  primaryButton: {
    backgroundColor: "#111111",
    minHeight: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

  featureRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },

  featureCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 16,
    padding: 18,
  },

  featureIcon: {
    fontSize: 22,
    marginBottom: 12,
  },

  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 7,
  },

  featureText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#666666",
  },

  listCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  listText: {
    fontSize: 13,
    color: "#666666",
  },

  arrow: {
    fontSize: 28,
    color: "#777777",
  },

  guideCard: {
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
  },

  guideTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  guideText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666666",
    marginBottom: 12,
  },

  guideLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
