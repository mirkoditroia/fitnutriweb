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
      
      {/* Sezione Risultati Clienti - se abilitata */}
      {c.resultsSection?.isEnabled && c.resultsSection.photos && c.resultsSection.photos.length > 0 && (
        <section 
          id="results-section" 
          className="py-20 bg-gradient-to-b from-secondary-bg/30 to-background"
        >
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {c.resultsSection.title || "🎯 Risultati dei Nostri Clienti"}
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {c.resultsSection.subtitle || "Trasformazioni reali di persone reali"}
              </p>
            </div>
            
            {/* Griglia responsive di foto */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {c.resultsSection.photos?.map((photo, index) => (
                <div key={photo.id} className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div className="aspect-[4/3] relative">
                    <img
                      src={photo.url}
                      alt={photo.description || `Risultato cliente ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Errore caricamento immagine:', photo.url);
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltbWFnaW5lIG5vbiBkaXNwb25pYmlsZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    
                    {/* Badge tipo foto */}
                    {photo.beforeAfter && photo.beforeAfter !== 'single' && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                        {photo.beforeAfter === 'before' ? 'Prima' : 'Dopo'}
                      </div>
                    )}
                  </div>
                  
                  {/* Descrizione */}
                  {photo.description && (
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{photo.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
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
