import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedInput } from "@/components/ui/Input";
import { Divider } from "@/components/ui/Divider";
import { colors, typography, spacing } from "@shared/index";
import {
  fetchAgreementsByConversation,
  updateAgreementStatus,
} from "@shared/api/agreements";
import { createPayment } from "@shared/api/payments";
import { sendMessage } from "@shared/api/messages";
import { calculateTaxAutoCut } from "@shared/index";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "PaymentScreen">;
type Route = RouteProp<RootStackParamList, "PaymentScreen">;

export function PaymentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { agreementId, amount } = route.params;

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const tax = calculateTaxAutoCut(amount);

  const handlePay = async () => {
    if (!cardNumber || !cardName || !expiry || !cvv) {
      Alert.alert("Error", "Please fill in all card details");
      return;
    }
    setProcessing(true);
    try {
      const agreements = await fetchAgreementsByConversation(agreementId);
      const agreement = agreements[0];
      if (!agreement || !user) return;

      const result = await createPayment(
        agreement.id,
        agreement.tenant_id,
        agreement.landlord_id,
        amount,
        tax
      );

      await sendMessage(
        agreement.conversation_id,
        user.id,
        `Payment completed! Receipt: ${result.receiptNumber}`
      );

      Alert.alert("Payment Successful", `Receipt: ${result.receiptNumber}`, [
        {
          text: "View Receipt",
          onPress: () =>
            navigation.navigate("ReceiptScreen", {
              paymentId: result.payment?.id || "",
            }),
        },
      ]);
    } catch {
      Alert.alert("Error", "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <ThemedCard style={{ marginBottom: spacing.md }}>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.foreground, marginBottom: 12 }}>
            Rent Summary
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: colors.mutedForeground }}>Gross Rent</Text>
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>৳{amount.toLocaleString()}</Text>
          </View>
          <Divider />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>TDS</Text>
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

        <ThemedCard>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: 16 }}>
            Card Details (Simulated)
          </Text>
          <ThemedInput label="Card Number" value={cardNumber} onChangeText={setCardNumber} placeholder="4242 4242 4242 4242" keyboardType="number-pad" />
          <ThemedInput label="Cardholder Name" value={cardName} onChangeText={setCardName} placeholder="John Doe" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <ThemedInput label="Expiry" value={expiry} onChangeText={setExpiry} placeholder="MM/YY" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedInput label="CVV" value={cvv} onChangeText={setCvv} placeholder="123" keyboardType="number-pad" secureTextEntry />
            </View>
          </View>
        </ThemedCard>

        <ThemedButton
          onPress={handlePay}
          fullWidth
          size="lg"
          loading={processing}
          style={{ marginTop: spacing.md }}
        >
          Pay ৳{amount.toLocaleString()}
        </ThemedButton>
      </ScrollView>
    </SafeAreaView>
  );
}
