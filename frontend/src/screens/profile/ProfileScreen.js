import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getOrders } from "../../api/orders";
import NotificationBell from "../../components/NotificationBell";

const ACTIONS = [
  ["key-outline", "Reset Password", "ResetPassword"],
  ["location-outline", "Addresses", "AddAddress"],
  ["heart-outline", "Favorites", "Favorites"],
  ["receipt-outline", "Receipts", "Receipts"],
  ["document-text-outline", "Terms & Conditions", "TermsAndConditions"],
];

const ORDER_FILTERS = [
  ["receipt-outline", "Unpaid", "UNPAID"],
  ["time-outline", "Processing", "PROCESSING"],
  ["car-outline", "Shipped", "SHIPPED"],
  ["cube-outline", "Delivery", "DELIVERY"],
];

const INITIAL_COLORS = ["#6C3BC6", "#315B4A", "#B45A3C", "#2D5F8A", "#8B6B2E"];

function getInitials(firstName, lastName) {
  const f = (firstName || "").charAt(0).toUpperCase();
  const l = (lastName || "").charAt(0).toUpperCase();
  return f + l || "U";
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

function InitialsAvatar({ firstName, lastName, size = 55 }) {
  const name = `${firstName || ""}${lastName || ""}`;
  const bg = getAvatarColor(name);
  const initials = getInitials(firstName, lastName);
  return (
    <View
      style={[
        initialsAvatar.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[initialsAvatar.text, { fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}

const initialsAvatar = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#111",
  },
  text: { color: "#fff", fontWeight: "800" },
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
      if (order.paymentStatus === "PENDING") {
        tally.unpaid += 1;
      }
      if (order.orderStatus === "PROCESSING") {
        tally.processing += 1;
      }
      if (order.orderStatus === "SHIPPED") {
        tally.shipped += 1;
      }
      if (order.orderStatus === "DELIVERED") {
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
      setError(
        err.response?.data?.error?.message || "Unable to load your orders.",
      );
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
    Alert.alert(
      "Sign out?",
      "Are you sure you want to sign out of VisionFit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"
    : "User";

  const openAction = (routeName) => {
    if (routeName === "ResetPassword") {
      navigation.navigate("ResetPassword", {
        fromProfile: true,
        email: user?.email || "",
      });
      return;
    }

    navigation.navigate(routeName);
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Profile</Text>
          <NotificationBell />
        </View>

        <View style={s.user}>
          <InitialsAvatar
            firstName={user?.firstName}
            lastName={user?.lastName}
          />
          <View style={s.userText}>
            <Text style={s.name}>{displayName}</Text>
            <Text style={s.email}>{user?.email || ""}</Text>
            <Text style={s.status}>{user?.role || ""}</Text>
          </View>
        </View>

        <View style={s.orders}>
          <View style={s.ordersHead}>
            <Text style={s.ordersTitle}>My orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
              <Text style={s.all}>All orders</Text>
            </TouchableOpacity>
          </View>
          <View style={s.orderRow}>
            {ORDER_FILTERS.map(([icon, label, statusFilter]) => (
              <TouchableOpacity
                style={s.order}
                key={label}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Orders", { statusFilter })}
                accessibilityRole="button"
                accessibilityLabel={`View ${label.toLowerCase()} orders`}
              >
                <Ionicons name={icon} size={25} />
                <Text style={s.orderText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.grid}>
          {ACTIONS.map(([icon, label, routeName], index) => (
            <React.Fragment key={label}>
              <TouchableOpacity
                style={s.action}
                activeOpacity={0.7}
                onPress={() => openAction(routeName)}
              >
                <View style={s.actionIcon}>
                  <Ionicons name={icon} size={21} />
                </View>
                <Ionicons name="chevron-forward" size={15} color="#888" />
              </TouchableOpacity>

              {index < ACTIONS.length - 1 ? (
                <View style={s.menuDivider} />
              ) : null}
            </React.Fragment>
          ))}
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
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { padding: 16, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  title: { fontSize: 25, fontWeight: "900", letterSpacing: -0.6 },
  user: {
    backgroundColor: "#fff",
    borderRadius: 13,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  userText: { flex: 1 },
  name: { fontSize: 16, fontWeight: "900" },
  email: { fontSize: 11, color: "#888", marginTop: 2 },
  status: { fontSize: 11, color: "#6C6C6C", marginTop: 4 },
  orders: {
    backgroundColor: "#fff",
    borderRadius: 13,
    padding: 15,
    marginBottom: 16,
  },
  ordersHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  ordersTitle: { fontSize: 15, fontWeight: "900" },
  all: { fontSize: 11, color: "#565656" },
  orderRow: { flexDirection: "row", justifyContent: "space-between" },
  order: { alignItems: "center", width: "24%", paddingVertical: 4 },
  orderText: { fontSize: 10, marginTop: 6 },
  grid: {
    backgroundColor: "#fff",
    borderRadius: 13,
    marginTop: 12,
    overflow: "hidden",
  },
  action: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 12,
  },
  actionIcon: { width: 28, alignItems: "center" },
  actionText: { flex: 1, fontSize: 13, fontWeight: "600" },
  signOut: {
    marginTop: 16,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5C8CC",
    backgroundColor: "#FFF7F7",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: { fontSize: 13, fontWeight: "700", color: "#9B4DCA" },
});
