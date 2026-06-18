import React, { ReactNode } from "react";
import { View, Text, ScrollView, StyleProp, ViewStyle } from "react-native";
import { colors, spacing, typography } from "@shared/index";

interface ScreenWrapperProps {
  children: ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
}

export function ScreenWrapper({ children, title, style, scrollable = true }: ScreenWrapperProps) {
  const content = (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {title && (
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.foreground,
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            {title}
          </Text>
        </View>
      )}
      <View style={{ paddingHorizontal: spacing.md }}>{children}</View>
    </View>
  );

  if (scrollable) {
    return <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>{content}</ScrollView>;
  }

  return content;
}
