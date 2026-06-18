import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedInput } from "@/components/ui/Input";
import { colors, typography, spacing } from "@shared/index";
import { getSupabaseClient } from "@shared/api/client";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "SignIn">;
type Route = RouteProp<AuthStackParamList, "SignIn">;

export function SignInScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert("Error", error.message);
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) Alert.alert("Error", error.message);
    } catch {
      Alert.alert("Error", "Google sign-in failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.md, justifyContent: "center" }}>
        <Text
          style={{
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.bold,
            color: colors.foreground,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Welcome Back
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.mutedForeground,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Sign in to continue
        </Text>

        <ThemedInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ThemedInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
        />

        <ThemedButton
          onPress={handleSignIn}
          fullWidth
          size="lg"
          loading={loading}
          style={{ marginBottom: 16 }}
        >
          Sign In
        </ThemedButton>

        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginHorizontal: 16 }}>
            OR
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <ThemedButton onPress={handleGoogleSignIn} fullWidth variant="outline" style={{ marginBottom: 24 }}>
          Continue with Google
        </ThemedButton>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>
            Don't have an account?
          </Text>
          <ThemedButton
            onPress={() => navigation.navigate("SignUp", { intendedRole: route.params?.intendedRole })}
            variant="ghost"
            size="sm"
          >
            Sign Up
          </ThemedButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
