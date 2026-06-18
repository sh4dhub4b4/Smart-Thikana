import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing } from "@shared/index";
import { fetchLandlordListingsWithDetails } from "@shared/api/listings";
import { fetchAgreementsByUser } from "@shared/api/agreements";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listingsData, agreementsData] = await Promise.all([
        fetchLandlordListingsWithDetails(user.id),
        fetchAgreementsByUser(user.id),
      ]);
      setListings(listingsData);
      setAgreements(agreementsData);
    } catch {} finally {
      setLoading(false);
    }
  };

  const activeAgreements = agreements.filter((a) => a.status === "active");
  const pendingAgreements = agreements.filter((a) => a.status === "pending");
  const totalRevenue = activeAgreements.reduce((sum: number, a: any) => sum + a.proposed_price, 0);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground, marginBottom: 16 }}>
          Dashboard
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: spacing.md }}>
          <ThemedCard style={{ flex: 1 }} padded>
            <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.primary }}>
              {listings.length}
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>Listings</Text>
          </ThemedCard>
          <ThemedCard style={{ flex: 1 }} padded>
            <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.accent }}>
              {activeAgreements.length}
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>Active</Text>
          </ThemedCard>
          <ThemedCard style={{ flex: 1 }} padded>
            <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.success }}>
              ৳{(totalRevenue / 1000).toFixed(1)}k
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>Revenue</Text>
          </ThemedCard>
        </View>

        {pendingAgreements.length > 0 && (
          <ThemedCard style={{ marginBottom: spacing.md, borderColor: colors.warning + "60", borderWidth: 1 }}>
            <Text style={{ fontWeight: typography.fontWeight.semibold, marginBottom: 8, color: colors.warning }}>
              Pending Agreements ({pendingAgreements.length})
            </Text>
            {pendingAgreements.slice(0, 3).map((a) => (
              <View key={a.id} style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: typography.fontSize.sm }}>৳{a.proposed_price.toLocaleString()} / mo</Text>
              </View>
            ))}
          </ThemedCard>
        )}

        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>
          Your Listings
        </Text>
        {listings.slice(0, 5).map((l) => (
          <ThemedCard key={l.id} style={{ marginBottom: spacing.sm }}>
            <TouchableOpacity onPress={() => navigation.navigate("ListingDetail", { listingId: l.id })}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: typography.fontWeight.semibold }} numberOfLines={1}>{l.title}</Text>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.bold }}>
                    ৳{l.price.toLocaleString()}/mo
                  </Text>
                </View>
                <Badge variant={l.is_active ? "success" : "default"}>
                  {l.is_active ? "Active" : "Hidden"}
                </Badge>
              </View>
              {l.agreementCount > 0 && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground, marginTop: 4 }}>
                  {l.agreementCount} pending agreement{l.agreementCount > 1 ? "s" : ""}
                </Text>
              )}
            </TouchableOpacity>
          </ThemedCard>
        ))}

        <ThemedButton
          onPress={() => navigation.navigate("ListingDetail", { listingId: "new" })}
          variant="secondary"
          fullWidth
          style={{ marginTop: spacing.sm }}
        >
          Add New Listing
        </ThemedButton>
      </ScrollView>
    </SafeAreaView>
  );
}
