import React from "react";
import { View, Text, Image, StyleProp, ViewStyle } from "react-native";
import { colors, borderRadius } from "@shared/index";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ uri, name = "U", size = 40, style }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (uri) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          },
          style,
        ]}
      >
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.primaryForeground,
          fontSize: size * 0.4,
          fontWeight: "600",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
