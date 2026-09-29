import React, { useState } from "react";

import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useNotifications } from "../../context/NotificationContext";

const timeAgo = (value) => {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
};

export default function NotificationsScreen({ navigation }) {
  const { notifications, unreadCount, refresh, markRead, markAllRead } =
    useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handlePress = (item) => {
    if (!item.isRead) markRead(item._id);

    if (item.data?.orderId) {
      navigation.navigate("OrderDetails", { orderId: item.data.orderId });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </Text>

        <Pressable onPress={markAllRead} disabled={unreadCount === 0}>
          <Text
            style={[styles.markAll, unreadCount === 0 && styles.markAllDisabled]}
          >
            Mark all as read
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={notifications.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <Text style={styles.empty}>You have no notifications yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.item, !item.isRead && styles.itemUnread]}
            onPress={() => handlePress(item)}
          >
            {!item.isRead ? <View style={styles.dot} /> : null}

            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMessage}>{item.message}</Text>
              <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  count: { fontSize: 14, fontWeight: "700" },
  markAll: { fontSize: 13, fontWeight: "700", color: "#1A73E8" },
  markAllDisabled: { color: "#AAAAAA" },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
  empty: { textAlign: "center", color: "#888888", fontSize: 14 },
  item: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  itemUnread: { backgroundColor: "#F2F7FF" },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#1A73E8",
    marginTop: 5,
    marginRight: 10,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: "800", marginBottom: 3 },
  itemMessage: { fontSize: 13, color: "#555555", lineHeight: 19 },
  itemTime: { fontSize: 11, color: "#999999", marginTop: 6 },
});
