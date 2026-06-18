import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing, borderRadius } from "@shared/index";
import { fetchMyListings, deleteListing, updateListing } from "@shared/api/listings";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { Listing } from "@shared/index";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MyListingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadListings();
    }, [])
  );

  const loadListings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchMyListings(user.id);
      setListings(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (listing: Listing) => {
    await updateListing(listing.id, { is_active: !listing.is_active } as any);
    loadListings();
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Listing", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteListing(id);
          loadListings();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <ThemedCard style={{ marginBottom: spacing.sm }}>
      <TouchableOpacity onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary, marginTop: 4 }}>
              ৳{item.price.toLocaleString()}/mo
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>
              {item.bedrooms} bd • {item.bathrooms} ba • {item.property_type}
            </Text>
          </View>
          <Badge variant={item.is_active ? "success" : "default"}>
            {item.is_active ? "Active" : "Hidden"}
          </Badge>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <ThemedButton onPress={() => handleToggleActive(item)} variant="outline" size="sm" style={{ flex: 1 }}>
          {item.is_active ? "Hide" : "Show"}
        </ThemedButton>
        <ThemedButton onPress={() => handleDelete(item.id)} variant="destructive" size="sm" style={{ flex: 1 }}>
          Delete
        </ThemedButton>
      </View>
    </ThemedCard>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
          My Listings
        </Text>
      </View>
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: colors.mutedForeground }}>No listings yet</Text>
              <ThemedButton onPress={() => {}} variant="primary" style={{ marginTop: 16 }}>
                Create Your First Listing
              </ThemedButton>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
