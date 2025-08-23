export const palette = {
  primary: "#00D084", // neon green
  accent: "#FF6B6B", // CTA red
  dark: "#0E0F12",
  light: "#F7F9FB",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
} as const;

export const fontScale = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

export const brand = { palette, spacing, fontScale };


