import React from "react";
import { View, ActivityIndicator, Text, StyleProp, ViewStyle } from "react-native";
import { colors, typography } from "@shared/index";

interface LoadingSpinnerProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, style, fullScreen = false }: LoadingSpinnerProps) {
  const content = (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 12,
        },
        fullScreen && { flex: 1 },
        style,
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.mutedForeground }}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>{content}</View>;
  }

  return content;
}
