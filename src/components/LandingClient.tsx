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

    // Listener per i cambiamenti dell'URL
    const handleUrlChange = () => {
      setSelectedPackageId(getPackageIdFromUrl());
    };

    // Listener per eventi personalizzati di selezione pacchetti
    const handlePackageSelected = (event: CustomEvent) => {
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

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('packageSelected', handlePackageSelected as EventListener);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('packageSelected', handlePackageSelected as EventListener);
    };
  }, []);

  useEffect(() => {
    Promise.all([getSiteContent(), getPackages()]).then(([c, p]) => {
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

  if (!content || !packages) return null;
  const featuredFirst = [...packages].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  // Determina se è una consultazione gratuita
  const isFreeConsultation = selectedPackageId === 'free-consultation';
  
  console.log("LandingClient: selectedPackageId:", selectedPackageId);
  console.log("LandingClient: isFreeConsultation:", isFreeConsultation);

  return (
    <main className="min-h-dvh bg-background text-foreground pt-16">
      {/* Popup 10 Minuti Consultivi Gratuiti */}
      {content.freeConsultationPopup && (
        <FreeConsultationPopup
          title={content.freeConsultationPopup.title || "🎯 10 Minuti Consultivi Gratuiti"}
          subtitle={content.freeConsultationPopup.subtitle || "Valuta i tuoi obiettivi gratuitamente"}
          description={content.freeConsultationPopup.description || "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance."}
          ctaText={content.freeConsultationPopup.ctaText || "Prenota Ora - È Gratis!"}
          isEnabled={content.freeConsultationPopup.isEnabled || false}
        />
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
        <div className="mt-8 max-w-lg mx-auto">
          <BookingForm 
            packageId={selectedPackageId} 
            isFreeConsultation={isFreeConsultation} 
          />
        </div>
      </section>
      
      {/* Sezione Contatti - POSIZIONATA CORRETTAMENTE */}
      {(content.contactPhone || content.contactEmail || (content.contactAddresses && content.contactAddresses.length > 0) || (content.socialChannels && content.socialChannels.length > 0)) ? (
        <div id="contatti">
          <ContactSection 
            contactInfo={{
              title: content.contactTitle,
              subtitle: content.contactSubtitle,
              phone: content.contactPhone || "",
              email: content.contactEmail || "",
              addresses: content.contactAddresses || [],
              socialChannels: content.socialChannels,
              contactTitle: content.contactSectionTitle,
              contactSubtitle: content.contactSectionSubtitle,
              studiosTitle: content.studiosSectionTitle,
              studiosSubtitle: content.studiosSectionSubtitle
            }} 
          />
        </div>
      ) : null}
      
      {/* Recensioni Trustpilot */}
      <TrustpilotWall />
    </main>
  );
}


