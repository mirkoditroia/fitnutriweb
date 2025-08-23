"use client";
import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { PackagesCarousel } from "@/components/PackagesCarousel";
import { TrustpilotWall } from "@/components/TrustpilotWall";
import { BookingForm } from "@/components/BookingForm";
import { LandingImages } from "@/components/LandingImages";
import { type SiteContent } from "@/lib/data";
import { getPackages, getSiteContent } from "@/lib/datasource";

export default function LandingClient() {
  const [content, setContent] = useState<SiteContent | null>(null);
  type Pack = { id?: string; title: string; description: string; price: number; imageUrl?: string; featured?: boolean; isActive: boolean; badge?: string };
  const [packages, setPackages] = useState<Pack[] | null>(null);

  useEffect(() => {
    Promise.all([getSiteContent(), getPackages()]).then(([c, p]) => {
      setContent(
        c ?? {
          heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
          heroSubtitle:
            "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
          heroCta: "Prenota ora",
          images: [],
        }
      );
      setPackages(Array.isArray(p) ? p : []);
    });
  }, []);

  if (!content || !packages) return null;
  const featuredFirst = [...packages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <main className="min-h-dvh bg-background text-foreground pt-16">
      <Hero title={content.heroTitle} subtitle={content.heroSubtitle} ctaLabel={content.heroCta} />
      <AboutSection title={content.aboutTitle} body={content.aboutBody} imageUrl={content.aboutImageUrl} />
      {content.images && content.images.length > 0 && (
        <LandingImages images={content.images} />
      )}
      <PackagesCarousel items={featuredFirst} />
      <section id="booking" className="container py-16 sm:py-20 border-t border-foreground/10">
        <h2 className="text-3xl font-bold text-center">Prenota la tua consulenza</h2>
        <p className="mt-4 text-center text-foreground/70 max-w-2xl mx-auto">
          Inizia il tuo percorso di trasformazione. Compila il modulo e ti contatteremo per definire i dettagli.
        </p>
        <div className="mt-8 max-w-lg mx-auto">
          <BookingForm />
        </div>
      </section>
      <TrustpilotWall />
    </main>
  );
}


