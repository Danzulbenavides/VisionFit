import React from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { NavigationContainer } from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";

import HomeScreen from "../screens/home/HomeScreen";
import ProductListScreen from "../screens/products/ProductListScreen";
import FavoritesScreen from "../screens/favorites/FavoritesScreen";
import CartScreen from "../screens/cart/CartScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ProductDetailsScreen from "../screens/products/ProductDetailsScreen";

import PrescriptionListScreen from "../screens/prescriptions/PrescriptionListScreen";
import AddPrescriptionScreen from "../screens/prescriptions/AddPrescriptionScreen";

import CheckoutScreen from "../screens/checkout/CheckoutScreen";
import AddAddressScreen from "../screens/checkout/AddAddressScreen";
import OrderSuccessScreen from "../screens/checkout/OrderSuccessScreen";

import OrdersScreen from "../screens/orders/OrdersScreen";
import OrderDetailsScreen from "../screens/orders/OrderDetailsScreen";

import FaceScanScreen from "../screens/scan/FaceScanScreen";
import FaceScanHistoryScreen from "../screens/scan/FaceScanHistoryScreen";
import RecommendationsScreen from "../screens/recommendations/RecommendationsScreen";

import VirtualTryOnScreen from "../screens/VirtualTryOnScreen";

import EducationalHubScreen from "../screens/educational/EducationalHubScreen";
import EducationalLessonScreen from "../screens/educational/EducationalLessonScreen";

import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import NotificationBanner from "../components/NotificationBanner";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { navigationRef } from "./navigationRef";

const Stack = createNativeStackNavigator();

const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// The Scan tab never shows a screen of its own, tapping it opens the Face Scan
function ScanPlaceholder() {
  return null;
}

// Raised round button in the middle of the tab bar
function ScanTabButton({ onPress }) {
  return (
    <View style={styles.scanWrapper}>
      <Pressable style={styles.scanButton} onPress={onPress}>
        <Ionicons name="scan-outline" size={28} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.scanLabel}>Scan</Text>
    </View>
  );
}

const tabIcon =
  (name) =>
  ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

function MainTabs() {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "#888888",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: tabIcon("home-outline"),
        }}
      />

      <Tab.Screen
        name="Shop"
        component={ProductListScreen}
        options={{
          tabBarLabel: "Shop",
          tabBarIcon: tabIcon("storefront-outline"),
        }}
      />

      <Tab.Screen
        name="Scan"
        component={ScanPlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <ScanTabButton onPress={props.onPress} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate("FaceScan");
          },
        })}
      />

      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: "Cart",
          tabBarIcon: tabIcon("cart-outline"),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: tabIcon("person-outline"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: "Favorites",
        }}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
        }}
      />

      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{
          title: "Product Details",
        }}
      />

      <Stack.Screen
        name="Prescriptions"
        component={PrescriptionListScreen}
        options={{
          title: "My Prescriptions",
        }}
      />

      <Stack.Screen
        name="AddPrescription"
        component={AddPrescriptionScreen}
        options={{
          title: "Add Prescription",
        }}
      />

      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: "Checkout",
        }}
      />

      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{
          title: "Add Address",
        }}
      />

      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: "My Orders",
        }}
      />

      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          title: "Order Details",
        }}
      />

      <Stack.Screen
        name="FaceScan"
        component={FaceScanScreen}
        options={{
          title: "Face Scan",
        }}
      />
      <Stack.Screen
        name="FaceScanHistory"
        component={FaceScanHistoryScreen}
        options={{
          title: "Face Scan History",
        }}
      />

      <Stack.Screen
        name="Recommendations"
        component={RecommendationsScreen}
        options={{
          title: "Recommended Frames",
        }}
      />

      <Stack.Screen
        name="VirtualTryOn"
        component={VirtualTryOnScreen}
        options={{
          title: "Virtual Try-On",
        }}
      />

      <Stack.Screen
        name="EducationalHub"
        component={EducationalHubScreen}
        options={{ title: "Educational Hub" }}
      />

      <Stack.Screen
        name="EducationalLesson"
        component={EducationalLessonScreen}
        options={{ title: "Guide" }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}

      {isAuthenticated ? <NotificationBanner /> : null}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  scanWrapper: {
    flex: 1,
    alignItems: "center",
  },

  scanButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -22,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    elevation: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  scanLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    color: "#111111",
  },
});
