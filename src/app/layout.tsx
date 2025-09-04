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

  return (
    <html lang="it">
      <head>
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
                  
                  // Try to get palette from localStorage, fallback to default
                  let palette = 'gz-default';
                  try {
                    if (typeof Storage !== 'undefined' && localStorage) {
                      palette = localStorage.getItem('gz-palette') || 'gz-default';
                    }
                  } catch(e) {
                    // localStorage not available (incognito mode, etc.)
                    palette = 'gz-default';
                  }
                  
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
                  
                  const colors = palettes[palette] || palettes['gz-default'];
                  
                  // Apply all CSS variables
                  const root = document.documentElement;
                  root.style.setProperty('--primary', colors.primary);
                  root.style.setProperty('--primary-rgb', hexToRgb(colors.primary));
                  root.style.setProperty('--accent', colors.accent);
                  root.style.setProperty('--accent-rgb', hexToRgb(colors.accent));
                  root.style.setProperty('--background', colors.background);
                  root.style.setProperty('--foreground', colors.foreground);
                  root.style.setProperty('--border', colors.border);
                  root.style.setProperty('--card', colors.card);
                  root.style.setProperty('--muted-bg', colors.muted);
                  root.style.setProperty('--navbar-bg', colors.navbarBg);
                  root.style.setProperty('--navbar-text', colors.navbarText);
                  root.style.setProperty('--secondary-bg', colors.secondaryBg);
                  root.style.setProperty('--secondary-fg', colors.secondaryText);
                } catch(e) {
                  // Complete fallback - apply default palette
                  console.log('Palette loading failed, applying default');
                  const root = document.documentElement;
                  root.style.setProperty('--primary', '#0B5E0B');
                  root.style.setProperty('--primary-rgb', '11, 94, 11');
                  root.style.setProperty('--navbar-bg', 'rgba(0,0,0,0.8)');
                  root.style.setProperty('--navbar-text', '#FFFFFF');
                  root.style.setProperty('--background', '#FFFFFF');
                  root.style.setProperty('--foreground', '#0E0F12');
                  root.style.setProperty('--card', '#FFFFFF');
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
