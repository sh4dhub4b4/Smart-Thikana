import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedButton } from "@/components/ui/Button";
import { ThemedCard } from "@/components/ui/Card";
import { ScreenWrapper } from "@/components/ui/ScreenWrapper";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing, borderRadius } from "@shared/index";
import { fetchListings } from "@shared/api/listings";
import { Listing } from "@shared/index";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - spacing.md * 2 - spacing.sm) / 2;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "nearby">("all");
  const [maxPrice, setMaxPrice] = useState(0);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await fetchListings();
      setListings(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (maxPrice > 0 && l.price > maxPrice) return false;
    return true;
  });

  const renderListing = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
      activeOpacity={0.8}
      style={{ width: CARD_WIDTH, marginBottom: spacing.sm }}
    >
      <ThemedCard padded={false} elevated>
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: item.images?.[0] || `https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=70` }}
            style={{ width: "100%", height: 120, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg }}
            resizeMode="cover"
          />
          <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: colors.card + "E6", paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full }}>
            <Text style={{ fontSize: 10, color: colors.foreground, textTransform: "capitalize" }}>{item.property_type}</Text>
          </View>
        </View>
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }} numberOfLines={1}>{item.title}</Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, marginVertical: 2 }} numberOfLines={1}>
            {item.area_moholla || item.location}
          </Text>
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.primary, marginTop: 4 }}>
            ৳{item.price.toLocaleString()}
          </Text>
        </View>
      </ThemedCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
          Find your home
        </Text>

        <TextInput
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: typography.fontSize.base,
            backgroundColor: colors.card,
          }}
          placeholder="Search by title, location..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />

        <View style={{ flexDirection: "row", gap: 8, marginVertical: 12 }}>
          <TouchableOpacity
            onPress={() => setActiveTab("all")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: borderRadius.md,
              backgroundColor: activeTab === "all" ? colors.primary : colors.card,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: activeTab === "all" ? colors.white : colors.foreground }}>
              All Listings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("nearby")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: borderRadius.md,
              backgroundColor: activeTab === "nearby" ? colors.primary : colors.card,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: activeTab === "nearby" ? colors.white : colors.foreground }}>
              Near Me
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <LoadingSpinner fullScreen message="Loading listings..." />
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: typography.fontSize.base, color: colors.mutedForeground }}>No listings found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
