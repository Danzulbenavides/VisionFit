import React, { useCallback, useState } from "react";

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { getOrders } from "../../api/orders";
import NotificationBell from "../../components/NotificationBell";

const INITIAL_COLORS = ['#6C3BC6', '#315B4A', '#B45A3C', '#2D5F8A', '#8B6B2E'];

const MENU = [
  {
    icon: 'location-outline',
    label: 'Addresses',
    subtitle: 'Manage your shipping addresses',
    route: 'Addresses',
  },
  {
    icon: 'star-outline',
    label: 'Saved Products',
    subtitle: 'Your bookmarked items',
    route: 'Favorites',
  },
  {
    icon: 'receipt-outline',
    label: 'Receipts',
    subtitle: 'View your purchase receipts',
    route: 'Orders',
  },
  {
    icon: 'document-text-outline',
    label: 'Terms & Conditions',
    subtitle: 'Read our terms and conditions',
    route: 'TermsAndConditions',
  },
  {
    icon: 'help-circle-outline',
    label: 'Help Center',
    subtitle: 'FAQs and support',
    route: 'HelpCenter',
  },
];

const ORDER_CATEGORIES = [
  { icon: 'receipt-outline', label: 'Unpaid', color: '#EF4444', key: 'unpaid' },
  { icon: 'time-outline', label: 'Processing', color: '#3B82F6', key: 'processing' },
  { icon: 'car-outline', label: 'Shipped', color: '#F59E0B', key: 'shipped' },
  { icon: 'cube-outline', label: 'Delivery', color: '#10B981', key: 'delivery' },
];

function getInitials(firstName, lastName) {
  const f = (firstName || '').charAt(0).toUpperCase();
  const l = (lastName || '').charAt(0).toUpperCase();
  return f + l || 'U';
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

function InitialsAvatar({ firstName, lastName, size = 55 }) {
  const name = `${firstName || ''}${lastName || ''}`;
  const bg = getAvatarColor(name);
  const initials = getInitials(firstName, lastName);
  return (
    <View style={[initialsAvatar.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[initialsAvatar.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const initialsAvatar = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#111' },
  text: { color: '#fff', fontWeight: '800' },
});

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const counts = React.useMemo(() => {
    const tally = {
      unpaid: 0,
      processing: 0,
      shipped: 0,
      delivery: 0,
    };

    orders.forEach((order) => {
      if (order.paymentStatus === 'PENDING') {
        tally.unpaid += 1;
      }
      if (order.orderStatus === 'PROCESSING') {
        tally.processing += 1;
      }
      if (order.orderStatus === 'SHIPPED') {
        tally.shipped += 1;
      }
      if (order.orderStatus === 'DELIVERED') {
        tally.delivery += 1;
      }
    });

    return tally;
  }, [orders]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getOrders();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setOrders(result.data || []);
    } catch (err) {
      console.error("Load orders error:", err);
      setError(err.response?.data?.error?.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Are you sure you want to sign out of VisionFit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    : 'User';

  const showCounts = !loading;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Profile</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NotificationBell />
            <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
              <Ionicons name="settings-outline" size={21} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.user}>
          <InitialsAvatar firstName={user?.firstName} lastName={user?.lastName} />
          <View style={s.userText}>
            <Text style={s.name}>{displayName}</Text>
            <Text style={s.email}>{user?.email || ''}</Text>
            <Text style={s.role}>{user?.role || ''}</Text>
          </View>
        </View>

        <View style={s.orders}>
          <View style={s.ordersHead}>
            <Text style={s.ordersTitle}>My orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={s.all}>All orders</Text>
            </TouchableOpacity>
          </View>
          <View style={s.orderRow}>
            {ORDER_CATEGORIES.map((category) => (
              <TouchableOpacity
                style={s.order}
                key={category.key}
                onPress={() => navigation.navigate("Orders", { filter: category.key })}
              >
                <Ionicons name={category.icon} size={22} color={category.color} />
                <Text style={s.orderLabel}>{category.label}</Text>
                {showCounts ? (
                  <Text style={s.orderCount}>{counts[category.key]}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.menuCard}>
          {MENU.map((item, index) => (
            <React.Fragment key={item.label}>
            <TouchableOpacity
              style={s.menuRow}
              key={item.label}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={s.menuIcon}>
                <Ionicons name={item.icon} size={21} />
              </View>
              <View style={s.menuBody}>
                <Text style={s.menuTitle}>{item.label}</Text>
                <Text style={s.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#888" />
            </TouchableOpacity>
            {index < MENU.length - 1 ? <View style={s.menuDivider} /> : null}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={s.banner} onPress={() => navigation.navigate('Prescriptions')}>
          <View style={s.bannerText}>
            <Text style={s.bannerLabel}>YOUR EYEWEAR PROFILE</Text>
            <Text style={s.bannerTitle}>Complete your profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#6C507B" />
        </TouchableOpacity>

        <TouchableOpacity style={s.signOut} onPress={confirmSignOut}>
          <Ionicons name="log-out-outline" size={19} color="#9B4DCA" />
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { padding: 16, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  user: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  userText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '900' },
  email: { fontSize: 11, color: '#888', marginTop: 2 },
  role: { fontSize: 11, color: '#6C6C6C', marginTop: 4 },
  orders: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 15,
    marginBottom: 16,
  },
  ordersHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ordersTitle: { fontSize: 15, fontWeight: '900' },
  all: { fontSize: 11, color: '#565656' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  order: { alignItems: 'center', width: '24%', gap: 6 },
  orderLabel: { fontSize: 11, fontWeight: '800' },
  orderCount: { fontSize: 12, fontWeight: '900', marginTop: 2 },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 13,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  menuIcon: { width: 28, alignItems: 'center' },
  menuBody: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '700' },
  menuSubtitle: { fontSize: 11, color: '#888', marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: '#ECECEC', marginLeft: 40 },
  banner: {
    backgroundColor: '#E8DDF2',
    borderRadius: 13,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: { flex: 1 },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#6C507B',
    textTransform: 'uppercase',
  },
  bannerTitle: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  signOut: {
    marginTop: 16,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5C8CC',
    backgroundColor: '#FFF7F7',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontSize: 13, fontWeight: '700', color: '#9B4DCA' },
});
