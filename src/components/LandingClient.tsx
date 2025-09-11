// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { PackagesCarousel } from "@/components/PackagesCarousel";
import { ResultsCarousel } from "@/components/ResultsCarousel";
import GoogleReviews from "@/components/GoogleReviews";
import { BookingForm } from "@/components/BookingForm";
import { LandingImages } from "@/components/LandingImages";
import { ContactSection } from "@/components/ContactSection";
import { FreeConsultationPopup } from "@/components/FreeConsultationPopup";
import BMICalculator from "@/components/BMICalculator";

import { getPackages, getSiteContent } from "@/lib/datasource";
// Rimosso sistema globale - ora usa approccio diretto

export default function LandingClient() {
  const [content, setContent] = useState(null);
  const [packages, setPackages] = useState(null);
  
  // NUOVO SISTEMA DIRETTO - SEMPLICE

  useEffect(() => {
    console.log("LandingClient: useEffect iniziato - chiamata getSiteContent e getPackages");
    
    Promise.all([getSiteContent(), getPackages()]).then(([c, p]) => {
      console.log("LandingClient: Promise.all completata");
      console.log("LandingClient: Contenuto caricato:", c);
      console.log("LandingClient: Pacchetti caricati:", p);
      
      const fallbackContent: any = {
        heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
        heroSubtitle: "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
        heroCta: "Prenota ora",
        heroBackgroundImage: "",
        images: [],
        colorPalette: "gz-default",
        resultsSection: {
          isEnabled: false,
          title: "🎯 Risultati dei Nostri Clienti",
          subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
          photos: []
        }
      };
      const finalContent = c ?? fallbackContent;
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
      heroBackgroundImage: "/hero-demo.svg",
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
      },
      sectionVisibility: {
        hero: true,
        about: true,
        images: true,
        packages: true,
        bookingForm: true,
        contact: true
      },
      googleCalendar: {
        calendarId: "dc16aa394525fb01f5906273e6a3f1e47cf616ee466cedd511698e3f285288d6@group.calendar.google.com",
        timezone: "Europe/Rome",
        serviceAccountEmail: "zambo-489@gznutrition-d5d13.iam.gserviceaccount.com"
      },
      resultsSection: {
        isEnabled: false,
        title: "🎯 Risultati dei Nostri Clienti",
        subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
        photos: []
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
    heroBackgroundImage: "/hero-demo.svg",
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
    },
    googleCalendar: {
      calendarId: "9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com",
      timezone: "Europe/Rome",
      serviceAccountEmail: "zambo-489@gznutrition-d5d13.iam.gserviceaccount.com"
    },
    resultsSection: {
      isEnabled: false,
      title: "🎯 Risultati dei Nostri Clienti",
      subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
      photos: []
    },
    sectionVisibility: {
      hero: true,
      about: true,
      images: true,
      packages: true,
      bookingForm: true,
      contact: true
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
          packageUrl={effectiveContent.freeConsultationPopup?.packageUrl || "free-consultation"}
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
      
      {(() => {
        const heroBg = (effectiveContent.heroBackgroundImage && String(effectiveContent.heroBackgroundImage).trim() !== "")
          ? effectiveContent.heroBackgroundImage
          : "/hero-demo.svg";
        return (
          <Hero 
            title={effectiveContent.heroTitle} 
            subtitle={effectiveContent.heroSubtitle} 
            ctaLabel={effectiveContent.heroCta} 
            backgroundImage={heroBg}
            badgeText={effectiveContent.heroBadgeText}
            badgeColor={effectiveContent.heroBadgeColor}
            sectionVisibility={effectiveContent.sectionVisibility}
          />
        );
      })()}
      {/* ✅ SEZIONE ABOUT - solo se visibile */}
      {effectiveContent.sectionVisibility?.about !== false && (
        <AboutSection title={effectiveContent.aboutTitle} body={effectiveContent.aboutBody} imageUrl={effectiveContent.aboutImageUrl} />
      )}
      
      {/* ✅ SEZIONE BMI - subito dopo Chi sono, solo se about è visibile */}
      {effectiveContent.bmiCalculator?.enabled && effectiveContent.sectionVisibility?.about !== false && (
        <BMICalculator
          title={effectiveContent.bmiCalculator.title}
          subtitle={effectiveContent.bmiCalculator.subtitle}
          colorPalette={effectiveContent.colorPalette}
        />
      )}
      
      {/* ✅ SEZIONE IMMAGINI - solo se visibile */}
      {effectiveContent.sectionVisibility?.images !== false && effectiveContent.images && effectiveContent.images.length > 0 && (
        <LandingImages images={effectiveContent.images} />
      )}
      
      {/* ✅ SEZIONE PACCHETTI - solo se visibile */}
      {effectiveContent.sectionVisibility?.packages !== false && (
        <PackagesCarousel items={featuredFirst} sectionVisibility={effectiveContent.sectionVisibility} />
      )}
      
      {/* Sezione Risultati Clienti - SEMPRE VISIBILE PER DEBUG */}
      <section 
        id="results-section-debug" 
        className="py-20 bg-gradient-to-b from-blue-50 to-white border-4 border-red-500"
        style={{backgroundColor: '#fee2e2', border: '4px solid #dc2626'}}
      >
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-red-800 mb-4">
              🚨 DEBUG: Sezione Risultati (Sempre Visibile)
            </h2>
            <p className="text-lg text-red-600 max-w-3xl mx-auto">
              Se vedi questa sezione, il rendering React funziona. Debug in corso...
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-red-300">
            <h3 className="font-bold mb-4">🔍 Debug Info:</h3>
            <ul className="space-y-2 text-sm">
              <li>✅ Componente renderizzato: SÌ</li>
              <li>📊 effectiveContent: {effectiveContent ? 'PRESENTE' : 'ASSENTE'}</li>
              <li>🎯 resultsSection: {effectiveContent?.resultsSection ? 'PRESENTE' : 'ASSENTE'}</li>
              <li>🔧 isEnabled: {String(effectiveContent?.resultsSection?.isEnabled)}</li>
              <li>📷 photos: {effectiveContent?.resultsSection?.photos?.length || 0}</li>
              <li>🌐 Ambiente: PRODUZIONE</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sezione Risultati Clienti CONDIZIONALE - se abilitata */}
      {effectiveContent.resultsSection?.isEnabled && effectiveContent.resultsSection.photos && effectiveContent.resultsSection.photos.length > 0 && (() => {
        try {
          return (
            <ResultsCarousel
              title={effectiveContent.resultsSection.title}
              subtitle={effectiveContent.resultsSection.subtitle}
              photos={effectiveContent.resultsSection.photos}
            />
          );
        } catch (error) {
          console.error('❌ Errore ResultsCarousel:', error);
          return (
            <section className="py-20 bg-gradient-to-b from-secondary-bg/30 to-background">
              <div className="container max-w-6xl mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  🎯 Risultati dei Nostri Clienti
                </h2>
                <p className="text-lg text-foreground/70 max-w-3xl mx-auto mb-8">
                  Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {effectiveContent.resultsSection.photos.map((photo, index) => (
                    <div key={photo.id} className="bg-card rounded-lg overflow-hidden shadow-lg">
                      <div className="aspect-square bg-gray-200 flex items-center justify-center">
                        <img 
                          src={photo.url} 
                          alt={photo.description || `Risultato ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = '<div class="text-gray-500">Immagine non disponibile</div>';
                          }}
                        />
                      </div>
                      {photo.description && (
                        <div className="p-4">
                          <p className="text-sm text-foreground/80">{photo.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }
      })()}
      
      {/* ✅ SEZIONE BOOKING - solo se visibile */}
      {effectiveContent.sectionVisibility?.bookingForm !== false && (
        <section id="booking" className="container py-16 sm:py-20 border-t border-foreground/10">
          <h2 className="text-3xl font-bold text-center">Prenota la tua consulenza</h2>
          <p className="mt-4 text-center text-foreground/70 max-w-2xl mx-auto">
            Inizia il tuo percorso di trasformazione. Compila il modulo e ti contatteremo per definire i dettagli.
          </p>
          <div className="mt-8 max-w-lg mx-auto" data-booking-form>
            <BookingForm />
          </div>
        </section>
      )}
      
      
      {/* ✅ SEZIONE CONTATTI - solo se visibile */}
      {effectiveContent.sectionVisibility?.contact !== false && (
        <div id="contatti" className="border-t border-foreground/10">
        <ContactSection
          contactInfo={{
            title: effectiveContent.contactSectionTitle || "📞 Contattami",
            subtitle: effectiveContent.contactSectionSubtitle || "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
            phone: effectiveContent.contactPhone || "+39 123 456 7890",
            email: effectiveContent.contactEmail || "info@gznutrition.it",
            addresses: Array.isArray(effectiveContent.contactAddresses) && effectiveContent.contactAddresses.length > 0
              ? effectiveContent.contactAddresses
              : [
                {
                  name: "Studio Principale",
                  address: "Via Roma 123",
                  city: "Milano",
                  postalCode: "20100",
                  coordinates: { lat: 45.4642, lng: 9.19 },
                },
              ],
            socialChannels: Array.isArray(effectiveContent.socialChannels) ? effectiveContent.socialChannels : [],
            contactTitle: effectiveContent.contactSectionTitle || "💬 Contatti Diretti",
            contactSubtitle: effectiveContent.contactSectionSubtitle || "Siamo qui per aiutarti",
            studiosTitle: effectiveContent.studiosSectionTitle || "🏢 I Nostri Studi",
            studiosSubtitle: effectiveContent.studiosSectionSubtitle || "Trova lo studio più vicino a te",
          }}
        />
        </div>
      )}
      
      {/* Recensioni Google */}
        <GoogleReviews
          title={effectiveContent.googleReviews?.title}
          subtitle={effectiveContent.googleReviews?.subtitle}
          businessName={effectiveContent.googleReviews?.businessName}
          placeId={effectiveContent.googleReviews?.placeId}
          fallbackReviews={effectiveContent.googleReviews?.fallbackReviews}
          colorPalette={effectiveContent.colorPalette}
          enabled={effectiveContent.googleReviews?.enabled}
        />
    </main>
  );
}


