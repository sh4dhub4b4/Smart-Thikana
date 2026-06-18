import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WelcomeScreen } from "@/screens/auth/WelcomeScreen";
import { SignInScreen } from "@/screens/auth/SignInScreen";
import { SignUpScreen } from "@/screens/auth/SignUpScreen";
import { OnboardingScreen } from "@/screens/auth/OnboardingScreen";
import type { AuthStackParamList } from "./types";
import { colors } from "@shared/index";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        headerTitle: "",
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
