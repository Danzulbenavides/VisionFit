import React, { useEffect, useRef } from "react";

import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { navigateFromNotification } from "../navigation/navigationRef";
import { useNotifications } from "../context/NotificationContext";

const VISIBLE_MS = 5000;

// Slide-down banner shown while the app is open when a new alert arrives
export default function NotificationBanner() {
  const { banner, dismissBanner, markRead } = useNotifications();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    if (!banner) return undefined;

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -160,
        duration: 200,
        useNativeDriver: true,
      }).start(() => dismissBanner());
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [banner, dismissBanner, translateY]);

  if (!banner) return null;

  const isWarning = banner.type === "LOW_STOCK";

  const handlePress = () => {
    markRead(banner._id);
    dismissBanner();
    navigateFromNotification(banner.data || {});
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        style={[styles.banner, isWarning ? styles.warning : styles.info]}
        onPress={handlePress}
      >
        <Text style={styles.title}>{banner.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {banner.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
    elevation: 20,
  },
  banner: {
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 5,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  info: { borderLeftColor: "#1A73E8" },
  warning: { borderLeftColor: "#F29900" },
  title: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  message: { fontSize: 13, color: "#444444" },
});
