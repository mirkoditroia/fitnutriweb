import { SiteContent } from "@/lib/data";
import { getPackages, getSiteContent } from "@/lib/datasource";
import { getDataMode } from "@/lib/datamode";
import LandingClient from "@/components/LandingClient";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { LandingImages } from "@/components/LandingImages";
import { PackagesCarousel } from "@/components/PackagesCarousel";
import { TrustpilotWall } from "@/components/TrustpilotWall";
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
    };

  const featuredFirst = [...packages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <main className="min-h-dvh bg-background text-foreground pt-16">
      <Hero title={c.heroTitle} subtitle={c.heroSubtitle} ctaLabel={c.heroCta} />
      <AboutSection title={c.aboutTitle} body={c.aboutBody} imageUrl={c.aboutImageUrl} />
      <LandingImages images={c.images} />
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
