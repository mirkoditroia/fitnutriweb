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
            
            {/* Carosello/Griglia moderna di foto */}
            <div className="relative">
              {/* Controlli Desktop - Griglia */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {c.resultsSection.photos?.map((photo, index) => (
                  <div key={photo.id} className="group relative">
                    {/* Card con effetto hover */}
                    <div className="relative bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      {/* Immagine con overlay gradiente */}
                      <div className="aspect-[4/5] relative overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.description || `Risultato cliente ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        
                        {/* Overlay gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Badge tipo foto - più elegante */}
                        {photo.beforeAfter && photo.beforeAfter !== 'single' && (
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20 ${
                              photo.beforeAfter === 'before' 
                                ? 'bg-blue-500/80 text-white' 
                                : 'bg-green-500/80 text-white'
                            }`}>
                              {photo.beforeAfter === 'before' ? '✨ Prima' : '🎯 Dopo'}
                            </span>
                          </div>
                        )}
                        
                        {/* Numero risultato */}
                        <div className="absolute top-3 left-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                      
                      {/* Descrizione con styling moderno */}
                      {photo.description && (
                        <div className="p-5">
                          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                            {photo.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile - Carosello scorrevole */}
              <div className="md:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {c.resultsSection.photos?.map((photo, index) => (
                    <div key={photo.id} className="flex-none w-72 snap-start">
                      <div className="bg-card rounded-xl overflow-hidden shadow-lg">
                        <div className="aspect-[4/5] relative">
                          <img
                            src={photo.url}
                            alt={photo.description || `Risultato cliente ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Badge mobile */}
                          {photo.beforeAfter && photo.beforeAfter !== 'single' && (
                            <div className="absolute top-2 right-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                photo.beforeAfter === 'before' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-green-500 text-white'
                              }`}>
                                {photo.beforeAfter === 'before' ? 'Prima' : 'Dopo'}
                              </span>
                            </div>
                          )}
                          
                          <div className="absolute top-2 left-2">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                          </div>
                        </div>
                        
                        {photo.description && (
                          <div className="p-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">{photo.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Indicatore scroll mobile */}
                <div className="flex justify-center mt-4">
                  <p className="text-xs text-muted-foreground">← Scorri per vedere tutti i risultati →</p>
                </div>
              </div>
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
