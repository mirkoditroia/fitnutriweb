import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ToasterProvider from "@/components/toaster-provider";
import { generateCSSVariables, getPaletteConfig } from "@/lib/palettes";
import { getSiteContent } from "@/lib/datasource";
import { getDataMode } from "@/lib/datamode";

type BrandCfg = { 
  mode: "image" | "text"; 
  imageUrl?: string; 
  height?: number; 
  autoBg?: boolean; 
  text?: string; 
  color?: string; 
  weight?: number; 
  size?: number 
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GZnutrition — Trasformazione fisica e performance",
    template: "%s | GZnutrition",
  },
  description:
    "Coaching nutrizionale e training per giovani adulti: estetica, performance, risultati misurabili.",
  metadataBase: new URL("https://gznutrition.example"),
  openGraph: {
    title: "GZnutrition — Trasformazione fisica e performance",
    description:
      "Coaching nutrizionale e training per giovani adulti: estetica, performance, risultati misurabili.",
    type: "website",
    locale: "it_IT",
    siteName: "GZnutrition",
  },
  twitter: {
    card: "summary_large_image",
    title: "GZnutrition — Trasformazione fisica e performance",
    description:
      "Coaching nutrizionale e training per giovani adulti: estetica, performance, risultati misurabili.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch site content for SSR including brand info and palette
  let initialBrand: BrandCfg | undefined = undefined;
  let serverPalette: string = 'gz-default';
  
  try {
    if (getDataMode() !== "local") {
      const siteContent = await getSiteContent();
      if (siteContent) {
        // Extract brand info
        initialBrand = {
          mode: siteContent.navbarLogoMode === 'image' ? 'image' : 'text',
          imageUrl: siteContent.navbarLogoImageUrl || undefined,
          height: typeof siteContent.navbarLogoHeight === 'number' ? siteContent.navbarLogoHeight : 40,
          autoBg: Boolean(siteContent.navbarLogoAutoRemoveBg),
          text: siteContent.navbarLogoText || 'GZnutrition',
          weight: typeof siteContent.navbarLogoTextWeight === 'number' ? siteContent.navbarLogoTextWeight : 700,
          size: typeof siteContent.navbarLogoTextSize === 'number' ? siteContent.navbarLogoTextSize : 20,
        };
        
        // Extract palette from server content 
        serverPalette = siteContent.colorPalette || 'gz-default';
      }
    }
  } catch (error) {
    // Fallback to defaults if fetch fails
    console.log('Failed to fetch site content for SSR:', error);
  }

  // Generate CSS variables using server palette
  const serverPaletteConfig = getPaletteConfig(serverPalette);
  const initialPalette = {
    primary: serverPaletteConfig.primary,
    accent: serverPaletteConfig.accent,
    background: serverPaletteConfig.background,
    foreground: serverPaletteConfig.foreground,
    border: serverPaletteConfig.border,
    card: serverPaletteConfig.card,
    muted: serverPaletteConfig.muted,
    navbarBg: serverPaletteConfig.navbarBg,
    navbarText: serverPaletteConfig.navbarText,
    secondaryBg: serverPaletteConfig.secondaryBg,
    secondaryText: serverPaletteConfig.secondaryText
  };

  const hexToRgb = (hex: string): string => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };

  return (
    <html lang="it">
      <head>
        {/* CSS Variables applied IMMEDIATELY - no JavaScript delay */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${initialPalette.primary} !important;
                --primary-rgb: ${hexToRgb(initialPalette.primary)} !important;
                --accent: ${initialPalette.accent} !important;
                --accent-rgb: ${hexToRgb(initialPalette.accent)} !important;
                --background: ${initialPalette.background} !important;
                --foreground: ${initialPalette.foreground} !important;
                --border: ${initialPalette.border} !important;
                --card: ${initialPalette.card} !important;
                --muted-bg: ${initialPalette.muted} !important;
                --navbar-bg: ${initialPalette.navbarBg} !important;
                --navbar-text: ${initialPalette.navbarText} !important;
                --secondary-bg: ${initialPalette.secondaryBg} !important;
                --secondary-fg: ${initialPalette.secondaryText} !important;
              }
            `
          }}
        />
        {/* Script to apply localStorage palette override if available and different from server */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Server palette is already applied: ${serverPalette}
                  
                  // Helper function to extract RGB values from hex
                  function hexToRgb(hex) {
                    const h = hex.replace('#', '');
                    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
                    return (n >> 16) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255);
                  }
                  
                  // Try to get palette from localStorage
                  let localPalette = null;
                  try {
                    if (typeof Storage !== 'undefined' && localStorage) {
                      localPalette = localStorage.getItem('gz-palette');
                    }
                  } catch(e) {
                    // localStorage not available (incognito mode, etc.) - server palette already applied
                    return;
                  }
                  
                  // Only override if we have a local palette different from server palette
                  if (!localPalette || localPalette === '${serverPalette}') return;
                  
                  const palettes = {
                    'gz-default': {
                      primary: '#0B5E0B', accent: '#00D084', background: '#FFFFFF', foreground: '#0E0F12',
                      border: '#E2E8F0', card: '#FFFFFF', muted: '#F1F5F9', navbarBg: 'rgba(0,0,0,0.8)',
                      navbarText: '#FFFFFF', secondaryBg: '#F8FAFC', secondaryText: '#475569'
                    },
                    'modern-blue': {
                      primary: '#2563EB', accent: '#3B82F6', background: '#FFFFFF', foreground: '#1E293B',
                      border: '#E2E8F0', card: '#FFFFFF', muted: '#F1F5F9', navbarBg: 'rgba(30, 41, 59, 0.9)',
                      navbarText: '#FFFFFF', secondaryBg: '#EFF6FF', secondaryText: '#1E40AF'
                    },
                    'elegant-dark': {
                      primary: '#D97706', accent: '#F59E0B', background: '#FFFFFF', foreground: '#1F2937',
                      border: '#E5E7EB', card: '#FFFFFF', muted: '#F9FAFB', navbarBg: 'rgba(17, 24, 39, 0.95)',
                      navbarText: '#F9FAFB', secondaryBg: '#FEF3C7', secondaryText: '#92400E'
                    },
                    'nature-green': {
                      primary: '#059669', accent: '#10B981', background: '#FFFFFF', foreground: '#1F2937',
                      border: '#D1FAE5', card: '#FFFFFF', muted: '#F0FDF4', navbarBg: 'rgba(6, 78, 59, 0.9)',
                      navbarText: '#FFFFFF', secondaryBg: '#ECFDF5', secondaryText: '#047857'
                    },
                    'warm-orange': {
                      primary: '#EA580C', accent: '#FB923C', background: '#FFFFFF', foreground: '#1C1917',
                      border: '#E7E5E4', card: '#FFFFFF', muted: '#FAFAF9', navbarBg: 'rgba(124, 45, 18, 0.9)',
                      navbarText: '#FFFFFF', secondaryBg: '#FED7AA', secondaryText: '#C2410C'
                    },
                    'professional-gray': {
                      primary: '#374151', accent: '#6B7280', background: '#FFFFFF', foreground: '#111827',
                      border: '#E5E7EB', card: '#FFFFFF', muted: '#F9FAFB', navbarBg: 'rgba(17, 24, 39, 0.9)',
                      navbarText: '#F9FAFB', secondaryBg: '#F3F4F6', secondaryText: '#374151'
                    }
                  };
                  
                  const colors = palettes[localPalette];
                  if (!colors) return;
                  
                  // Override CSS variables with localStorage palette
                  const root = document.documentElement;
                  root.style.setProperty('--primary', colors.primary, 'important');
                  root.style.setProperty('--primary-rgb', hexToRgb(colors.primary), 'important');
                  root.style.setProperty('--accent', colors.accent, 'important');
                  root.style.setProperty('--accent-rgb', hexToRgb(colors.accent), 'important');
                  root.style.setProperty('--background', colors.background, 'important');
                  root.style.setProperty('--foreground', colors.foreground, 'important');
                  root.style.setProperty('--border', colors.border, 'important');
                  root.style.setProperty('--card', colors.card, 'important');
                  root.style.setProperty('--muted-bg', colors.muted, 'important');
                  root.style.setProperty('--navbar-bg', colors.navbarBg, 'important');
                  root.style.setProperty('--navbar-text', colors.navbarText, 'important');
                  root.style.setProperty('--secondary-bg', colors.secondaryBg, 'important');
                  root.style.setProperty('--secondary-fg', colors.secondaryText, 'important');
                } catch(e) {
                  // Silent fail - server palette already applied
                }
              })();
            `
          }}
        />
        {initialBrand?.mode === 'image' && initialBrand.imageUrl && (
          <link rel="preload" as="image" href={initialBrand.imageUrl} />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 font-sans`}>
        <Navbar initialBrand={initialBrand} />
        <ToasterProvider />
        {children}
        <Footer />
      </body>
    </html>
  );
}
