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
    
    console.log("LandingClient: Event listener registrati");
    console.log("LandingClient: Listener packageSelected registrato:", handlePackageSelected);
    console.log("LandingClient: Listener popstate registrato:", handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('packageSelected', handlePackageSelected as EventListener);
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

  if (!content || !packages) {
    console.log("LandingClient: Non renderizzato - content:", content);
    console.log("LandingClient: Non renderizzato - packages:", packages);
    console.log("LandingClient: Non renderizzato - content è null:", content === null);
    console.log("LandingClient: Non renderizzato - packages è null:", packages === null);
    return null;
  }
  
  console.log("LandingClient: Renderizzato - content:", content);
  console.log("LandingClient: Renderizzato - packages:", packages);
  const featuredFirst = [...packages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  // Determina se è una consultazione gratuita
  const isFreeConsultation = selectedPackageId === 'free-consultation';
  
  console.log("LandingClient: selectedPackageId:", selectedPackageId);
  console.log("LandingClient: isFreeConsultation:", isFreeConsultation);

  return (
    <main className="min-h-dvh bg-background text-foreground pt-16">
      {/* Popup 10 Minuti Consultivi Gratuiti */}
      {(content.freeConsultationPopup && (content.freeConsultationPopup.isEnabled === true || String(content.freeConsultationPopup.isEnabled) === "true")) && (
        <FreeConsultationPopup
          title={content.freeConsultationPopup?.title || "🎯 10 Minuti Consultivi Gratuiti"}
          subtitle={content.freeConsultationPopup?.subtitle || "Valuta i tuoi obiettivi gratuitamente"}
          description={content.freeConsultationPopup?.description || "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance."}
          ctaText={content.freeConsultationPopup?.ctaText || "Prenota Ora - È Gratis!"}
          isEnabled={true}
        />
      )}
      
      {/* Debug popup */}
      {!content.freeConsultationPopup && (
        <div className="text-yellow-500 p-4 border border-yellow-200 rounded m-4">
          <p><strong>Debug - Popup non caricato:</strong></p>
          <p>freeConsultationPopup: {JSON.stringify(content.freeConsultationPopup)}</p>
          <p>content completo: {JSON.stringify(content, null, 2)}</p>
        </div>
      )}
      
      <Hero 
        title={content.heroTitle} 
        subtitle={content.heroSubtitle} 
        ctaLabel={content.heroCta} 
        backgroundImage={content.heroBackgroundImage}
        badgeText={content.heroBadgeText}
        badgeColor={content.heroBadgeColor}
      />
      <AboutSection title={content.aboutTitle} body={content.aboutBody} imageUrl={content.aboutImageUrl} />
      {content.images && content.images.length > 0 && (
        <LandingImages images={content.images} />
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
            packages={packages} // Passo i pacchetti caricati
          />
        </div>
      </section>
      
      {/* Sezione Contatti - POSIZIONATA CORRETTAMENTE */}
      <div id="contatti">
        <ContactSection 
          contactInfo={{
            title: content.contactTitle || "📞 Contattami",
            subtitle: content.contactSubtitle || "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
            phone: content.contactPhone || "+39 123 456 7890",
            email: content.contactEmail || "info@gznutrition.it",
            addresses: content.contactAddresses && content.contactAddresses.length > 0 ? content.contactAddresses : [
              {
                name: "Studio Principale",
                address: "Via Roma 123",
                city: "Milano",
                postalCode: "20100",
                coordinates: { lat: 45.4642, lng: 9.1900 }
              }
            ],
            socialChannels: content.socialChannels && content.socialChannels.length > 0 ? content.socialChannels : [
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
            contactTitle: content.contactSectionTitle || "💬 Contatti Diretti",
            contactSubtitle: content.contactSectionSubtitle || "Siamo qui per aiutarti",
            studiosTitle: content.studiosSectionTitle || "🏢 I Nostri Studi",
            studiosSubtitle: content.studiosSectionSubtitle || "Trova lo studio più vicino a te"
          }} 
        />
      </div>
      
      {/* Recensioni Trustpilot */}
      <TrustpilotWall />
    </main>
  );
}


