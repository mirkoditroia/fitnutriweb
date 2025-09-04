import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ToasterProvider from "@/components/toaster-provider";
import { generateCSSVariables } from "@/lib/palettes";
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
  // Fetch brand info for SSR to eliminate logo loading delay
  let initialBrand: BrandCfg | undefined = undefined;
  
  try {
    if (getDataMode() !== "local") {
      const siteContent = await getSiteContent();
      if (siteContent) {
        initialBrand = {
          mode: siteContent.navbarLogoMode === 'image' ? 'image' : 'text',
          imageUrl: siteContent.navbarLogoImageUrl || undefined,
          height: typeof siteContent.navbarLogoHeight === 'number' ? siteContent.navbarLogoHeight : 40,
          autoBg: Boolean(siteContent.navbarLogoAutoRemoveBg),
          text: siteContent.navbarLogoText || 'GZnutrition',
          weight: typeof siteContent.navbarLogoTextWeight === 'number' ? siteContent.navbarLogoTextWeight : 700,
          size: typeof siteContent.navbarLogoTextSize === 'number' ? siteContent.navbarLogoTextSize : 20,
        };
      }
    }
  } catch (error) {
    // Fallback to null if fetch fails
    console.log('Failed to fetch brand info for SSR:', error);
  }

  // Generate CSS variables for immediate application
  const defaultPalette = {
    primary: '#0B5E0B', accent: '#00D084', background: '#FFFFFF', foreground: '#0E0F12',
    border: '#E2E8F0', card: '#FFFFFF', muted: '#F1F5F9', navbarBg: 'rgba(0,0,0,0.8)',
    navbarText: '#FFFFFF', secondaryBg: '#F8FAFC', secondaryText: '#475569'
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
                --primary: ${defaultPalette.primary} !important;
                --primary-rgb: ${hexToRgb(defaultPalette.primary)} !important;
                --accent: ${defaultPalette.accent} !important;
                --accent-rgb: ${hexToRgb(defaultPalette.accent)} !important;
                --background: ${defaultPalette.background} !important;
                --foreground: ${defaultPalette.foreground} !important;
                --border: ${defaultPalette.border} !important;
                --card: ${defaultPalette.card} !important;
                --muted-bg: ${defaultPalette.muted} !important;
                --navbar-bg: ${defaultPalette.navbarBg} !important;
                --navbar-text: ${defaultPalette.navbarText} !important;
                --secondary-bg: ${defaultPalette.secondaryBg} !important;
                --secondary-fg: ${defaultPalette.secondaryText} !important;
              }
            `
          }}
        />
        {/* Script to override with localStorage palette if available */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Helper function to extract RGB values from hex
                  function hexToRgb(hex) {
                    const h = hex.replace('#', '');
                    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
                    return (n >> 16) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255);
                  }
                  
                  // Try to get palette from localStorage
                  let palette = null;
                  try {
                    if (typeof Storage !== 'undefined' && localStorage) {
                      palette = localStorage.getItem('gz-palette');
                    }
                  } catch(e) {
                    // localStorage not available (incognito mode, etc.) - keep default
                    return;
                  }
                  
                  // Only override if we have a stored palette different from default
                  if (!palette || palette === 'gz-default') return;
                  
                  const palettes = {
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
                  
                  const colors = palettes[palette];
                  if (!colors) return;
                  
                  // Override CSS variables
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
                  // Silent fail - default palette already applied
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
