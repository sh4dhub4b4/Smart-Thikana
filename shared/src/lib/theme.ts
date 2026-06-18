export const colors = {
  primary: "#006A4E",
  primaryForeground: "#FAF7F2",
  primaryGlow: "#1A8A6A",
  primarySoft: "#E4F5EF",
  accent: "#F42A41",
  accentForeground: "#FFFFFF",
  accentSoft: "#FDE8EB",
  background: "#FAF7F2",
  foreground: "#1A2C33",
  card: "#FFFFFF",
  cardForeground: "#1A2C33",
  muted: "#F0F4F5",
  mutedForeground: "#55686E",
  border: "#DCE4E6",
  destructive: "#E53E3E",
  success: "#22A67E",
  warning: "#E68A2E",
  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  fontFamily: {
    display: undefined,
    sans: undefined,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#1A2C33",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#006A4E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  },
  brand: {
    shadowColor: "#006A4E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
};
