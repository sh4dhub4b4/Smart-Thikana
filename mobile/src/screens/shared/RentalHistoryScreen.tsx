import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing } from "@shared/index";
import { fetchAgreementsByUser } from "@shared/api/agreements";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { Agreement } from "@shared/index";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RentalHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchAgreementsByUser(user.id);
      setAgreements(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
    pending: "warning",
    accepted: "success",
    rejected: "destructive",
    active: "success",
  };

  const renderItem = ({ item }: { item: Agreement }) => (
    <ThemedCard style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
            ৳{item.proposed_price.toLocaleString()}/mo
          </Text>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Badge variant={statusColors[item.status] || "default"}>
          {item.status}
        </Badge>
      </View>
    </ThemedCard>
  );

  const activeAgreement = agreements.find((a) => a.status === "active" || a.status === "accepted");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
          Rental History
        </Text>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 4 }}>
          {agreements.length} total agreement{agreements.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {activeAgreement && (
        <ThemedCard
          style={{
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
            borderColor: colors.success,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.success }}>
            Active Residence
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 4 }}>
            ৳{activeAgreement.proposed_price.toLocaleString()}/mo
          </Text>
          <TouchableOpacity
            onPress={() => {
              const paymentId = activeAgreement.id;
              navigation.navigate("PaymentScreen", {
                agreementId: activeAgreement.id,
                amount: activeAgreement.proposed_price,
              });
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: typography.fontWeight.medium, marginTop: 8 }}>
              Make Payment →
            </Text>
          </TouchableOpacity>
        </ThemedCard>
      )}

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={agreements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ color: colors.mutedForeground }}>No rental history yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
