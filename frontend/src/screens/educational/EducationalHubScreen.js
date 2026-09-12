import React from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const LESSONS = [
  {
    id: "face-shapes",
    title: "Face Shapes & Frames",
    description:
      "Learn how different face shapes can be paired with different eyewear frame styles.",
    icon: "◯",
    sections: [
      {
        title: "Why face shape matters",
        text: "Face shape can be used as a guide when exploring eyewear styles. VisionFit uses your face-scan result to help recommend compatible frame shapes.",
      },
      {
        title: "Using VisionFit",
        text: "Start with Face Scan, review your detected face shape, then explore the recommended frames presented by VisionFit.",
      },
    ],
  },

  {
    id: "lens-types",
    title: "Lens Types",
    description:
      "Understand the main lens options available when configuring eyewear.",
    icon: "◉",
    sections: [
      {
        title: "Frame only",
        text: "FRAME ONLY is intended for customers who are purchasing the frame without adding a lens option.",
      },
      {
        title: "VisionFit lens options",
        text: "Depending on the product configuration, VisionFit may provide options such as standard, thin, progressive, photochromic, blue-light, transitions, and driving lenses.",
      },
    ],
  },

  {
    id: "lens-coatings",
    title: "Lens Coatings",
    description:
      "Learn about the coating options available during eyewear selection.",
    icon: "◇",
    sections: [
      {
        title: "Coating choices",
        text: "Available coating options in VisionFit include anti-reflective, super-hydrophobic, UV protection, and scratch-resistant coatings.",
      },
      {
        title: "Choosing a coating",
        text: "Review the available options for your selected product and choose the coating that matches your intended configuration.",
      },
    ],
  },

  {
    id: "prescription",
    title: "Prescription Basics",
    description:
      "Understand how prescription information is used when selecting eyewear.",
    icon: "+",
    sections: [
      {
        title: "Your prescription",
        text: "Prescription information can be stored in VisionFit and associated with eyewear configurations during checkout.",
      },
      {
        title: "Check your information",
        text: "Review your prescription details carefully before completing an order and make sure the information entered into the application is correct.",
      },
    ],
  },

  {
    id: "virtual-try-on",
    title: "Virtual Try-On Guide",
    description:
      "Learn how VisionFit's Virtual Try-On works and how to get a better preview.",
    icon: "⌁",
    sections: [
      {
        title: "Step 1 — Take a photo",
        text: "Use a clear, front-facing photo with your entire face visible.",
      },
      {
        title: "Step 2 — Choose a frame",
        text: "Select a supported frame from your recommendations or product options.",
      },
      {
        title: "Step 3 — Preview",
        text: "VisionFit analyzes facial geometry and positions the selected frame over your photo to create a visual styling preview.",
      },
      {
        title: "Important note",
        text: "Virtual Try-On is a visual styling preview. Frame size and positioning are estimated and may not represent the exact physical fit.",
      },
    ],
  },
];

export default function EducationalHubScreen({ navigation }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>VISIONFIT LEARN</Text>

        <Text style={styles.title}>Educational Hub</Text>

        <Text style={styles.subtitle}>
          Learn more about eyewear, prescriptions, and VisionFit features.
        </Text>
      </View>

      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Make a more informed choice</Text>

        <Text style={styles.introText}>
          Explore these guides before selecting your next pair of eyewear.
        </Text>
      </View>

      <View style={styles.lessonList}>
        {LESSONS.map((lesson) => (
          <Pressable
            key={lesson.id}
            style={({ pressed }) => [
              styles.lessonCard,
              pressed && styles.lessonPressed,
            ]}
            onPress={() =>
              navigation.navigate("EducationalLesson", {
                lesson,
              })
            }
          >
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{lesson.icon}</Text>
            </View>

            <View style={styles.lessonContent}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>

              <Text style={styles.lessonDescription}>{lesson.description}</Text>

              <Text style={styles.readText}>Read guide ›</Text>
            </View>
          </Pressable>
        ))}
      </View>
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

  header: {
    marginBottom: 18,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#777777",
    marginBottom: 7,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111111",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6F6F",
  },

  introCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#111111",
    marginBottom: 16,
  },

  introTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  introText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#D8D8D8",
  },

  lessonList: {
    gap: 12,
  },

  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  lessonPressed: {
    opacity: 0.75,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  iconText: {
    fontSize: 24,
    color: "#111111",
    fontWeight: "700",
  },

  lessonContent: {
    flex: 1,
  },

  lessonTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
  },

  lessonDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#777777",
  },

  readText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#111111",
  },
});
