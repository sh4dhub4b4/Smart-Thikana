import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { colors, typography } from "@shared/index";
import { DashboardScreen } from "@/screens/landlord/DashboardScreen";
import { MyListingsScreen } from "@/screens/landlord/MyListingsScreen";
import { MessagesScreen } from "@/screens/shared/MessagesScreen";
import { ProfileScreen } from "@/screens/shared/ProfileScreen";
import type { LandlordTabParamList } from "./types";

const Tab = createBottomTabNavigator<LandlordTabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    DashboardTab: "📊",
    MyListingsTab: "🏘️",
    MessagesTab: "💬",
    ProfileTab: "👤",
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || "•"}
    </Text>
  );
}

export function LandlordTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.accent,
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
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: "Dashboard" }} />
      <Tab.Screen name="MyListingsTab" component={MyListingsScreen} options={{ title: "Listings" }} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} options={{ title: "Messages" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
