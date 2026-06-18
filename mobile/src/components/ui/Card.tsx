import React, { ReactNode } from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { colors, borderRadius, shadows } from "@shared/index";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padded?: boolean;
}

export function ThemedCard({ children, style, elevated = true, padded = true }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        elevated && shadows.md,
        padded && { padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
