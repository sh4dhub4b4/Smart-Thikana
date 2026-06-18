import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedInput } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Divider } from "@/components/ui/Divider";
import { colors, typography, spacing } from "@shared/index";
import { fetchProfile, updateProfile } from "@shared/api/profiles";
import { getSupabaseClient } from "@shared/api/client";
import { fetchKyc } from "@shared/api/kyc";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import * as ImagePicker from "expo-image-picker";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, profile, role, signOut, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
    loadKyc();
  }, [profile]);

  const loadKyc = async () => {
    if (!user) return;
    const kyc = await fetchKyc(user.id);
    setKycStatus(kyc?.status || null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { full_name: fullName, phone, bio } as any);
      await refreshProfile();
      Alert.alert("Success", "Profile updated");
    } catch {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && user) {
      try {
        const client = getSupabaseClient();
        const filename = `avatar-${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: filename,
        } as any);
        await client.storage.from("listing-images").upload(`${user.id}/${filename}`, formData, { contentType: "image/jpeg" });
        const { data: urlData } = client.storage.from("listing-images").getPublicUrl(`${user.id}/${filename}`);
        await updateProfile(user.id, { avatar_url: urlData.publicUrl } as any);
        await refreshProfile();
      } catch {
        Alert.alert("Error", "Failed to upload avatar");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={handlePickAvatar}>
            <Avatar uri={profile?.avatar_url} name={fullName || "U"} size={80} />
          </TouchableOpacity>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginTop: 8 }}>
            {fullName || "User"}
          </Text>
          <Badge variant={role === "landlord" ? "destructive" : "default"} style={{ marginTop: 4 }}>
            {role || "No role"}
          </Badge>
        </View>

        <ThemedInput label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <ThemedInput label="Phone" value={phone} onChangeText={setPhone} placeholder="+880 1XXXXXXXXX" keyboardType="phone-pad" />
        <ThemedInput label="Bio" value={bio} onChangeText={setBio} placeholder="About you" multiline numberOfLines={3} />

        <ThemedButton onPress={handleSave} fullWidth loading={saving} style={{ marginBottom: 16 }}>
          Save Profile
        </ThemedButton>

        <Divider />

        <ThemedCard style={{ marginBottom: spacing.sm }}>
          <TouchableOpacity onPress={() => navigation.navigate("KycScreen")} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontWeight: typography.fontWeight.semibold }}>Identity Verification</Text>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>
                {kycStatus ? `Status: ${kycStatus}` : "Verify your identity"}
              </Text>
            </View>
            <Badge variant={kycStatus === "verified" ? "success" : kycStatus === "pending" ? "warning" : "default"}>
              {kycStatus || "Not done"}
            </Badge>
          </TouchableOpacity>
        </ThemedCard>

        <ThemedCard style={{ marginBottom: spacing.sm }}>
          <TouchableOpacity onPress={() => navigation.navigate("Services")} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>Services</Text>
            <Text style={{ color: colors.mutedForeground }}>→</Text>
          </TouchableOpacity>
        </ThemedCard>

        <ThemedCard style={{ marginBottom: spacing.sm }}>
          <TouchableOpacity onPress={() => navigation.navigate("Feedback")} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>Feedback</Text>
            <Text style={{ color: colors.mutedForeground }}>→</Text>
          </TouchableOpacity>
        </ThemedCard>

        <ThemedCard style={{ marginBottom: spacing.sm }}>
          <TouchableOpacity onPress={() => navigation.navigate("RentalHistory")} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>Rental History</Text>
            <Text style={{ color: colors.mutedForeground }}>→</Text>
          </TouchableOpacity>
        </ThemedCard>

        {role === "landlord" && (
          <ThemedCard style={{ marginBottom: spacing.sm }}>
            <TouchableOpacity onPress={() => navigation.navigate("TenantLookup")} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: typography.fontWeight.semibold }}>Tenant Lookup</Text>
              <Text style={{ color: colors.mutedForeground }}>→</Text>
            </TouchableOpacity>
          </ThemedCard>
        )}

        <Divider />

        <ThemedButton onPress={signOut} variant="destructive" fullWidth>
          Sign Out
        </ThemedButton>
      </ScrollView>
    </SafeAreaView>
  );
}
