import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedInput } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { colors, typography, spacing } from "@shared/index";
import { getSupabaseClient } from "@shared/api/client";
import { useAuth } from "@/providers/AuthProvider";
import * as ImagePicker from "expo-image-picker";

export function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (avatarUri && user) {
        const formData = new FormData();
        const filename = `avatar-${Date.now()}.jpg`;
        formData.append("file", {
          uri: avatarUri,
          type: "image/jpeg",
          name: filename,
        } as any);
        const { data: uploadData } = await supabase.storage
          .from("listing-images")
          .upload(`${user.id}/${filename}`, formData, { contentType: "image/jpeg" });
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("listing-images")
            .getPublicUrl(`${user.id}/${filename}`);
          await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
        }
      }
      await supabase.from("profiles").update({ phone, bio }).eq("id", user?.id);
      await refreshProfile();
    } catch {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.bold,
            color: colors.foreground,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Complete Your Profile
        </Text>

        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={pickAvatar}>
            <Avatar uri={avatarUri} name={user?.email || "U"} size={80} />
          </TouchableOpacity>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.primary, marginTop: 8 }}>
            Tap to change photo
          </Text>
        </View>

        <ThemedInput label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+880 1XXXXXXXXX" keyboardType="phone-pad" />
        <ThemedInput label="Bio" value={bio} onChangeText={setBio} placeholder="Tell us about yourself" multiline numberOfLines={3} />

        <ThemedButton onPress={handleComplete} fullWidth size="lg" loading={loading} style={{ marginTop: 16 }}>
          Complete Setup
        </ThemedButton>
      </ScrollView>
    </SafeAreaView>
  );
}

import { TouchableOpacity } from "react-native";
