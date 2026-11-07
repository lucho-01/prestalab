import React from "react";
import { View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/homeScreen";
import ProfileScreen from "../screens/profileScreen";
import ArticulosScreen from "../screens/articulosScreen";
import ArticleDetailScreen from "../screens/articleDetailScreen";
import LoanRequestScreen from "../screens/loanRequestScreen";
import LoanHistoryScreen from "../screens/loanHistoryScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  animation: "slide_from_right",
};

function TabIcon({ name, focused }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapFocused]}>
      <MaterialCommunityIcons
        name={name}
        size={24}
        color={focused ? "#1F5B3A" : "#4F6355"}
      />
    </View>
  );
}

function HomeTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#F7FBF7",
          borderTopColor: "rgba(37,107,66,0.14)",
          borderTopWidth: 1,
          height: 74 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 8,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Articulos"
        component={ArticulosScreen}
        options={{
          title: "Artículos",
          tabBarAccessibilityLabel: "Artículos",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="layers-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="account-outline" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 54,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapFocused: {
    backgroundColor: "#DDEDE2",
  },
});

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MainTabs" component={HomeTabs} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="LoanRequest" component={LoanRequestScreen} />
      <Stack.Screen name="LoanHistory" component={LoanHistoryScreen} />
    </Stack.Navigator>
  );
}
