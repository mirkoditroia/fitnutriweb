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
                  const palette = localStorage.getItem('gz-palette') || 'gz-default';
                  const palettes = {
                    'gz-default': { primary: '#0B5E0B', navbarBg: 'rgba(0,0,0,0.8)', navbarText: '#FFFFFF' },
                    'modern-blue': { primary: '#2563EB', navbarBg: 'rgba(30, 41, 59, 0.9)', navbarText: '#FFFFFF' },
                    'elegant-dark': { primary: '#D97706', navbarBg: 'rgba(17, 24, 39, 0.95)', navbarText: '#F9FAFB' },
                    'nature-green': { primary: '#059669', navbarBg: 'rgba(6, 78, 59, 0.9)', navbarText: '#FFFFFF' },
                    'warm-orange': { primary: '#EA580C', navbarBg: 'rgba(124, 45, 18, 0.9)', navbarText: '#FFFFFF' },
                    'professional-gray': { primary: '#374151', navbarBg: 'rgba(17, 24, 39, 0.9)', navbarText: '#F9FAFB' }
                  };
                  const colors = palettes[palette] || palettes['gz-default'];
                  document.documentElement.style.setProperty('--primary', colors.primary);
                  document.documentElement.style.setProperty('--navbar-bg', colors.navbarBg);
                  document.documentElement.style.setProperty('--navbar-text', colors.navbarText);
                } catch(e) {}
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
