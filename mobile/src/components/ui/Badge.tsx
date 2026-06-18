import React, { ReactNode } from "react";
import { View, Text, ViewStyle, StyleProp } from "react-native";
import { colors, borderRadius, typography } from "@shared/index";

type BadgeVariant = "default" | "destructive" | "success" | "warning" | "outline";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

const badgeVariants: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  default: { bg: colors.primarySoft, text: colors.primary },
  destructive: { bg: colors.accentSoft, text: colors.accent },
  success: { bg: "#E4F5EF", text: colors.success },
  warning: { bg: "#FFF4E5", text: colors.warning },
  outline: { bg: "transparent", text: colors.foreground, border: colors.border },
};

export function Badge({ children, variant = "default", style }: BadgeProps) {
  const v = badgeVariants[variant];
  return (
    <View
      style={[
        {
          backgroundColor: v.bg,
          borderRadius: borderRadius.full,
          paddingHorizontal: 10,
          paddingVertical: 2,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: v.text,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          textTransform: "capitalize",
        }}
      >
        {children}
      </Text>
    </View>
  );
}
