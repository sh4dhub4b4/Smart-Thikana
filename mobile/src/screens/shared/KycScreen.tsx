import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedInput } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { colors, typography, spacing } from "@shared/index";
import { fetchKyc, upsertKyc, uploadKycDocument } from "@shared/api/kyc";
import { useAuth } from "@/providers/AuthProvider";
import * as ImagePicker from "expo-image-picker";
import { Kyc as KycType } from "@shared/index";

export function KycScreen() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KycType | null>(null);
  const [nidNumber, setNidNumber] = useState("");
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadKyc();
  }, []);

  const loadKyc = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchKyc(user.id);
      setKyc(data);
      if (data) {
        setNidNumber(data.nid_number || "");
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const pickImage = async (field: "nid_front" | "nid_back" | "selfie") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (field === "nid_front") setNidFront(uri);
      else if (field === "nid_back") setNidBack(uri);
      else setSelfie(uri);
    }
  };

  const handleSubmit = async () => {
    if (!user || !nidNumber) {
      Alert.alert("Error", "NID number is required");
      return;
    }
    setSaving(true);
    try {
      let frontUrl = kyc?.nid_front_url;
      let backUrl = kyc?.nid_back_url;
      let selfieUrl = kyc?.selfie_url;

      if (nidFront) frontUrl = await uploadKycDocument(user.id, "nid_front", nidFront);
      if (nidBack) backUrl = await uploadKycDocument(user.id, "nid_back", nidBack);
      if (selfie) selfieUrl = await uploadKycDocument(user.id, "selfie", selfie);

      await upsertKyc(user.id, nidNumber, frontUrl || undefined, backUrl || undefined, selfieUrl || undefined);
      Alert.alert("Success", "KYC submitted for verification");
      loadKyc();
    } catch {
      Alert.alert("Error", "Failed to submit KYC");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, marginBottom: 4 }}>
          Identity Verification
        </Text>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginBottom: 16 }}>
          Verify your identity to build trust on the platform
        </Text>

        {kyc?.status && (
          <ThemedCard style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: typography.fontWeight.semibold }}>Status</Text>
              <Badge
                variant={
                  kyc.status === "verified" ? "success" :
                  kyc.status === "pending" ? "warning" : "default"
                }
              >
                {kyc.status}
              </Badge>
            </View>
          </ThemedCard>
        )}

        <ThemedInput
          label="NID Number"
          value={nidNumber}
          onChangeText={setNidNumber}
          placeholder="Enter your National ID number"
        />

        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: 8 }}>
          NID Front
        </Text>
        <TouchableOpacity
          onPress={() => pickImage("nid_front")}
          style={{
            borderWidth: 1,
            borderColor: nidFront ? colors.primary : colors.border,
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            marginBottom: 12,
            backgroundColor: nidFront ? colors.primarySoft : colors.card,
          }}
        >
          <Text style={{ color: nidFront ? colors.primary : colors.mutedForeground }}>
            {nidFront ? "✓ Front image selected" : "Tap to upload NID front"}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: 8 }}>
          NID Back
        </Text>
        <TouchableOpacity
          onPress={() => pickImage("nid_back")}
          style={{
            borderWidth: 1,
            borderColor: nidBack ? colors.primary : colors.border,
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            marginBottom: 12,
            backgroundColor: nidBack ? colors.primarySoft : colors.card,
          }}
        >
          <Text style={{ color: nidBack ? colors.primary : colors.mutedForeground }}>
            {nidBack ? "✓ Back image selected" : "Tap to upload NID back"}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: 8 }}>
          Selfie
        </Text>
        <TouchableOpacity
          onPress={() => pickImage("selfie")}
          style={{
            borderWidth: 1,
            borderColor: selfie ? colors.primary : colors.border,
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            marginBottom: 24,
            backgroundColor: selfie ? colors.primarySoft : colors.card,
          }}
        >
          <Text style={{ color: selfie ? colors.primary : colors.mutedForeground }}>
            {selfie ? "✓ Selfie selected" : "Tap to upload your selfie"}
          </Text>
        </TouchableOpacity>

        <ThemedButton onPress={handleSubmit} fullWidth loading={saving} disabled={kyc?.status === "verified"}>
          {kyc?.status === "verified" ? "Already Verified" : "Submit for Verification"}
        </ThemedButton>
      </ScrollView>
    </SafeAreaView>
  );
}
