import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { ThemedButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing, borderRadius } from "@shared/index";
import { fetchListingWithLandlord } from "@shared/api/listings";
import { createConversation } from "@shared/api/messages";
import { toggleFavorite, fetchFavoriteIds } from "@shared/api/favorites";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { Listing, Profile, fmtBDT, formatAddress } from "@shared/index";

type Nav = NativeStackNavigationProp<RootStackParamList, "ListingDetail">;
type Route = RouteProp<RootStackParamList, "ListingDetail">;

export function ListingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { listingId } = route.params;

  const [listing, setListing] = useState<Listing | null>(null);
  const [landlord, setLandlord] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadData();
  }, [listingId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { listing: l, landlord: ll } = await fetchListingWithLandlord(listingId);
      setListing(l);
      setLandlord(ll);
      if (user) {
        const ids = await fetchFavoriteIds(user.id);
        setIsFavorite(ids.has(listingId));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user || !listing || !landlord) return;
    const conv = await createConversation(listing.id, user.id, landlord.id);
    if (conv) {
      navigation.navigate("ChatScreen", {
        conversationId: conv.id,
        listingId: listing.id,
        landlordId: landlord.id,
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    await toggleFavorite(user.id, listingId, isFavorite);
    setIsFavorite(!isFavorite);
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading listing..." />;
  if (!listing) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: colors.mutedForeground }}>Listing not found</Text>
    </SafeAreaView>
  );

  const img = listing.images?.[0] || null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
        {img && (
          <Image
            source={{ uri: img }}
            style={{ width: "100%", height: 260 }}
            resizeMode="cover"
          />
        )}

        <View style={{ padding: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
                {listing.title}
              </Text>
              <Badge style={{ marginTop: 4 }}>{listing.property_type}</Badge>
            </View>
            <TouchableOpacity onPress={handleToggleFavorite} style={{ padding: 8 }}>
              <Text style={{ fontSize: 28 }}>{isFavorite ? "❤️" : "🤍"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: typography.fontSize["3xl"], fontWeight: typography.fontWeight.bold, color: colors.primary, marginTop: 12 }}>
            {fmtBDT(listing.price)}
            <Text style={{ fontSize: typography.fontSize.base, color: colors.mutedForeground }}> / month</Text>
          </Text>

          <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 8, lineHeight: 20 }}>
            {formatAddress(listing)}
          </Text>

          <ThemedCard style={{ marginTop: spacing.md }}>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>
              Property Details
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              <View><Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>Bedrooms</Text><Text style={{ fontWeight: typography.fontWeight.medium }}>{listing.bedrooms}</Text></View>
              <View><Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>Bathrooms</Text><Text style={{ fontWeight: typography.fontWeight.medium }}>{listing.bathrooms}</Text></View>
              {listing.area_sqft && (
                <View><Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>Area</Text><Text style={{ fontWeight: typography.fontWeight.medium }}>{listing.area_sqft} sqft</Text></View>
              )}
            </View>
          </ThemedCard>

          {listing.description && (
            <ThemedCard style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>Description</Text>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, lineHeight: 20 }}>{listing.description}</Text>
            </ThemedCard>
          )}

          {landlord && (
            <ThemedCard style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>Landlord</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar uri={landlord.avatar_url} name={landlord.full_name} size={48} />
                <View>
                  <Text style={{ fontWeight: typography.fontWeight.medium }}>{landlord.full_name}</Text>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>{landlord.phone || "No phone"}</Text>
                </View>
              </View>
            </ThemedCard>
          )}

          {user && user.id !== listing.landlord_id && (
            <ThemedButton onPress={handleMessage} fullWidth size="lg" style={{ marginTop: spacing.md }}>
              Message Landlord
            </ThemedButton>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
