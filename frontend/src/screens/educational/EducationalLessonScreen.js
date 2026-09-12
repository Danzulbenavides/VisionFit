import React from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function EducationalLessonScreen({ route, navigation }) {
  const lesson = route?.params?.lesson;

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Lesson unavailable</Text>

        <Pressable style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{lesson.icon}</Text>
      </View>

      <Text style={styles.title}>{lesson.title}</Text>

      <Text style={styles.description}>{lesson.description}</Text>

      <View style={styles.divider} />

      {lesson.sections.map((section, index) => (
        <View key={`${lesson.id}-${index}`} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          <Text style={styles.sectionText}>{section.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 22,
  },

  backText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  iconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "800",
    color: "#111111",
  },

  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#707070",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E2E2",
    marginVertical: 24,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 7,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5F5F5F",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 18,
  },

  button: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
