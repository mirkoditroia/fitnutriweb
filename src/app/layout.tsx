import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ToasterProvider from "@/components/toaster-provider";

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
  // Precarica contenuti per brand SSR per evitare flash
  const { getSiteContent } = await import("@/lib/datasource");
  const c = await getSiteContent();
  const initialBrand = {
    mode: c?.navbarLogoMode === 'image' ? 'image' as const : 'text' as const,
    imageUrl: c?.navbarLogoImageUrl || undefined,
    height: typeof c?.navbarLogoHeight === 'number' ? c?.navbarLogoHeight : 40,
    autoBg: Boolean(c?.navbarLogoAutoRemoveBg),
    text: c?.navbarLogoText || 'GZnutrition',
    color: c?.navbarLogoTextColor || undefined,
    weight: typeof c?.navbarLogoTextWeight === 'number' ? c?.navbarLogoTextWeight : 700,
    size: typeof c?.navbarLogoTextSize === 'number' ? c?.navbarLogoTextSize : 20,
  };
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}>
        <Navbar initialBrand={initialBrand} />
        <ToasterProvider />
        {children}
        <Footer />
      </body>
    </html>
  );
}
