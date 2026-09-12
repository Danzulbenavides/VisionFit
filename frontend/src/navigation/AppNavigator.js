import React from "react";

import { NavigationContainer } from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

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
import RecommendationsScreen from "../screens/recommendations/RecommendationsScreen";

import VirtualTryOnScreen from "../screens/VirtualTryOnScreen";

import EducationalHubScreen from "../screens/educational/EducationalHubScreen";
import EducationalLessonScreen from "../screens/educational/EducationalLessonScreen";

import { useAuth } from "../context/AuthContext";

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
    </Stack.Navigator>
  );
}

function MainTabs() {
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
        }}
      />

      <Tab.Screen
        name="Shop"
        component={ProductListScreen}
        options={{
          tabBarLabel: "Shop",
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: "Favorites",
        }}
      />

      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: "Cart",
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
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
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
