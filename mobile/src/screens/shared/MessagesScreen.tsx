import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing } from "@shared/index";
import { fetchConversations } from "@shared/api/messages";
import { useAuth } from "@/providers/AuthProvider";
import { Conversation } from "@shared/index";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MessagesScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchConversations(user.id);
      setConversations(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const isTenant = item.tenant_id === user?.id;
    const otherUser = isTenant ? item.landlord : item.tenant;
    const otherName = otherUser?.full_name || "User";

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("ChatScreen", { conversationId: item.id })}
        activeOpacity={0.7}
      >
        <ThemedCard elevated style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar uri={otherUser?.avatar_url} name={otherName} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
                {otherName}
              </Text>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }} numberOfLines={1}>
                {item.listing?.title || "Conversation"}
              </Text>
              {item.last_message && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={1}>
                  {item.last_message.content}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>
              ৳{item.listing?.price?.toLocaleString()}
            </Text>
          </View>
        </ThemedCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
          Messages
        </Text>
      </View>
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: colors.mutedForeground }}>No conversations yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
