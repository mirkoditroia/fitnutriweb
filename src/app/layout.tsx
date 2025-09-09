import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CookieBanner } from "@/components/CookieBanner";
import ToasterProvider from "@/components/toaster-provider";
import FaviconManager from "@/components/FaviconManager";
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
  let initialSiteContent: any = null;
  
  try {
    console.log('🏗️ [LAYOUT] Caricamento contenuti sito...');
    const siteContent = await getSiteContent();
    console.log('🏗️ [LAYOUT] Contenuti caricati:', !!siteContent);
    console.log('🏗️ [LAYOUT] Favicon trovato:', siteContent?.favicon || 'nessuno');
    
    if (siteContent) {
      // Store full site content for navbar (both local and production)
      initialSiteContent = siteContent;
      
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
    } else {
      console.log('🏗️ [LAYOUT] Nessun contenuto caricato - usando defaults');
    }
  } catch (error) {
    // Fallback to defaults if fetch fails
    console.error('🏗️ [LAYOUT] Errore nel caricamento contenuti per SSR:', error);
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
        {/* ✅ RIMOSSO localStorage override per palette - causava problemi di sincronizzazione */}
        {/* La palette viene ora caricata SOLO dal server per garantire coerenza tra dispositivi */}
        {initialBrand?.mode === 'image' && initialBrand.imageUrl && (
          <link rel="preload" as="image" href={initialBrand.imageUrl} />
        )}
        {/* Favicon gestito dinamicamente da FaviconManager */}
        {initialSiteContent?.favicon && (
          <link rel="icon" href={initialSiteContent.favicon} />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 font-sans`}>
        <FaviconManager initialFavicon={initialSiteContent?.favicon} />
        <Navbar initialBrand={initialBrand} initialSiteContent={initialSiteContent} />
        <ToasterProvider />
        {children}
        <Footer />
        <CookieBanner />
        <script dangerouslySetInnerHTML={{
          __html: `console.log('🏗️ [LAYOUT-CLIENT] Favicon passato al FaviconManager:', ${JSON.stringify(initialSiteContent?.favicon || null)});`
        }} />
      </body>
    </html>
  );
}
