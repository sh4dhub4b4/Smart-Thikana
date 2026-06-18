import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { colors, typography, spacing, borderRadius } from "@shared/index";
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  createConversation,
} from "@shared/api/messages";
import {
  fetchAgreementsByConversation,
  createAgreement,
  updateAgreementStatus,
} from "@shared/api/agreements";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { Message, Agreement } from "@shared/index";

type Nav = NativeStackNavigationProp<RootStackParamList, "ChatScreen">;
type Route = RouteProp<RootStackParamList, "ChatScreen">;

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { conversationId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    loadAgreements();
    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return unsubscribe;
  }, [conversationId]);

  const loadMessages = async () => {
    const data = await fetchMessages(conversationId);
    setMessages(data);
  };

  const loadAgreements = async () => {
    const data = await fetchAgreementsByConversation(conversationId);
    setAgreements(data);
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    await sendMessage(conversationId, user.id, input.trim());
    setInput("");
  };

  const pendingAgreement = agreements.find((a) => a.status === "pending");
  const activeAgreement = agreements.find((a) => a.status === "active");

  const handleProposeDeal = async () => {
    if (!user) return;
    await sendMessage(conversationId, user.id, "I'd like to propose a rental agreement for this listing.");
    const agreements = await fetchAgreementsByConversation(conversationId);
    setAgreements(agreements);
  };

  const handleAccept = async (agreementId: string) => {
    await updateAgreementStatus(agreementId, "accepted");
    if (user) {
      await sendMessage(conversationId, user.id, "Agreement accepted! You can now proceed with payment.");
    }
    loadAgreements();
  };

  const handleReject = async (agreementId: string) => {
    await updateAgreementStatus(agreementId, "rejected");
    if (user) {
      await sendMessage(conversationId, user.id, "Agreement was rejected.");
    }
    loadAgreements();
  };

  const currentUserIsTenant = user?.id && user.id !== route.params.landlordId;

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === user?.id;
    return (
      <View style={{ alignItems: isOwn ? "flex-end" : "flex-start", marginBottom: 8 }}>
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: isOwn ? colors.primary : colors.card,
            padding: 12,
            borderRadius: borderRadius.lg,
            borderBottomRightRadius: isOwn ? 4 : borderRadius.lg,
            borderBottomLeftRadius: isOwn ? borderRadius.lg : 4,
          }}
        >
          <Text style={{ color: isOwn ? colors.white : colors.foreground, fontSize: typography.fontSize.base }}>
            {item.content}
          </Text>
        </View>
        <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2 }}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {activeAgreement && (
          <View style={{ backgroundColor: colors.success + "20", padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.success + "40" }}>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.success, textAlign: "center" }}>
              Agreement is active. Rent payments are being processed.
            </Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ color: colors.mutedForeground }}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />

        {pendingAgreement ? (
          <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
            <ThemedCard>
              <Text style={{ fontWeight: typography.fontWeight.bold, marginBottom: 4 }}>Proposed Deal</Text>
              <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary, marginBottom: 8 }}>
                ৳{pendingAgreement.proposed_price.toLocaleString()}/mo
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {currentUserIsTenant ? (
                  <ThemedButton onPress={() => handleAccept(pendingAgreement.id)} variant="primary" style={{ flex: 1 }} size="sm">
                    Accept
                  </ThemedButton>
                ) : (
                  <>
                    <ThemedButton onPress={() => handleAccept(pendingAgreement.id)} variant="primary" style={{ flex: 1 }} size="sm">
                      Accept
                    </ThemedButton>
                    <ThemedButton onPress={() => handleReject(pendingAgreement.id)} variant="destructive" style={{ flex: 1 }} size="sm">
                      Reject
                    </ThemedButton>
                  </>
                )}
              </View>
              {currentUserIsTenant && (
                <ThemedButton
                  onPress={() => {
                    const active = agreements.find(a => a.status === "accepted" || a.status === "active");
                    if (active) {
                      navigation.navigate("PaymentScreen", {
                        agreementId: active.id,
                        amount: active.proposed_price,
                      });
                    }
                  }}
                  variant="secondary"
                  fullWidth
                  size="sm"
                  style={{ marginTop: 8 }}
                >
                  Pay Now
                </ThemedButton>
              )}
            </ThemedCard>
          </View>
        ) : !activeAgreement && (
          <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
            <ThemedButton onPress={handleProposeDeal} variant="secondary" fullWidth size="sm">
              Propose Rental Agreement
            </ThemedButton>
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.full,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: typography.fontSize.base,
              backgroundColor: colors.background,
            }}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.white, fontSize: 18 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
