import React, { ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { colors, borderRadius, typography } from "@shared/index";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: colors.white },
  secondary: { bg: colors.primarySoft, text: colors.primary },
  outline: { bg: "transparent", text: colors.primary, border: colors.primary },
  ghost: { bg: "transparent", text: colors.foreground },
  destructive: { bg: colors.destructive, text: colors.white },
};

const sizeStyles = {
  sm: { py: 8, px: 12, fontSize: typography.fontSize.sm },
  md: { py: 12, px: 20, fontSize: typography.fontSize.base },
  lg: { py: 16, px: 28, fontSize: typography.fontSize.lg },
};

export function ThemedButton({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  size = "md",
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: v.bg,
          borderRadius: borderRadius.md,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: disabled ? 0.5 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={v.text} />}
      <Text
        style={[
          {
            color: v.text,
            fontSize: s.fontSize,
            fontWeight: typography.fontWeight.semibold,
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
