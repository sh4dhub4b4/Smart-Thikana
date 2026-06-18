import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import { colors, typography } from "@shared/index";
import { HomeScreen } from "@/screens/tenant/HomeScreen";
import { FavoritesScreen } from "@/screens/tenant/FavoritesScreen";
import { MessagesScreen } from "@/screens/shared/MessagesScreen";
import { ProfileScreen } from "@/screens/shared/ProfileScreen";
import type { TenantTabParamList } from "./types";

const Tab = createBottomTabNavigator<TenantTabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    HomeTab: "🏠",
    FavoritesTab: "❤️",
    MessagesTab: "💬",
    ProfileTab: "👤",
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || "•"}
    </Text>
  );
}

export function TenantTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="FavoritesTab" component={FavoritesScreen} options={{ title: "Saved" }} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} options={{ title: "Messages" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
