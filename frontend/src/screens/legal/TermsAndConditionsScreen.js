import React from "react";

import { ScrollView, StyleSheet, Text, View } from "react-native";

const LAST_UPDATED = "October 19, 2026";

const SECTIONS = [
  {
    heading: "1. Acceptance of Terms",
    paragraphs: [
      "By creating an account, logging in, or using the VisionFit mobile application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the application.",
    ],
  },
  {
    heading: "2. Your Account",
    paragraphs: [
      "You agree to provide accurate, current, and complete information during registration and to keep your login credentials confidential. You are responsible for all activity that occurs under your account.",
      "You must be at least 18 years old, or have the consent of a parent or legal guardian, to create an account and place orders.",
    ],
  },
  {
    heading: "3. Products & Orders",
    paragraphs: [
      "VisionFit sells eyewear frames, lenses, and related accessories. Prices are shown in Philippine Pesos (₱) and may change without notice. Lens type and coating options may carry additional charges, which are shown before you add an item to your cart.",
      "All orders are subject to acceptance and product availability. We reserve the right to cancel or refuse any order for reasons including product availability, pricing errors, or suspected fraud.",
    ],
  },
  {
    heading: "4. Prescriptions & Eye Health",
    paragraphs: [
      "Information provided in the application — including face scan results, frame recommendations, and educational content — is for general guidance only and is NOT medical advice.",
      "You should have your eyes examined by a licensed optometrist or ophthalmologist and obtain a valid prescription before purchasing prescription lenses. VisionFit does not verify prescriptions and is not responsible for incorrect prescription values entered by you.",
    ],
  },
  {
    heading: "5. Payments",
    paragraphs: [
      "Orders may be paid through cash on delivery, e-wallet, or card. Online card and e-wallet payments are processed by our payment provider, PayMongo. Payment must be completed before an order is processed, unless cash on delivery is selected.",
    ],
  },
  {
    heading: "6. Shipping & Delivery",
    paragraphs: [
      "A shipping fee is applied at checkout. Delivery timelines depend on your location and are provided as estimates. Risk of loss passes to you upon delivery of the order.",
    ],
  },
  {
    heading: "7. Virtual Try-On & Face Scan",
    paragraphs: [
      "Face scan images and measurements are used only to generate your face-shape result and frame recommendations. By using the Virtual Try-On and Face Scan features, you consent to the processing of your scan data for these purposes. You may remove your saved scans at any time from the face scan history screen.",
    ],
  },
  {
    heading: "8. User Conduct",
    paragraphs: [
      "You agree not to misuse the application, including attempting to gain unauthorized access to systems, interfering with normal operation, or using the application for any unlawful purpose.",
    ],
  },
  {
    heading: "9. Intellectual Property",
    paragraphs: [
      "The VisionFit name, logo, application design, and all related content are owned by VisionFit and are protected by applicable intellectual property laws. You may not copy, modify, or distribute any part of the application without prior written permission.",
    ],
  },
  {
    heading: "10. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, VisionFit shall not be liable for any indirect, incidental, or consequential damages arising from your use of the application or from products purchased through it. Our total liability for any claim shall not exceed the amount you paid for the order in question.",
    ],
  },
  {
    heading: "11. Changes to These Terms",
    paragraphs: [
      "We may update these Terms and Conditions from time to time. The latest version will always be available in this screen, with the updated date shown above. Continued use of the application after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
  {
    heading: "12. Contact Us",
    paragraphs: [
      "If you have any questions about these Terms and Conditions, please contact the VisionFit support team through the help channels available in the application.",
    ],
  },
];

export default function TermsAndConditionsScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Terms & Conditions</Text>

      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <Text style={styles.intro}>
        Please read these terms carefully before using the VisionFit app.
      </Text>

      <View style={styles.divider} />

      {SECTIONS.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.sectionHeading}>{section.heading}</Text>

          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.sectionText}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: "#111111",
  },

  updated: {
    marginTop: 6,
    fontSize: 12,
    color: "#888888",
  },

  intro: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: "#555555",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E2E2",
    marginVertical: 20,
  },

  section: {
    marginBottom: 22,
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 7,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5F5F5F",
    marginBottom: 6,
  },
});
