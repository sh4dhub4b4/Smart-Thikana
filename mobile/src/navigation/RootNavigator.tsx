import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@shared/index";
import { AuthStack } from "./AuthStack";
import { TenantTabs } from "./TenantTabs";
import { LandlordTabs } from "./LandlordTabs";
import { ListingDetailScreen } from "@/screens/shared/ListingDetailScreen";
import { ChatScreen } from "@/screens/shared/ChatScreen";
import { PaymentScreen } from "@/screens/tenant/PaymentScreen";
import { ReceiptScreen } from "@/screens/shared/ReceiptScreen";
import { KycScreen } from "@/screens/shared/KycScreen";
import { ServicesScreen } from "@/screens/shared/ServicesScreen";
import { FeedbackScreen } from "@/screens/shared/FeedbackScreen";
import { RentalHistoryScreen } from "@/screens/shared/RentalHistoryScreen";
import { SettingsScreen } from "@/screens/shared/SettingsScreen";
import { TenantLookupScreen } from "@/screens/shared/TenantLookupScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const sharedScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.foreground,
  headerTitleStyle: { fontWeight: "600" as const },
  headerShadowVisible: false,
};

export function RootNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthStack} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={sharedScreenOptions}>
          {role === "landlord" ? (
            <Stack.Screen name="LandlordTabs" component={LandlordTabs} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="TenantTabs" component={TenantTabs} options={{ headerShown: false }} />
          )}
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "Listing" }} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ title: "Messages" }} />
          <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ title: "Payment" }} />
          <Stack.Screen name="ReceiptScreen" component={ReceiptScreen} options={{ title: "Receipt" }} />
          <Stack.Screen name="KycScreen" component={KycScreen} options={{ title: "KYC" }} />
          <Stack.Screen name="Services" component={ServicesScreen} options={{ title: "Services" }} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "Feedback" }} />
          <Stack.Screen name="RentalHistory" component={RentalHistoryScreen} options={{ title: "History" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
          <Stack.Screen name="TenantLookup" component={TenantLookupScreen} options={{ title: "Tenant Lookup" }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
