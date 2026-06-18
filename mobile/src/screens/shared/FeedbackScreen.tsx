import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedInput } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing } from "@shared/index";
import { fetchFeedback, submitFeedback } from "@shared/api/feedback";
import { useAuth } from "@/providers/AuthProvider";
import { Feedback as FeedbackType } from "@shared/index";

export function FeedbackScreen() {
  const { user, role } = useAuth();
  const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await fetchFeedback(role || undefined);
      setFeedbackList(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !subjectId) {
      Alert.alert("Error", "Please enter the user ID to review");
      return;
    }
    try {
      await submitFeedback(user.id, subjectId, role === "landlord" ? "landlord" : "tenant", rating, comment);
      Alert.alert("Success", "Feedback submitted!");
      setSubjectId("");
      setComment("");
      loadFeedback();
    } catch {
      Alert.alert("Error", "Failed to submit feedback");
    }
  };

  const renderItem = ({ item }: { item: FeedbackType }) => (
    <ThemedCard style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar uri={item.reviewer?.avatar_url} name={item.reviewer?.full_name || "U"} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
            {item.reviewer?.full_name || "Anonymous"}
          </Text>
          <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text key={star} style={{ fontSize: 14 }}>{star <= item.rating ? "⭐" : "☆"}</Text>
            ))}
          </View>
          {item.comment && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 4 }}>
              {item.comment}
            </Text>
          )}
        </View>
      </View>
    </ThemedCard>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
          Feedback
        </Text>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginBottom: 16 }}>
          Leave reviews for other users
        </Text>

        <ThemedCard style={{ marginBottom: spacing.md }}>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: 12 }}>
            Submit Review
          </Text>
          <ThemedInput
            label="User ID to review"
            value={subjectId}
            onChangeText={setSubjectId}
            placeholder="Enter user ID"
          />
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 12, alignItems: "center" }}>
            <Text style={{ fontSize: typography.fontSize.sm, marginRight: 8 }}>Rating: </Text>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={{ fontSize: 20 }}>{star <= rating ? "⭐" : "☆"}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ThemedInput
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            placeholder="Write your review..."
            multiline
            numberOfLines={3}
          />
          <ThemedButton onPress={handleSubmit} fullWidth size="sm">
            Submit
          </ThemedButton>
        </ThemedCard>
      </View>

      <FlatList
        data={feedbackList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
        ListHeaderComponent={<Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>Recent Reviews</Text>}
        ListEmptyComponent={loading ? <LoadingSpinner /> : <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>No reviews yet</Text>}
      />
    </SafeAreaView>
  );
}

import { TouchableOpacity } from "react-native";
