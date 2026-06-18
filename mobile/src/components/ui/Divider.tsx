import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { colors } from "@shared/index";

interface DividerProps {
  style?: StyleProp<ViewStyle>;
}

export function Divider({ style }: DividerProps) {
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 16,
        },
        style,
      ]}
    />
  );
}
