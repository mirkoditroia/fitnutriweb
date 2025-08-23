import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
