// Sistema di palette robuste per GZ Nutrition

export type PaletteConfig = {
  name: string;
  description: string;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  border: string;
  card: string;
  muted: string;
  navbarBg: string;
  navbarText: string;
  secondaryBg: string;
  secondaryText: string;
};

export const PALETTES: Record<string, PaletteConfig> = {
  'gz-default': {
    name: "Default",
    description: "Palette originale verde professionale",
    primary: "#0B5E0B",
    accent: "#00D084", 
    background: "#FFFFFF",
    foreground: "#0E0F12",
    border: "#E2E8F0",
    card: "#FFFFFF",
    muted: "#F1F5F9",
    navbarBg: "rgba(0,0,0,0.8)",
    navbarText: "#FFFFFF",
    secondaryBg: "#F8FAFC",
    secondaryText: "#475569"
  },
  
  'modern-blue': {
    name: "Modern Blue",
    description: "Blu moderno e professionale",
    primary: "#2563EB",
    accent: "#3B82F6",
    background: "#FFFFFF", 
    foreground: "#1E293B",
    border: "#E2E8F0",
    card: "#FFFFFF",
    muted: "#F1F5F9",
    navbarBg: "rgba(30, 41, 59, 0.9)",
    navbarText: "#FFFFFF",
    secondaryBg: "#EFF6FF",
    secondaryText: "#1E40AF"
  },
  
  'elegant-dark': {
    name: "Elegant Dark", 
    description: "Elegante scuro con accenti dorati",
    primary: "#D97706",
    accent: "#F59E0B",
    background: "#FFFFFF",
    foreground: "#1F2937",
    border: "#E5E7EB",
    card: "#FFFFFF", 
    muted: "#F9FAFB",
    navbarBg: "rgba(17, 24, 39, 0.95)",
    navbarText: "#F9FAFB",
    secondaryBg: "#FEF3C7",
    secondaryText: "#92400E"
  },
  
  'nature-green': {
    name: "Nature Green",
    description: "Verde naturale e rilassante",
    primary: "#059669",
    accent: "#10B981",
    background: "#FFFFFF",
    foreground: "#1F2937", 
    border: "#D1FAE5",
    card: "#FFFFFF",
    muted: "#F0FDF4",
    navbarBg: "rgba(6, 78, 59, 0.9)",
    navbarText: "#FFFFFF",
    secondaryBg: "#ECFDF5",
    secondaryText: "#047857"
  },
  
  'warm-orange': {
    name: "Warm Orange",
    description: "Arancione caldo ed energico",
    primary: "#EA580C", 
    accent: "#FB923C",
    background: "#FFFFFF",
    foreground: "#1C1917",
    border: "#E7E5E4",
    card: "#FFFFFF",
    muted: "#FAFAF9", 
    navbarBg: "rgba(124, 45, 18, 0.9)",
    navbarText: "#FFFFFF",
    secondaryBg: "#FED7AA",
    secondaryText: "#C2410C"
  },
  
  'professional-gray': {
    name: "Professional Gray",
    description: "Grigio professionale e neutro",
    primary: "#374151",
    accent: "#6B7280", 
    background: "#FFFFFF",
    foreground: "#111827",
    border: "#E5E7EB",
    card: "#FFFFFF",
    muted: "#F9FAFB",
    navbarBg: "rgba(17, 24, 39, 0.9)",
    navbarText: "#F9FAFB",
    secondaryBg: "#F3F4F6", 
    secondaryText: "#374151"
  }
};

export function getPaletteConfig(paletteId: string): PaletteConfig {
  return PALETTES[paletteId] || PALETTES['gz-default'];
}

export function generateCSSVariables(paletteId: string): Record<string, string> {
  const config = getPaletteConfig(paletteId);
  
  // Helper function to extract RGB values from hex
  const hexToRgb = (hex: string): string => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };
  
  return {
    '--primary': config.primary,
    '--primary-rgb': hexToRgb(config.primary),
    '--accent': config.accent,
    '--accent-rgb': hexToRgb(config.accent),
    '--background': config.background,
    '--foreground': config.foreground,
    '--border': config.border,
    '--card': config.card,
    '--muted-bg': config.muted,
    '--navbar-bg': config.navbarBg,
    '--navbar-text': config.navbarText,
    '--secondary-bg': config.secondaryBg,
    '--secondary-fg': config.secondaryText
  };
}
