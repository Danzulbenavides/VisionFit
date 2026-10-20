import React from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const FAQS = [
  {
    id: "orders",
    question: "How do I track my orders?",
    answer:
      "Go to Receipts in your Profile to view your order history. Each order shows its status, items, and total. Tap an order to see its details.",
  },
  {
    id: "addresses",
    question: "How do I manage my shipping addresses?",
    answer:
      "Open Addresses in your Profile to view your saved shipping addresses and add new ones. Your default address is used at checkout unless you choose another.",
  },
  {
    id: "saved-products",
    question: "Where are my saved products?",
    answer:
      "Saved Products lists your bookmarked frames. Tap any saved item to open its product page, or remove it from your favorites at any time.",
  },
  {
    id: "prescriptions",
    question: "How do I complete my eyewear profile?",
    answer:
      "Your eyewear profile lets you save your prescription and face shape for tailored frame recommendations. Add or update your prescription from the Profile banner.",
  },
  {
    id: "payments",
    question: "How can I pay for an order?",
    answer:
      "VisionFit accepts cash on delivery, e-wallet, and card payments. The available options are shown before you place your order.",
  },
  {
    id: "support",
    question: "How do I contact support?",
    answer:
      "If you have any questions not covered here, reach out to the VisionFit support team through the contact options in the app.",
  },
];

export default function HelpCenterScreen({ navigation }) {
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Text style={s.eyebrow}>VISIONFIT SUPPORT</Text>
        <Text style={s.title}>Help Center</Text>
        <Text style={s.subtitle}>
          Frequently asked questions about using VisionFit.
        </Text>
      </View>

      <View style={s.list}>
        {FAQS.map((faq) => (
          <Pressable
            key={faq.id}
            style={({ pressed }) => [s.card, pressed && s.cardPressed]}
          >
            <Text style={s.question}>{faq.question}</Text>
            <Text style={s.answer}>{faq.answer}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 22,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#777777",
    marginBottom: 7,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111111",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6F6F",
  },

  list: {
    gap: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 14,
    padding: 16,
  },

  cardPressed: {
    opacity: 0.9,
  },

  question: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 6,
  },

  answer: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5F5F5F",
  },
});
