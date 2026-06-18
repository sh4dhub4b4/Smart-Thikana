import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedInput } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { colors, typography, spacing } from "@shared/index";
import { fetchProfile } from "@shared/api/profiles";
import { Profile } from "@shared/index";

export function TenantLookupScreen() {
  const [userId, setUserId] = useState("");
  const [tenant, setTenant] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!userId.trim()) {
      Alert.alert("Error", "Please enter a user ID");
      return;
    }
    setLoading(true);
    setTenant(null);
    try {
      const profile = await fetchProfile(userId.trim());
      if (profile) {
        setTenant(profile);
      } else {
        Alert.alert("Not Found", "No user found with this ID");
      }
    } catch {
      Alert.alert("Error", "Failed to look up user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground, marginBottom: 4 }}>
          Tenant Lookup
        </Text>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginBottom: 16 }}>
          Search for a tenant by their user ID
        </Text>

        <ThemedInput
          label="User ID"
          value={userId}
          onChangeText={setUserId}
          placeholder="Enter user UUID"
          autoCapitalize="none"
        />

        <ThemedButton onPress={handleLookup} fullWidth loading={loading} style={{ marginBottom: 24 }}>
          Look Up
        </ThemedButton>

        {tenant && (
          <ThemedCard>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Avatar uri={tenant.avatar_url} name={tenant.full_name} size={64} />
              <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginTop: 8 }}>
                {tenant.full_name}
              </Text>
            </View>
            {tenant.phone && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: colors.mutedForeground }}>Phone</Text>
                <Text>{tenant.phone}</Text>
              </View>
            )}
            {tenant.bio && (
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>
                {tenant.bio}
              </Text>
            )}
          </ThemedCard>
        )}
      </View>
    </SafeAreaView>
  );
}
