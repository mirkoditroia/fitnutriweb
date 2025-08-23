"use client";
import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { PackagesCarousel } from "@/components/PackagesCarousel";
import { TrustpilotWall } from "@/components/TrustpilotWall";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { BookingForm } from "@/components/BookingForm";
import { defaultFaq, type SiteContent } from "@/lib/data";
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
          faq: defaultFaq,
        }
      );
      setPackages(Array.isArray(p) ? p : []);
    });
  }, []);

  if (!content || !packages) return null;
  const faqItems = content.faq?.length ? content.faq : defaultFaq;
  const featuredFirst = [...packages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <Hero title={content.heroTitle} subtitle={content.heroSubtitle} ctaLabel={content.heroCta} />
      <AboutSection title={content.aboutTitle} body={content.aboutBody} imageUrl={content.aboutImageUrl} />
      <PackagesCarousel items={featuredFirst} />
      <TrustpilotWall />
      <FAQ items={faqItems} />
      <section id="booking" className="container py-12 border-t border-[color:var(--border)]">
        <h2 className="text-2xl font-bold">Prenotazione</h2>
        <p className="text-foreground/70 mt-2">Compila i dati e ti ricontattiamo.</p>
        <div className="mt-6">
          <BookingForm />
        </div>
      </section>
      <FinalCTA />
    </main>
  );
}


