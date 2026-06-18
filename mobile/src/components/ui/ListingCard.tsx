import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { colors, borderRadius, typography, spacing } from "@shared/index";
import { ThemedCard } from "./Card";
import { Badge } from "./Badge";
import { fmtBDT, formatAddress, placeholderImage } from "@shared/index";
import { Listing } from "@shared/index";

interface ListingCardProps {
  listing: Listing;
  isFavorite?: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ListingCard({ listing, onPress, style }: ListingCardProps) {
  const img = listing.images?.[0] || placeholderImage(listing.id);
  const address = formatAddress(listing);

  return (
    <ThemedCard padded={false} style={[{ marginBottom: spacing.sm }, style]}>
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: img }}
          style={{
            width: "100%",
            height: 160,
            borderTopLeftRadius: borderRadius.lg,
            borderTopRightRadius: borderRadius.lg,
          }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", top: 12, left: 12 }}>
          <Badge>{listing.property_type}</Badge>
        </View>
      </View>
      <View style={{ padding: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.foreground,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {listing.title}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.mutedForeground,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {address}
        </Text>
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>
            {listing.bedrooms} bd
          </Text>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>
            {listing.bathrooms} ba
          </Text>
          {listing.area_sqft && (
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>
              {listing.area_sqft} sqft
            </Text>
          )}
        </View>
        <Text
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary,
          }}
        >
          {fmtBDT(listing.price)}
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.mutedForeground }}>
            {" "}/ month
          </Text>
        </Text>
      </View>
    </ThemedCard>
  );
}

import { Image, TouchableOpacity } from "react-native";

export function PressableListingCard(props: ListingCardProps & { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={props.onPress} activeOpacity={0.8}>
      <ListingCard {...props} />
    </TouchableOpacity>
  );
}
