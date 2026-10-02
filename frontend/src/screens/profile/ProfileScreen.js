import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../context/AuthContext";

const ACTIONS = [
  ['card-outline', 'Payment'],
  ['location-outline', 'Addresses'],
  ['star-outline', 'Reviews'],
  ['receipt-outline', 'Receipts'],
  ['document-text-outline', 'Terms & policies'],
  ['help-circle-outline', 'Help center'],
];

const INITIAL_COLORS = ['#6C3BC6', '#315B4A', '#B45A3C', '#2D5F8A', '#8B6B2E'];

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

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Profile</Text>
          <TouchableOpacity onPress={() => Alert.alert('Settings', 'Settings coming soon')}>
            <Ionicons name="settings-outline" size={21} />
          </TouchableOpacity>
        </View>

        <View style={s.user}>
          <InitialsAvatar firstName={user?.firstName} lastName={user?.lastName} />
          <View style={s.userText}>
            <Text style={s.name}>{displayName}</Text>
            <Text style={s.email}>{user?.email || ''}</Text>
            <Text style={s.status}>{user?.role || ''}</Text>
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
            {[
              ['receipt-outline', 'Unpaid'],
              ['time-outline', 'Processing'],
              ['car-outline', 'Shipped'],
              ['cube-outline', 'Delivery'],
            ].map(([icon, label]) => (
              <TouchableOpacity style={s.order} key={label}>
                <Ionicons name={icon} size={25} />
                <Text style={s.orderText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.grid}>
          {ACTIONS.map(([icon, label]) => (
            <TouchableOpacity
              style={s.action}
              key={label}
              onPress={() =>
                label === 'Addresses'
                  ? navigation.navigate('AddAddress')
                  : Alert.alert(label, `${label} feature coming soon`)
              }
            >
              <View style={s.actionIcon}>
                <Ionicons name={icon} size={21} />
              </View>
              <Text style={s.actionText}>{label}</Text>
              <Ionicons name="chevron-forward" size={15} color="#888" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.fitCard}>
          <View>
            <Text style={s.fitEyebrow}>YOUR EYEWEAR PROFILE</Text>
            <Text style={s.fitTitle}>Complete your fit</Text>
            <Text style={s.fitText}>
              Add your prescription and face shape for tailored recommendations.
            </Text>
          </View>
          <TouchableOpacity
            style={s.fitButton}
            onPress={() => navigation.navigate('Prescription')}
          >
            <Text style={s.fitButtonText}>Set up</Text>
          </TouchableOpacity>
        </View>

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
    marginBottom: 17,
  },
  title: { fontSize: 25, fontWeight: '900', letterSpacing: -0.6 },
  user: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '900' },
  email: { fontSize: 11, color: '#888', marginTop: 2 },
  status: { fontSize: 11, color: '#6C6C6C', marginTop: 4 },
  orders: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 15,
    marginTop: 12,
  },
  ordersHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  ordersTitle: { fontSize: 15, fontWeight: '900' },
  all: { fontSize: 11, color: '#565656' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  order: { alignItems: 'center', width: '24%' },
  orderText: { fontSize: 10, marginTop: 6 },
  grid: {
    backgroundColor: '#fff',
    borderRadius: 13,
    marginTop: 12,
    overflow: 'hidden',
  },
  action: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 12,
  },
  actionIcon: { width: 28, alignItems: 'center' },
  actionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  fitCard: {
    backgroundColor: '#E8DDF2',
    borderRadius: 13,
    padding: 17,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fitEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#6C507B',
  },
  fitTitle: { fontSize: 17, fontWeight: '900', marginTop: 4 },
  fitText: {
    fontSize: 11,
    color: '#514E53',
    lineHeight: 15,
    marginTop: 4,
    width: '78%',
  },
  fitButton: {
    position: 'absolute',
    right: 14,
    bottom: 17,
    height: 33,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  fitButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
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
