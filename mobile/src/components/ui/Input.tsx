import React from "react";
import { View, Text, TextInput, TextInputProps, ViewStyle, StyleProp } from "react-native";
import { colors, borderRadius, typography } from "@shared/index";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function ThemedInput({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.foreground,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          {
            borderWidth: 1,
            borderColor: error ? colors.destructive : colors.border,
            borderRadius: borderRadius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: typography.fontSize.base,
            color: colors.foreground,
            backgroundColor: colors.card,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
      {error && (
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.destructive,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
