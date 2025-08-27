"use client";
import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { PackagesCarousel } from "@/components/PackagesCarousel";
import { TrustpilotWall } from "@/components/TrustpilotWall";
import { BookingForm } from "@/components/BookingForm";
import { LandingImages } from "@/components/LandingImages";
import { ContactSection } from "@/components/ContactSection";
import { FreeConsultationPopup } from "@/components/FreeConsultationPopup";
import { type SiteContent } from "@/lib/data";
import { getPackages, getSiteContent } from "@/lib/datasource";
// Rimosso sistema globale - ora usa approccio diretto

export default function LandingClient() {
  const [content, setContent] = useState<SiteContent | null>(null);
  type Pack = { id?: string; title: string; description: string; price: number; imageUrl?: string; featured?: boolean; isActive: boolean; badge?: string };
  const [packages, setPackages] = useState<Pack[] | null>(null);
  
  // NUOVO SISTEMA DIRETTO - SEMPLICE

  useEffect(() => {
    console.log("LandingClient: useEffect iniziato - chiamata getSiteContent e getPackages");
    
    Promise.all([getSiteContent(), getPackages()]).then(([c, p]) => {
      console.log("LandingClient: Promise.all completata");
      console.log("LandingClient: Contenuto caricato:", c);
      console.log("LandingClient: Pacchetti caricati:", p);
      
      const finalContent = c ?? {
          heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
        heroSubtitle: "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
          heroCta: "Prenota ora",
          heroBackgroundImage: "",
          images: [],
      };
      const finalPackages = Array.isArray(p) ? p : [];
      
      setContent(finalContent);
      setPackages(finalPackages);
      
      // NUOVO SISTEMA: Semplice caricamento dati
      console.log("LandingClient: Dati caricati con successo");
      console.log("LandingClient: finalContent:", finalContent);
      console.log("LandingClient: finalPackages:", finalPackages);
    }).catch(error => {
      console.error("LandingClient: Errore nel caricamento:", error);
    });
  }, []);

  // Non bloccare mai il rendering - usa sempre valori di default
  let finalContent = content;
  if (!finalContent) {
    console.log("LandingClient: Content non caricato, uso valori di default");
    finalContent = {
      heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
      heroSubtitle: "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
      heroCta: "Prenota ora",
      heroBackgroundImage: "",
      heroBadgeText: "Performance • Estetica • Energia",
      heroBadgeColor: "bg-primary text-primary-foreground",
      aboutTitle: "Chi Sono",
      aboutBody: "Sono Gabriele Zambonin, nutrizionista e personal trainer. Ti guido con un metodo scientifico e pratico per raggiungere forma fisica, energia e benessere reale.",
      aboutImageUrl: "",
      images: [],
      contactTitle: "📞 Contattami",
      contactSubtitle: "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
      contactPhone: "+39 123 456 7890",
      contactEmail: "info@gznutrition.it",
      contactAddresses: [
        {
          name: "Studio Principale",
          address: "Via Roma 123",
          city: "Milano",
          postalCode: "20100",
          coordinates: { lat: 45.4642, lng: 9.1900 }
        }
      ],
      socialChannels: [
        {
          platform: "Instagram",
          url: "https://instagram.com/gznutrition",
          icon: "📸"
        }
      ],
      contactSectionTitle: "💬 Contatti Diretti",
      contactSectionSubtitle: "Siamo qui per aiutarti",
      studiosSectionTitle: "🏢 I Nostri Studi",
      studiosSectionSubtitle: "Trova lo studio più vicino a te",
      freeConsultationPopup: {
        isEnabled: true,
        title: "🎯 10 Minuti Consultivi Gratuiti",
        subtitle: "Valuta i tuoi obiettivi gratuitamente",
        description: "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance.",
        ctaText: "Prenota Ora - È Gratis!"
      }
    };
  }
  
  let finalPackages = packages;
  if (!finalPackages) {
    console.log("LandingClient: Packages non caricati, uso array vuoto");
    finalPackages = [];
  }
  
  console.log("LandingClient: Renderizzato - content:", finalContent);
  console.log("LandingClient: Renderizzato - packages:", finalPackages);
  
  // NUOVO SISTEMA: Usa direttamente i dati caricati con fallback robusti
  const effectiveContent = finalContent || {
    heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
    heroSubtitle: "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
    heroCta: "Prenota ora",
    heroBackgroundImage: "",
    heroBadgeText: "Performance • Estetica • Energia",
    heroBadgeColor: "bg-primary text-primary-foreground",
    aboutTitle: "Chi Sono",
    aboutBody: "Sono Gabriele Zambonin, nutrizionista e personal trainer. Ti guido con un metodo scientifico e pratico per raggiungere forma fisica, energia e benessere reale.",
    aboutImageUrl: "",
    images: [],
    contactTitle: "📞 Contattami",
    contactSubtitle: "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
    contactPhone: "+39 123 456 7890",
    contactEmail: "info@gznutrition.it",
    contactAddresses: [
      {
        name: "Studio Principale",
        address: "Via Roma 123",
        city: "Milano",
        postalCode: "20100",
        coordinates: { lat: 45.4642, lng: 9.1900 }
      }
    ],
    socialChannels: [
      {
        platform: "Instagram",
        url: "https://instagram.com/gznutrition",
        icon: "📸"
      },
      {
        platform: "LinkedIn",
        url: "https://linkedin.com/in/gznutrition",
        icon: "💼"
      }
    ],
    contactSectionTitle: "💬 Contatti Diretti",
    contactSectionSubtitle: "Siamo qui per aiutarti",
    studiosSectionTitle: "🏢 I Nostri Studi",
    studiosSectionSubtitle: "Trova lo studio più vicino a te",
    freeConsultationPopup: {
      isEnabled: false,
      title: "🎯 10 Minuti Consultivi Gratuiti",
      subtitle: "Valuta i tuoi obiettivi gratuitamente",
      description: "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance.",
      ctaText: "Prenota Ora - È Gratis!"
    }
  };
  const effectivePackages = finalPackages;
  
  const featuredFirst = [...effectivePackages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  
  console.log("LandingClient: effectiveContent:", effectiveContent);
  console.log("LandingClient: effectivePackages:", effectivePackages);

  // DEBUG: Contatti
  console.log("LandingClient: Rendering sezione contatti");
  console.log("LandingClient: effectiveContent per contatti:", effectiveContent);

  return (
    <main className="min-h-dvh bg-background text-foreground pt-16">
      {/* Popup 10 Minuti Consultivi Gratuiti */}
      {(effectiveContent.freeConsultationPopup && (effectiveContent.freeConsultationPopup.isEnabled === true || String(effectiveContent.freeConsultationPopup.isEnabled) === "true")) && (
        <FreeConsultationPopup
          title={effectiveContent.freeConsultationPopup?.title || "🎯 10 Minuti Consultivi Gratuiti"}
          subtitle={effectiveContent.freeConsultationPopup?.subtitle || "Valuta i tuoi obiettivi gratuitamente"}
          description={effectiveContent.freeConsultationPopup?.description || "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance."}
          ctaText={effectiveContent.freeConsultationPopup?.ctaText || "Prenota Ora - È Gratis!"}
          isEnabled={true}
        />
      )}
      
      {/* Debug popup */}
      {!finalContent.freeConsultationPopup && (
        <div className="text-yellow-500 p-4 border border-yellow-200 rounded m-4">
          <p><strong>Debug - Popup non caricato:</strong></p>
          <p>freeConsultationPopup: {JSON.stringify(finalContent.freeConsultationPopup)}</p>
          <p>content completo: {JSON.stringify(finalContent, null, 2)}</p>
        </div>
      )}
      
      <Hero 
        title={effectiveContent.heroTitle} 
        subtitle={effectiveContent.heroSubtitle} 
        ctaLabel={effectiveContent.heroCta} 
        backgroundImage={effectiveContent.heroBackgroundImage}
        badgeText={effectiveContent.heroBadgeText}
        badgeColor={effectiveContent.heroBadgeColor}
      />
      <AboutSection title={effectiveContent.aboutTitle} body={effectiveContent.aboutBody} imageUrl={effectiveContent.aboutImageUrl} />
      {effectiveContent.images && effectiveContent.images.length > 0 && (
        <LandingImages images={effectiveContent.images} />
      )}
      <PackagesCarousel items={featuredFirst} />
      
      {/* Sezione Prenota Consulenza */}
      <section id="booking" className="container py-16 sm:py-20 border-t border-foreground/10">
        <h2 className="text-3xl font-bold text-center">Prenota la tua consulenza</h2>
        <p className="mt-4 text-center text-foreground/70 max-w-2xl mx-auto">
          Inizia il tuo percorso di trasformazione. Compila il modulo e ti contatteremo per definire i dettagli.
        </p>
        <div className="mt-8 max-w-lg mx-auto" data-booking-form>
          <BookingForm />
        </div>
      </section>
      
      {/* Sezione Contatti - SEMPRE VISIBILE CON FALLBACK GARANTITI */}
      <div id="contatti">
        
        {/* SEZIONE CONTATTI SEMPLIFICATA - SEMPRE VISIBILE */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/20 border-t border-foreground/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                📞 Contattami
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.
              </p>
            </div>

            <div className="grid gap-8 max-w-6xl mx-auto grid-cols-1 lg:grid-cols-2">
              {/* Informazioni di Contatto */}
              <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  💬 Contatti Diretti
                </h3>
                
                <div className="space-y-6">
                  {/* Telefono */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefono</p>
                      <button
                        onClick={() => {
                          const phone = effectiveContent?.contactPhone || "+39 123 456 7890";
                          const cleanPhone = phone.replace(/\s/g, '');
                          const whatsappUrl = `https://wa.me/${cleanPhone}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="text-lg font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
                      >
                        {effectiveContent?.contactPhone || "+39 123 456 7890"}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${effectiveContent?.contactEmail || "info@gznutrition.it"}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        {effectiveContent?.contactEmail || "info@gznutrition.it"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indirizzi Studi */}
              <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  🏢 I Nostri Studi
                </h3>
                
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">Studio Principale</h4>
                        <p className="text-muted-foreground mt-1">
                          Via Roma 123<br />
                          Milano, 20100
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const mapsUrl = `https://www.google.com/maps?q=45.4642,9.1900`;
                          window.open(mapsUrl, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        📍
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Recensioni Trustpilot */}
      <TrustpilotWall />
    </main>
  );
}


