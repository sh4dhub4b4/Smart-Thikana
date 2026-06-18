import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing } from "@shared/index";
import { fetchServiceCategories, fetchServiceProviders, createServiceBooking } from "@shared/api/services";
import { useAuth } from "@/providers/AuthProvider";
import { ServiceCategory, ServiceProvider } from "@shared/index";

export function ServicesScreen() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) loadProviders(selectedCategory);
    else loadProviders();
  }, [selectedCategory]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchServiceCategories();
      setCategories(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadProviders = async (categoryId?: string) => {
    try {
      const data = await fetchServiceProviders(categoryId);
      setProviders(data);
    } catch {}
  };

  const handleBook = async (providerId: string) => {
    if (!user) return;
    try {
      await createServiceBooking(providerId, user.id, new Date().toISOString());
      Alert.alert("Success", "Service booking request sent!");
    } catch {
      Alert.alert("Error", "Failed to book service");
    }
  };

  const renderProvider = ({ item }: { item: ServiceProvider }) => (
    <ThemedCard style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
            {item.company_name || "Provider"}
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>
            {item.experience_years} years experience
          </Text>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary, marginTop: 4 }}>
            ৳{item.hourly_rate}/hr
          </Text>
        </View>
        <ThemedButton onPress={() => handleBook(item.id)} size="sm">
          Book
        </ThemedButton>
      </View>
    </ThemedCard>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
          Services
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedCategory === item.id ? colors.primary : colors.card,
                marginRight: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{
                color: selectedCategory === item.id ? colors.white : colors.foreground,
                fontWeight: typography.fontWeight.medium,
                fontSize: typography.fontSize.sm,
              }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={providers}
        renderItem={renderProvider}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ color: colors.mutedForeground }}>No service providers found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
