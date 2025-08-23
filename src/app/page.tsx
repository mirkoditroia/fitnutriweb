import { defaultFaq, SiteContent } from "@/lib/data";
import { getPackages, getSiteContent } from "@/lib/datasource";
import { getDataMode } from "@/lib/datamode";
import LandingClient from "@/components/LandingClient";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { LandingImages } from "@/components/LandingImages";
import { PackagesCarousel } from "@/components/PackagesCarousel";
import { TrustpilotWall } from "@/components/TrustpilotWall";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { BookingForm } from "@/components/BookingForm";

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (getDataMode() === "local") {
    return <LandingClient />;
  }
  const [content, packages] = await Promise.all([
    getSiteContent(),
    getPackages(),
  ]);
  const c: SiteContent =
    content ?? {
      heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
      heroSubtitle:
        "Coaching nutrizionale e training su misura per giovani adulti 20–35. Risultati misurabili, approccio scientifico, estetica e performance al centro.",
      heroCta: "Prenota ora",
      images: [],
      faq: defaultFaq,
    };

  const faqItems = (content?.faq?.length ? content.faq : defaultFaq)!;

  const featuredFirst = [...packages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const searchParams = new URLSearchParams();
  if (typeof window === "undefined") {
    // no-op on server; client form will parse real query
  }
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <Hero title={c.heroTitle} subtitle={c.heroSubtitle} ctaLabel={c.heroCta} />
      <AboutSection title={c.aboutTitle} body={c.aboutBody} imageUrl={c.aboutImageUrl} />
      <LandingImages images={c.images} />
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
