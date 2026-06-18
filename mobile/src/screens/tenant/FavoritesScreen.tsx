import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedCard } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { colors, typography, spacing, borderRadius } from "@shared/index";
import { fetchFavoriteIds, fetchFavoriteListings } from "@shared/api/favorites";
import { useAuth } from "@/providers/AuthProvider";
import { Listing } from "@shared/index";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - spacing.md * 2 - spacing.sm) / 2;

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchFavoriteListings(user.id);
      setListings(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
      activeOpacity={0.8}
      style={{ width: CARD_WIDTH, marginBottom: spacing.sm }}
    >
      <ThemedCard padded={false} elevated>
        <Image
          source={{ uri: item.images?.[0] || `https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=70` }}
          style={{ width: "100%", height: 120, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg }}
          resizeMode="cover"
        />
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }} numberOfLines={1}>{item.title}</Text>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary, marginTop: 4 }}>
            ৳{item.price.toLocaleString()}
          </Text>
        </View>
      </ThemedCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.foreground }}>
          Saved Listings
        </Text>
      </View>
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: typography.fontSize.base, color: colors.mutedForeground }}>
                No saved listings yet
              </Text>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginTop: 8 }}>
                Tap the heart icon on any listing to save it
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

import { Image } from "react-native";
