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
import { ContactSection } from "@/components/ContactSection";
import { FreeConsultationPopup } from "@/components/FreeConsultationPopup";

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
      heroBackgroundImage: "",
      images: [],
      colorPalette: "gz-default" as const,
      resultsSection: {
        isEnabled: false,
        title: "🎯 Risultati dei Nostri Clienti",
        subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
        photos: []
      },
    };

  const featuredFirst = [...packages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <main className="min-h-dvh bg-background text-foreground pt-16">
      {/* Popup Promozionale - se abilitato da contenuti */}
      {c.freeConsultationPopup && (c.freeConsultationPopup.isEnabled === true || String(c.freeConsultationPopup.isEnabled) === "true") && (
        <FreeConsultationPopup
          title={c.freeConsultationPopup?.title || "🎯 10 Minuti Consultivi Gratuiti"}
          subtitle={c.freeConsultationPopup?.subtitle || "Valuta i tuoi obiettivi gratuitamente"}
          description={c.freeConsultationPopup?.description || "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance."}
          ctaText={c.freeConsultationPopup?.ctaText || "Prenota Ora - È Gratis!"}
          isEnabled={true}
        />
      )}
      {(() => {
        const heroBg = c.heroBackgroundImage && String(c.heroBackgroundImage).trim() !== ""
          ? c.heroBackgroundImage
          : "/hero-demo.svg";
        return (
          <Hero 
            title={c.heroTitle} 
            subtitle={c.heroSubtitle} 
            ctaLabel={c.heroCta} 
            backgroundImage={heroBg}
            badgeText={c.heroBadgeText}
            badgeColor={c.heroBadgeColor}
          />
        );
      })()}
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
      {/* Contatti - sempre visibili con fallback */}
      <div id="contatti" className="border-t border-foreground/10">
        <ContactSection
          contactInfo={{
            title: c.contactTitle || "📞 Contattami",
            subtitle: c.contactSubtitle || "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
            phone: c.contactPhone || "+39 123 456 7890",
            email: c.contactEmail || "info@gznutrition.it",
            addresses: Array.isArray(c.contactAddresses) && c.contactAddresses.length > 0
              ? c.contactAddresses
              : [
                {
                  name: "Studio Principale",
                  address: "Via Roma 123",
                  city: "Milano",
                  postalCode: "20100",
                  coordinates: { lat: 45.4642, lng: 9.19 },
                },
              ],
            socialChannels: Array.isArray(c.socialChannels) && c.socialChannels.length > 0
              ? c.socialChannels
              : [
                { platform: "Instagram", url: "https://instagram.com/gznutrition", icon: "📸" },
                { platform: "LinkedIn", url: "https://linkedin.com/in/gznutrition", icon: "💼" },
              ],
            contactTitle: c.contactSectionTitle || "💬 Contatti Diretti",
            contactSubtitle: c.contactSectionSubtitle || "Siamo qui per aiutarti",
            studiosTitle: c.studiosSectionTitle || "🏢 I Nostri Studi",
            studiosSubtitle: c.studiosSectionSubtitle || "Trova lo studio più vicino a te",
          }}
        />
      </div>
      <TrustpilotWall />
    </main>
  );
}
