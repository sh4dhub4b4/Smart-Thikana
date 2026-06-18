import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing } from "@shared/index";
import { fetchPaymentByAgreement } from "@shared/api/payments";
import { calculateTaxAutoCut } from "@shared/index";
import { useRoute, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation/types";

type Route = RouteProp<RootStackParamList, "ReceiptScreen">;

export function ReceiptScreen() {
  const route = useRoute<Route>();
  const { paymentId } = route.params;
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, [paymentId]);

  const loadReceipt = async () => {
    setLoading(true);
    try {
      const p = await fetchPaymentByAgreement(paymentId);
      setPayment(p);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!payment) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: colors.mutedForeground }}>Receipt not found</Text>
    </SafeAreaView>
  );

  const tax = calculateTaxAutoCut(payment.amount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.primary }}>Receipt</Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 4 }}>{payment.receipt_number}</Text>
        </View>

        <ThemedCard>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: 16 }}>
            Payment Summary
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: colors.mutedForeground }}>Gross Rent</Text>
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>৳{payment.amount.toLocaleString()}</Text>
          </View>
          <Divider />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>TDS (10%)</Text>
            <Text style={{ fontSize: typography.fontSize.xs }}>- ৳{tax.tds_amount.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>Advance Tax</Text>
            <Text style={{ fontSize: typography.fontSize.xs }}>- ৳{tax.advance_tax_this_month.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>Platform Fee (1%)</Text>
            <Text style={{ fontSize: typography.fontSize.xs }}>- ৳{tax.platform_fee.toLocaleString()}</Text>
          </View>
          <Divider />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: typography.fontWeight.bold }}>Net to Landlord</Text>
            <Text style={{ fontWeight: typography.fontWeight.bold, color: colors.primary }}>
              ৳{tax.net_to_landlord.toLocaleString()}
            </Text>
          </View>
        </ThemedCard>

        <View style={{ marginTop: 24, alignItems: "center" }}>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground, textAlign: "center" }}>
            Bangladesh Section 38 compliant receipt
          </Text>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground, marginTop: 4 }}>
            Paid on {new Date(payment.created_at).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
