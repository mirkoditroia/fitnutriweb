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
import { subscribeToGlobalState, getGlobalState, initializeFromUrl, setPackages as setGlobalPackages, setSiteContent as setGlobalSiteContent } from "@/lib/globalState";

export default function LandingClient() {
  const [content, setContent] = useState<SiteContent | null>(null);
  type Pack = { id?: string; title: string; description: string; price: number; imageUrl?: string; featured?: boolean; isActive: boolean; badge?: string };
  const [packages, setPackages] = useState<Pack[] | null>(null);
  
  // SOLUZIONE DEFINITIVA: Usa stato globale invece di eventi
  const [globalState, setGlobalStateLocal] = useState(getGlobalState());

  // Funzione rimossa: ora gestita da globalState.initializeFromUrl()

  // SOLUZIONE DEFINITIVA: Sostituisce completamente il sistema di eventi
  useEffect(() => {
    console.log("LandingClient: Inizializzazione stato globale");
    
    // Inizializza da URL
    initializeFromUrl();
    
    // Sottoscrivi ai cambiamenti dello stato globale
    const unsubscribe = subscribeToGlobalState((newState) => {
      console.log("LandingClient: Stato globale cambiato:", newState);
      setGlobalStateLocal(newState);
    });
    
    return unsubscribe;
  }, []);

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
      
      // SOLUZIONE DEFINITIVA: Sincronizza con stato globale
      console.log("LandingClient: Sincronizzando con stato globale");
      console.log("LandingClient: finalContent:", finalContent);
      console.log("LandingClient: finalPackages:", finalPackages);
      
      setGlobalSiteContent(finalContent);
      setGlobalPackages(finalPackages);
      
      // Forza l'inizializzazione del packageId dall'URL dopo aver caricato i pacchetti
      setTimeout(() => {
        console.log("LandingClient: Forzando inizializzazione da URL dopo caricamento dati");
        initializeFromUrl();
      }, 100);
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
  
  console.log("LandingClient: Stato globale attuale:", globalState);
  console.log("LandingClient: selectedPackageId dallo stato globale:", globalState.selectedPackageId);
  console.log("LandingClient: isFreeConsultation dallo stato globale:", globalState.isFreeConsultation);
  console.log("LandingClient: siteContent dallo stato globale:", globalState.siteContent);
  
  // Usa i dati dallo stato globale se disponibili, altrimenti fallback ai dati locali
  const effectiveContent = globalState.siteContent || finalContent;
  const effectivePackages = globalState.packages.length > 0 ? globalState.packages : finalPackages;
  
  const featuredFirst = [...effectivePackages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  
  console.log("LandingClient: effectiveContent:", effectiveContent);
  console.log("LandingClient: effectivePackages:", effectivePackages);

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
          <BookingForm 
            packageId={globalState.selectedPackageId || undefined} 
            isFreeConsultation={globalState.isFreeConsultation}
            packages={effectivePackages} // Usa pacchetti effettivi
          />
        </div>
      </section>
      
      {/* Sezione Contatti - POSIZIONATA CORRETTAMENTE */}
      <div id="contatti">
        <ContactSection 
          contactInfo={{
            title: effectiveContent.contactTitle || "📞 Contattami",
            subtitle: effectiveContent.contactSubtitle || "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
            phone: effectiveContent.contactPhone || "+39 123 456 7890",
            email: effectiveContent.contactEmail || "info@gznutrition.it",
            addresses: effectiveContent.contactAddresses && effectiveContent.contactAddresses.length > 0 ? effectiveContent.contactAddresses : [
              {
                name: "Studio Principale",
                address: "Via Roma 123",
                city: "Milano",
                postalCode: "20100",
                coordinates: { lat: 45.4642, lng: 9.1900 }
              }
            ],
            socialChannels: effectiveContent.socialChannels && effectiveContent.socialChannels.length > 0 ? effectiveContent.socialChannels : [
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
            contactTitle: effectiveContent.contactSectionTitle || "💬 Contatti Diretti",
            contactSubtitle: effectiveContent.contactSectionSubtitle || "Siamo qui per aiutarti",
            studiosTitle: effectiveContent.studiosSectionTitle || "🏢 I Nostri Studi",
            studiosSubtitle: effectiveContent.studiosSectionSubtitle || "Trova lo studio più vicino a te"
          }} 
        />
      </div>
      
      {/* Recensioni Trustpilot */}
      <TrustpilotWall />
    </main>
  );
}


