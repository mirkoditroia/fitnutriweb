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

export default function LandingClient() {
  const [content, setContent] = useState<SiteContent | null>(null);
  type Pack = { id?: string; title: string; description: string; price: number; imageUrl?: string; featured?: boolean; isActive: boolean; badge?: string };
  const [packages, setPackages] = useState<Pack[] | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>();

  // Funzione per estrarre il packageId dall'URL
  const getPackageIdFromUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('packageId') || undefined;
    }
    return undefined;
  };

  useEffect(() => {
    // Gestisce il packageId dall'URL iniziale
    setSelectedPackageId(getPackageIdFromUrl());

    // Listener per eventi personalizzati di selezione pacchetti
    const handlePackageSelected = (event: CustomEvent) => {
      console.log("LandingClient: Evento packageSelected ricevuto:", event);
      console.log("LandingClient: Event detail:", event.detail);
      const { packageId } = event.detail;
      console.log("LandingClient: Pacchetto selezionato:", packageId);
      setSelectedPackageId(packageId);
    };

    // Listener per popstate (navigazione browser)
    const handlePopState = () => {
      const newPackageId = getPackageIdFromUrl();
      console.log("LandingClient: PopState - nuovo packageId:", newPackageId);
      setSelectedPackageId(newPackageId);
    };

    // Fallback: controlla l'URL ogni 500ms per cambiamenti (più veloce per Firebase)
    const urlCheckInterval = setInterval(() => {
      const currentPackageId = getPackageIdFromUrl();
      if (currentPackageId !== selectedPackageId) {
        console.log("LandingClient: Fallback - packageId cambiato nell'URL:", currentPackageId);
        setSelectedPackageId(currentPackageId);
        
        // Forza l'aggiornamento del form anche se gli eventi non funzionano
        const bookingForm = document.querySelector('[data-booking-form]');
        if (bookingForm) {
          console.log("LandingClient: Forzo aggiornamento form");
          const event = new CustomEvent('forcePackageUpdate', { detail: { packageId: currentPackageId } });
          bookingForm.dispatchEvent(event);
        }
      }
    }, 500);

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('packageSelected', handlePackageSelected as EventListener);
    document.addEventListener('packageSelected', handlePackageSelected as EventListener);
    
    console.log("LandingClient: Event listener registrati");
    console.log("LandingClient: Listener packageSelected registrato:", handlePackageSelected);
    console.log("LandingClient: Listener popstate registrato:", handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('packageSelected', handlePackageSelected as EventListener);
      document.removeEventListener('packageSelected', handlePackageSelected as EventListener);
      clearInterval(urlCheckInterval);
    };
  }, [selectedPackageId]);

  useEffect(() => {
    console.log("LandingClient: useEffect iniziato - chiamata getSiteContent e getPackages");
    
    Promise.all([getSiteContent(), getPackages()]).then(([c, p]) => {
      console.log("LandingClient: Promise.all completata");
      console.log("LandingClient: Contenuto caricato:", c);
      console.log("LandingClient: Pacchetti caricati:", p);
      
      setContent(
        c ?? {
          heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
          heroSubtitle:
            "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
          heroCta: "Prenota ora",
          heroBackgroundImage: "",
          images: [],
        }
      );
      setPackages(Array.isArray(p) ? p : []);
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
  const featuredFirst = [...finalPackages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  // Determina se è una consultazione gratuita
  const isFreeConsultation = selectedPackageId === 'free-consultation';
  
  console.log("LandingClient: selectedPackageId:", selectedPackageId);
  console.log("LandingClient: isFreeConsultation:", isFreeConsultation);

  return (
    <main className="min-h-dvh bg-background text-foreground pt-16">
      {/* Popup 10 Minuti Consultivi Gratuiti */}
      {(finalContent.freeConsultationPopup && (finalContent.freeConsultationPopup.isEnabled === true || String(finalContent.freeConsultationPopup.isEnabled) === "true")) && (
        <FreeConsultationPopup
          title={finalContent.freeConsultationPopup?.title || "🎯 10 Minuti Consultivi Gratuiti"}
          subtitle={finalContent.freeConsultationPopup?.subtitle || "Valuta i tuoi obiettivi gratuitamente"}
          description={finalContent.freeConsultationPopup?.description || "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance."}
          ctaText={finalContent.freeConsultationPopup?.ctaText || "Prenota Ora - È Gratis!"}
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
        title={finalContent.heroTitle} 
        subtitle={finalContent.heroSubtitle} 
        ctaLabel={finalContent.heroCta} 
        backgroundImage={finalContent.heroBackgroundImage}
        badgeText={finalContent.heroBadgeText}
        badgeColor={finalContent.heroBadgeColor}
      />
      <AboutSection title={finalContent.aboutTitle} body={finalContent.aboutBody} imageUrl={finalContent.aboutImageUrl} />
      {finalContent.images && finalContent.images.length > 0 && (
        <LandingImages images={finalContent.images} />
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
            packageId={selectedPackageId} 
            isFreeConsultation={isFreeConsultation}
            packages={finalPackages} // Passo i pacchetti caricati
          />
        </div>
      </section>
      
      {/* Sezione Contatti - POSIZIONATA CORRETTAMENTE */}
      <div id="contatti">
        <ContactSection 
          contactInfo={{
            title: finalContent.contactTitle || "📞 Contattami",
            subtitle: finalContent.contactSubtitle || "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
            phone: finalContent.contactPhone || "+39 123 456 7890",
            email: finalContent.contactEmail || "info@gznutrition.it",
            addresses: finalContent.contactAddresses && finalContent.contactAddresses.length > 0 ? finalContent.contactAddresses : [
              {
                name: "Studio Principale",
                address: "Via Roma 123",
                city: "Milano",
                postalCode: "20100",
                coordinates: { lat: 45.4642, lng: 9.1900 }
              }
            ],
            socialChannels: finalContent.socialChannels && finalContent.socialChannels.length > 0 ? finalContent.socialChannels : [
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
            contactTitle: finalContent.contactSectionTitle || "💬 Contatti Diretti",
            contactSubtitle: finalContent.contactSectionSubtitle || "Siamo qui per aiutarti",
            studiosTitle: finalContent.studiosSectionTitle || "🏢 I Nostri Studi",
            studiosSubtitle: finalContent.studiosSectionSubtitle || "Trova lo studio più vicino a te"
          }} 
        />
      </div>
      
      {/* Recensioni Trustpilot */}
      <TrustpilotWall />
    </main>
  );
}


