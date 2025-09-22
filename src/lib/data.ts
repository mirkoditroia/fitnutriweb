import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
  type DocumentReference,
  updateDoc,
} from "firebase/firestore";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, ensureCalendarEvent } from "./googleCalendar";
import { debugLog, debugError, debugLogSync } from "./debugUtils";

// Funzione per inviare notifica email per nuova prenotazione al dottore
export async function sendBookingNotification(booking: Booking, packageTitle?: string, notificationEmail?: string, businessName?: string, colorPalette?: string) {
  try {
    debugLogSync("📤 sendBookingNotification chiamata con:", { 
      bookingId: booking.id, 
      isFreeConsultation: booking.isFreeConsultation,
      packageTitle,
      notificationEmail 
    });
    
    // Usa Firebase Functions per l'invio email
    const response = await fetch('https://sendbookingnotification-4ks3j6nupa-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'new-booking',
        booking,
        packageTitle,
        notificationEmail, // Passa l'email configurabile
        businessName, // Passa il nome business configurabile
        colorPalette // Passa la palette selezionata
      }),
    });

    debugLogSync("📬 Risposta Firebase Functions:", response.status);
    const result = await response.json();
    debugLogSync("📋 Risultato email:", result);
    
    if (result.success) {
      debugLogSync('✅ Booking notification sent successfully:', result.sentTo);
    } else {
      console.error('❌ Failed to send booking notification:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending booking notification:', error);
  }
}

// ✅ Email cliente rimossa - troppo complessa
// Sistema email nutrizionista funziona perfettamente tramite Firebase Functions
import { db } from "@/lib/firebase";
import type { Firestore } from "firebase/firestore";
import type { GoogleReview } from "@/lib/googlePlaces";

// Types
export type Package = {
  id?: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  featured?: boolean;
  badge?: string;
  isPromotional?: boolean; // Flag per pacchetti promozionali (es. 10 minuti gratuiti)
  // Nuovi campi per sconti e personalizzazione
  hasDiscount?: boolean; // Flag per attivare sconti
  basePrice?: number; // Prezzo base (mostrato sbarrato)
  discountedPrice?: number; // Prezzo scontato
  discountPercentage?: number; // Percentuale di sconto
  paymentText?: string; // Testo personalizzabile sotto il prezzo (opzionale)
  // Sezione dettagli completa
  details?: {
    duration?: string; // Durata del pacchetto (es. "3 mesi", "6 mesi")
    sessions?: number; // Numero di sessioni incluse
    features?: string[]; // Lista delle caratteristiche/benefici
    includes?: string[]; // Cosa è incluso nel pacchetto
    requirements?: string[]; // Requisiti per il pacchetto
    notes?: string; // Note aggiuntive
  };
  createdAt?: string; // Data di creazione per ordinamento
};

export type ClientCard = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt?: string;
  // Additional client information
  birthDate?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Health and fitness information
  height?: number; // in cm
  weight?: number; // in kg
  fitnessLevel?: "beginner" | "intermediate" | "advanced";
  goals?: string[];
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  // Business information
  source?: "website" | "social_media" | "referral" | "other";
  status?: "active" | "inactive" | "prospect" | "pending";
  assignedPackage?: string;
  // Documents
  documents?: {
    id: string;
    name: string;
    url: string;
    type: "medical_certificate" | "id_document" | "consent_form" | "other";
    uploadedAt: string;
  }[];
};

export type ClientProgress = {
  id: string;
  clientId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
    // ✅ NUOVE MISURAZIONI AGGIUNTE
    hipCircumference?: number; // Circonferenza fianchi
    bicepCircumference?: number; // Circonferenza bicipite
    thighCircumference?: number; // Circonferenza coscia
  };
  notes?: string;
  photos?: string[];
  createdAt: string;
};

export type Booking = {
  id?: string;
  clientId?: string;
  name: string;
  email: string;
  phone?: string;
  channelPreference?: "whatsapp" | "email";
  date: string;
  slot: string;
  location?: "online" | "studio"; // sede appuntamento
  studioLocation?: string; // nome/ID della sede specifica se location = studio
  packageId?: string;
  priority?: boolean;
  status: "pending" | "confirmed" | "cancelled";
  createdAt?: string;
  isFreeConsultation?: boolean; // Flag per consultazioni gratuite
  consultationDuration?: number; // Durata della consultazione in minuti (per consultazioni gratuite)
  notes?: string; // Note del cliente (sezione "Parlami di te")
  googleCalendarEventId?: string; // ID dell'evento Google Calendar
};

export interface SiteContent {
  siteName?: string; // Nome del sito (default: "Demo")
  siteUrl?: string; // URL principale del sito per CORS (es. "https://www.demo.it")
  favicon?: string; // URL del favicon personalizzato
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  heroBackgroundImage: string;
  heroBadgeText?: string; // Testo del badge (default: "Performance • Estetica • Energia")
  heroBadgeColor?: string; // Colore del badge (default: "bg-primary text-primary-foreground")

  // ✅ NUOVA FEATURE: Controlli di visibilità sezioni
  sectionVisibility?: {
    hero?: boolean; // Sezione hero (default: true)
    about?: boolean; // Sezione "Chi sono" (default: true)
    images?: boolean; // Sezione immagini (default: true)
    packages?: boolean; // Sezione pacchetti (default: true)
    bookingForm?: boolean; // Form di prenotazione (default: true)
    contact?: boolean; // Sezione contatti (default: true)
  };

  // Navbar logo customization
  navbarLogoMode?: "image" | "text";
  navbarLogoImageUrl?: string;
  navbarLogoHeight?: number; // px
  navbarLogoAutoRemoveBg?: boolean; // tenta di rimuovere il bianco con blend
  navbarLogoText?: string;
  navbarLogoTextColor?: string; // hex
  navbarLogoTextWeight?: number; // 400..800
  navbarLogoTextSize?: number; // px
  aboutTitle?: string;
  aboutBody?: string;
  aboutImageUrl?: string;
  images?: Array<{ key: string; url: string }>;
  contactTitle?: string;
  contactSubtitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddresses?: Array<{
    name: string;
    address: string;
    city: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  socialChannels?: Array<{
    platform: string;
    url: string;
    icon: string;
    logoUrl?: string; // URL o dataURL del logo caricato
  }>;

  // Sistema palette robusto
  colorPalette: 'gz-default' | 'modern-blue' | 'elegant-dark' | 'nature-green' | 'warm-orange' | 'professional-gray';
  // Nuovi campi per personalizzare le sezioni contatti e studi
  contactSectionTitle?: string; // Titolo sezione contatti (default: "💬 Contatti Diretti")
  contactSectionSubtitle?: string; // Sottotitolo sezione contatti
  studiosSectionTitle?: string; // Titolo sezione studi (default: "🏢 I Nostri Studi")
  studiosSectionSubtitle?: string; // Sottotitolo sezione studi
  // Popup 10 minuti consultivi gratuiti
  freeConsultationPopup?: {
    title?: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    isEnabled?: boolean;
    packageUrl?: string; // URL del pacchetto promozionale
  };
  // Google Calendar integration
  googleCalendar?: {
    isEnabled?: boolean;
    calendarId?: string;
    timezone?: string;
    serviceAccountEmail?: string;
  };
  // Email notification settings
  notificationEmail?: string; // Email del nutrizionista per ricevere notifiche
  businessName?: string; // Nome del nutrizionista/studio per le email
  
  // CAPTCHA settings
  recaptchaEnabled?: boolean; // Abilita/disabilita CAPTCHA per le prenotazioni
  recaptchaSiteKey?: string; // Site key per reCAPTCHA v2
  
  // Sezione Risultati Clienti
  resultsSection?: {
    isEnabled?: boolean; // Abilita/disabilita la sezione risultati
    title?: string; // Titolo sezione (default: "🎯 Risultati dei Nostri Clienti")
    subtitle?: string; // Sottotitolo sezione
    photos?: Array<{
      id: string;
      url: string;
      description?: string; // Descrizione opzionale del risultato
    }>;
  };

  // Meta tag per link preview sui social media
  metaTags?: {
    title?: string; // Titolo del sito per Open Graph (default: titolo hero)
    description?: string; // Descrizione del sito per Open Graph (default: sottotitolo hero)
    siteUrl?: string; // URL del sito (es. "https://demo.it")
    image?: string; // Immagine per Open Graph (preview sui social)
    twitterCard?: "summary" | "summary_large_image"; // Tipo di card Twitter (default: "summary_large_image")
    ogType?: string; // Tipo Open Graph (default: "website")
    locale?: string; // Lingua del sito (default: "it_IT")
    siteName?: string; // Nome del sito per Open Graph (default: "Demo")
  };
  
  // Email cliente rimossa - troppo complessa
  
  // ✅ NUOVA FEATURE: Calcolatore BMI
  bmiCalculator?: {
    enabled?: boolean; // Se abilitare il calcolatore BMI (default: false)
    title?: string; // Titolo personalizzato (default: "📊 Calcola il tuo BMI")
    subtitle?: string; // Sottotitolo personalizzato 
  };
  
  // ✅ NUOVA FEATURE: Google Reviews (sostituisce Trustpilot)
  googleReviews?: {
    enabled?: boolean; // Se abilitare le recensioni Google (default: true)
    title?: string; // Titolo sezione (default: "⭐ Recensioni Google")
    subtitle?: string; // Sottotitolo
    businessName?: string; // Nome business per link Google
    profileUrl?: string; // URL del profilo Google (usato per i link)
    fallbackReviews?: GoogleReview[]; // Recensioni manuali gestite da admin
  };
  
  // ✅ LEGAL COMPLIANCE: Informazioni legali per footer e GDPR
  legalInfo?: {
    // Informazioni aziendali
    companyName?: string; // Nome dell'azienda (default: "Demo")
    vatNumber?: string; // Partita IVA
    taxCode?: string; // Codice fiscale
    registeredAddress?: string; // Indirizzo legale
    email?: string; // Email legale/contatto
    phone?: string; // Telefono legale
    
    // Footer personalizzabile
    footerText?: string; // Testo personalizzato per il footer
    showLegalLinks?: boolean; // Mostra link legali nel footer (default: true)
    
    // GDPR e Privacy
    gdprConsentText?: string; // Testo per consenso GDPR nel form
    privacyPolicyUrl?: string; // URL della privacy policy
    cookiePolicyUrl?: string; // URL della cookie policy
    termsOfServiceUrl?: string; // URL dei termini di servizio
    
    // Cookie banner
    cookieBanner?: {
      enabled?: boolean; // Abilita banner cookie (default: true)
      title?: string; // Titolo del banner
      message?: string; // Messaggio del banner
      acceptText?: string; // Testo pulsante accetta
      declineText?: string; // Testo pulsante rifiuta
      learnMoreText?: string; // Testo link "scopri di più"
    };
    
    // Contenuto delle pagine legali
    legalPages?: {
      privacyPolicy?: {
        title?: string; // Titolo della pagina
        lastUpdated?: string; // Data ultimo aggiornamento
        content?: string; // Contenuto HTML della privacy policy
      };
      cookiePolicy?: {
        title?: string; // Titolo della pagina
        lastUpdated?: string; // Data ultimo aggiornamento
        content?: string; // Contenuto HTML della cookie policy
      };
      termsOfService?: {
        title?: string; // Titolo della pagina
        lastUpdated?: string; // Data ultimo aggiornamento
        content?: string; // Contenuto HTML dei termini di servizio
      };
    };
  };
  
  // Debug Settings
  debugLogsEnabled?: boolean; // Abilita/disabilita i log di debug in console (default: true)
}

// Tipo per slot di consultazione gratuita con durata specifica
export type FreeConsultationSlot = {
  time: string; // formato "HH:MM"
  duration: number; // durata in minuti
};

export type Availability = {
  date: string;
  // Slot separati per sede
  onlineSlots?: string[];
  inStudioSlots?: string[];
  studioSlots?: Record<string, string[]>; // mappa sede -> slot specifici
  // Retrocompatibilità: slots aggregati (preferire i campi sopra)
  slots?: string[];
  // Slot dedicati alle consultazioni gratuite con durata specifica
  freeConsultationSlots?: FreeConsultationSlot[];
  // Retrocompatibilità: slot semplici (deprecato)
  legacyFreeConsultationSlots?: string[];
};

// Helpers (lazy & typed)
const col = {
  packages: (database: Firestore) => collection(database, "packages"),
  bookings: (database: Firestore) => collection(database, "bookings"),
  clients: (database: Firestore) => collection(database, "clients"),
  content: (database: Firestore) => doc(database, "content/landing"),
  availability: (database: Firestore, date: string) => doc(database, `availability/${date}`),
};

// Packages
export async function getPackages(): Promise<Package[]> {
  if (!db) {
    debugLogSync("getPackages: Database non configurato");
    return [];
  }
  
  try {
    debugLogSync("getPackages: Caricamento pacchetti da Firebase...");
  const database = db as Firestore;
    const snap = await getDocs(query(col.packages(database), orderBy("createdAt", "desc")));
    
    debugLogSync("getPackages: Snap ricevuto:", snap);
    debugLogSync("getPackages: Numero documenti:", snap.docs.length);
    
    const packages = snap.docs.map((d) => {
      const data = d.data();
      debugLogSync(`getPackages: Documento ${d.id}:`, data);
      
      // Mapping completo per Firebase con tutti i campi necessari
      const mappedPackage: Package = {
        id: d.id,
        title: data.title || "",
        description: data.description || "",
        price: data.price || 0,
        imageUrl: data.imageUrl || "",
        isActive: data.active !== undefined ? data.active : (data.isActive || false),
        featured: data.featured || false,
        badge: data.badge || "",
        isPromotional: data.isPromotional || false,
        hasDiscount: data.hasDiscount || false,
        basePrice: data.basePrice || undefined,
        discountedPrice: data.discountedPrice || undefined,
        discountPercentage: data.discountPercentage || undefined,
        // Usa nullish coalescing per rispettare stringhe non vuote
        paymentText: data.paymentText || undefined,
        details: data.details || undefined,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : undefined
      };
      
      debugLogSync(`getPackages: Pacchetto mappato ${d.id}:`, mappedPackage);
      return mappedPackage;
    });
    
    debugLogSync("getPackages: Pacchetti processati:", packages);
    return packages;
  } catch (error) {
    console.error("getPackages: Errore nel caricamento da Firebase:", error);
    return [];
  }
}

export async function upsertPackage(pkg: Package): Promise<string> {
  if (!db) throw new Error("Firestore not configured");
  
  if (pkg.id) {
    // Update existing package
    await updateDoc(doc(db as Firestore, "packages", pkg.id), {
      title: pkg.title,
      description: pkg.description,
      price: pkg.price,
      imageUrl: pkg.imageUrl ?? null,
      active: pkg.isActive,
      featured: pkg.featured ?? false,
      badge: pkg.badge ?? null,
      isPromotional: pkg.isPromotional ?? false,
      // Nuovi campi per sconti e personalizzazione
      hasDiscount: pkg.hasDiscount ?? false,
      basePrice: pkg.basePrice ?? null,
      discountedPrice: pkg.discountedPrice ?? null,
      discountPercentage: pkg.discountPercentage ?? null,
      paymentText: pkg.paymentText || null,
      // Sezione dettagli completa
      details: pkg.details ?? null,
      createdAt: serverTimestamp(),
    });
    return pkg.id;
  } else {
    // Create new package
  const added = await addDoc(col.packages(db as Firestore), {
    title: pkg.title,
    description: pkg.description,
    price: pkg.price,
    imageUrl: pkg.imageUrl ?? null,
      active: pkg.isActive,
    featured: pkg.featured ?? false,
    badge: pkg.badge ?? null,
      isPromotional: pkg.isPromotional ?? false,
      // Nuovi campi per sconti e personalizzazione
      hasDiscount: pkg.hasDiscount ?? false,
      basePrice: pkg.basePrice ?? null,
      discountedPrice: pkg.discountedPrice ?? null,
      discountPercentage: pkg.discountPercentage ?? null,
      paymentText: pkg.paymentText || null,
      // Sezione dettagli completa
      details: pkg.details ?? null,
    createdAt: serverTimestamp(),
  });
  return added.id;
  }
}

export async function deletePackage(packageId: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  if (!packageId) throw new Error("Package ID is required for deletion");
  
  await deleteDoc(doc(db as Firestore, "packages", packageId));
}

// Bookings
export async function listBookings(): Promise<Booking[]> {
  if (!db) return [];
  const database = db as Firestore;
  const snap = await getDocs(query(col.bookings(database), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

export async function createBooking(
  b: Booking,
  captchaToken?: string,
  options?: { awaitSideEffects?: boolean }
): Promise<string> {
  debugLogSync("🔥 createBooking Firebase iniziato:", { 
    isFreeConsultation: b.isFreeConsultation, 
    slot: b.slot, 
    date: b.date,
    dateFormatted: new Date(b.date).toISOString().split('T')[0],
    packageId: b.packageId 
  });
  
  if (!db) throw new Error("Firestore not configured");
  
  // ✅ OTTIMIZZAZIONE: Verifica CAPTCHA con timeout ridotto
  const siteContent = await getSiteContent();
  if (siteContent?.recaptchaEnabled && captchaToken) {
    try {
      debugLogSync("🔑 Inizio verifica CAPTCHA con token:", captchaToken ? captchaToken.substring(0, 20) + "..." : "null");
      
      // ✅ Timeout ridotto per CAPTCHA (5 secondi invece di default 30)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://verifycaptcha-4ks3j6nupa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      debugLogSync("📡 Risposta Firebase Function status:", response.status);
      
      const result = await response.json();
      debugLogSync("🔍 Risultato verifica CAPTCHA:", result);
      
      if (!result.success) {
        console.error("❌ CAPTCHA verifica fallita:", result.message, result.errors);
        throw new Error(`Verifica CAPTCHA fallita: ${result.message || 'Errore sconosciuto'}`);
      }
      
      debugLogSync("✅ CAPTCHA verificato con successo!");
    } catch (error) {
      console.error("💥 Errore verifica CAPTCHA:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Verifica CAPTCHA timeout. Riprova.");
      }
      throw new Error("Errore nella verifica CAPTCHA. Riprova.");
    }
  } else if (siteContent?.recaptchaEnabled && !captchaToken) {
    throw new Error("Token CAPTCHA mancante. Completa la verifica CAPTCHA.");
  }
  
  // Validazione: lo slot deve essere obbligatorio e disponibile
  if (!b.slot) {
    throw new Error("Lo slot orario è obbligatorio per la prenotazione");
  }
  
  // ✅ STANDARDIZZA FORMATO DATA prima della validazione
  const dateString = b.date.includes('T') ? b.date.split('T')[0] : b.date;
  debugLogSync("🔍 FORMATO DATA DEBUG:");
  debugLogSync("📅 Data originale dal form:", b.date);
  debugLogSync("📅 Data standardizzata per query:", dateString);
  
  // Controlla che lo slot sia effettivamente disponibile
  const availability = await getAvailabilityByDate(dateString);
  const location: "online" | "studio" = b.isFreeConsultation ? "online" : (b.location || "online");
  
  let pool: string[] = [];
  let consultationDuration: number | undefined;
  
  if (b.isFreeConsultation) {
    // ✅ CORRETO: Per consulenze gratuite, usa SOLO slot promozionali dedicati
    const freeSlots = availability?.freeConsultationSlots ?? [];
    
    // Supporta sia il nuovo formato con durata che il vecchio formato per retrocompatibilità
    if (freeSlots.length > 0 && typeof freeSlots[0] === 'object') {
      // Nuovo formato con durata
      pool = (freeSlots as FreeConsultationSlot[]).map(slot => slot.time);
      // Trova la durata specifica per questo slot
      const selectedSlot = (freeSlots as FreeConsultationSlot[]).find(slot => slot.time === b.slot);
      consultationDuration = selectedSlot?.duration;
    } else {
      // Vecchio formato per retrocompatibilità - gestisce mix di tipi
      pool = (freeSlots as (string | FreeConsultationSlot)[])
        .map(slot => typeof slot === 'string' ? slot : slot.time);
    }
    
    debugLogSync("🔍 Consulenza gratuita - Slot promozionali disponibili:", pool.length, "slot");
    debugLogSync("📅 Slot richiesto:", b.slot);
    debugLogSync("⏱️ Durata consultazione:", consultationDuration, "minuti");
    
    if (pool.length === 0) {
      throw new Error("❌ Nessun slot per consulenze gratuite disponibile per questa data");
    }
  } else {
    // Per prenotazioni normali, usa slot normali
    pool = location === "online"
      ? (availability?.onlineSlots ?? availability?.slots ?? [])
      : (b.studioLocation ? (availability?.studioSlots?.[b.studioLocation] ?? []) : (availability?.inStudioSlots ?? []));
  }
  
  if (!availability || !pool.includes(b.slot)) {
    console.error("❌ VALIDAZIONE SLOT FALLITA!");
    console.error("  - availability presente:", !!availability);
    console.error("  - pool.length:", pool.length);
    console.error("  - slot richiesto:", b.slot);
    console.error("  - isFreeConsultation:", b.isFreeConsultation);
    
    throw new Error("L'orario selezionato non è più disponibile");
  }
  
  debugLogSync("✅ Slot validato correttamente:", b.slot);
  
  // Get package title for calendar event
  let packageTitle: string | undefined;
  
  // ✅ CORREZIONE: Gestisci le consulenze gratuite
  if (b.isFreeConsultation) {
    const duration = consultationDuration || 10; // Default 10 minuti se non specificato
    packageTitle = `Consultazione Gratuita (${duration} minuti)`;
  } else if (b.packageId) {
    try {
      const packageDoc = await getDoc(doc(db as Firestore, "packages", b.packageId));
      if (packageDoc.exists()) {
        packageTitle = packageDoc.data().title;
      }
    } catch (error) {
      console.error("Error getting package title for calendar event:", error);
    }
  }

  debugLogSync("💾 Salvando prenotazione nel database...");
  
  
  const added = await addDoc(col.bookings(db as Firestore), {
    clientId: b.clientId ?? null,
    name: b.name,
    email: b.email,
    phone: b.phone ?? null,
    packageId: b.packageId ?? null,
    date: b.date,
    slot: b.slot ?? null,
    location: location,
    studioLocation: b.studioLocation ?? null,
    status: b.status || "confirmed",
    priority: !!b.priority,
    channelPreference: b.channelPreference ?? null,
    isFreeConsultation: !!b.isFreeConsultation, // ✅ AGGIUNTO: Salva flag consulenza gratuita
    consultationDuration: consultationDuration ?? null, // ✅ AGGIUNTO: Salva durata consultazione gratuita
    notes: b.notes ?? null, // ✅ AGGIUNTO: Salva note del cliente
    createdAt: serverTimestamp(),
  });
  
  debugLogSync("✅ Prenotazione salvata con ID:", added.id);
  
  // Rimuovi lo slot occupato dalla disponibilità (blocca anche in pending)
  if (b.isFreeConsultation) {
    // ✅ CORRETTO: Per consulenze gratuite, rimuovi SOLO da slot promozionali
    const freeSlots = availability?.freeConsultationSlots ?? [];
    let nextFreeSlots: FreeConsultationSlot[] | string[];
    
    if (freeSlots.length > 0 && typeof freeSlots[0] === 'object') {
      // Nuovo formato con durata - filtra per tempo
      nextFreeSlots = (freeSlots as FreeConsultationSlot[]).filter((slot) => slot.time !== b.slot);
    } else {
      // Vecchio formato per retrocompatibilità - gestisce mix di tipi
      nextFreeSlots = (freeSlots as (string | FreeConsultationSlot)[])
        .filter((slot) => typeof slot === 'string' ? slot !== b.slot : slot.time !== b.slot)
        .map(slot => typeof slot === 'string' ? slot : slot.time);
    }
    
    debugLogSync("🗑️ Rimuovendo slot promozionale:", b.slot);
    debugLogSync("📋 Slot promozionali rimanenti:", nextFreeSlots);
    await upsertAvailabilityForDate(
      dateString, 
      availability.onlineSlots ?? availability.slots ?? [], 
      nextFreeSlots, 
      availability.inStudioSlots ?? [], 
      availability.studioSlots ?? {}
    );
  } else if (location === "online") {
    const next = (availability.onlineSlots ?? availability.slots ?? []).filter((slot) => slot !== b.slot);
    await upsertAvailabilityForDate(dateString, next, availability.freeConsultationSlots, availability.inStudioSlots ?? [], availability.studioSlots ?? {});
  } else {
    if (b.studioLocation) {
      const studioMap = { ...(availability.studioSlots ?? {}) };
      studioMap[b.studioLocation] = (studioMap[b.studioLocation] ?? []).filter((slot) => slot !== b.slot);
      await upsertAvailabilityForDate(
        dateString,
        availability.onlineSlots ?? availability.slots ?? [],
        availability.freeConsultationSlots,
        availability.inStudioSlots ?? [],
        studioMap
      );
    } else {
      const nextStudio = (availability.inStudioSlots ?? []).filter((slot) => slot !== b.slot);
      await upsertAvailabilityForDate(dateString, availability.onlineSlots ?? availability.slots ?? [], availability.freeConsultationSlots, nextStudio, availability.studioSlots ?? {});
    }
  }
  
  // If booking is confirmed, create or update client automatically
  if (b.status === "confirmed") {
    try {
      // Check if client already exists
      const existingClient = await getClientByEmail(b.email);
      
      if (existingClient) {
        // Update existing client with booking information
        await upsertClient({
          ...existingClient,
          name: b.name,
          phone: b.phone || existingClient.phone,
          assignedPackage: b.packageId || existingClient.assignedPackage,
          status: "active",
          source: existingClient.source || "website"
        });
      } else {
        // Create new client from booking
        const newClient: ClientCard = {
          name: b.name,
          email: b.email,
          phone: b.phone,
          notes: `Cliente creato automaticamente dalla prenotazione confermata del ${new Date(b.date).toLocaleDateString("it-IT")}`,
          status: "active",
          source: "website",
          assignedPackage: b.packageId,
          goals: [],
          medicalConditions: [],
          allergies: [],
          medications: [],
          documents: [],
          createdAt: new Date().toISOString()
        };
        
        await upsertClient(newClient);
      }
    } catch (error) {
      console.error("Error creating/updating client from booking:", error);
      // Don't throw here as the main booking creation was successful
    }
  }
  
  // ✅ OTTIMIZZAZIONE: Operazioni non critiche in parallelo
  const nonCriticalOperations = [];
  
  // Create Google Calendar event (non critico)
  if (b.status === "confirmed") {
    nonCriticalOperations.push(
      (async () => {
        try {
          const calendarEventId = await ensureCalendarEvent(undefined, b, packageTitle);
          if (calendarEventId && calendarEventId !== 'pending') {
            // Update booking with calendar event ID only if it's a real ID
            await updateDoc(doc(db as Firestore, "bookings", added.id), {
              googleCalendarEventId: calendarEventId
            });
            debugLogSync("Google Calendar event created and linked to booking:", calendarEventId);
          } else if (calendarEventId === 'pending') {
            console.log("⚠️ [BOOKING] Evento calendario creato ma con ID 'pending' - non salvato nel database");
            console.log("⚠️ [BOOKING] L'evento esiste nel calendario ma non può essere tracciato per la cancellazione");
          }
        } catch (error) {
          console.error("Error creating Google Calendar event:", error);
          // Don't fail the booking creation if calendar fails
        }
      })()
    );
  }

  // Invia notifica email al nutrizionista (non critico)
  nonCriticalOperations.push(
    (async () => {
      try {
        debugLogSync("📧 Preparando invio email notifica...");
        const bookingWithId = { ...b, id: added.id };
        
        // Ottieni l'email di notifica, nome business e palette dalle impostazioni
        const siteContent = await getSiteContent();
        const notificationEmail = siteContent?.notificationEmail || "mirkoditroia@gmail.com";
        const businessName = siteContent?.businessName || "GZ Nutrition";
        const colorPalette = siteContent?.colorPalette || "gz-default";
        
        debugLogSync("📬 Inviando email a:", notificationEmail, "per", packageTitle);
        await sendBookingNotification(bookingWithId, packageTitle, notificationEmail, businessName, colorPalette);
        debugLogSync("✅ Email al dottore inviata con successo!");
      } catch (error) {
        console.error("❌ Errore invio email:", error);
        // Don't fail the booking creation if notification fails
      }
    })()
  );

  // ✅ Esegui operazioni non critiche
  if (nonCriticalOperations.length > 0) {
    const promise = Promise.all(nonCriticalOperations).catch(error => {
      console.error("❌ Errore in operazioni non critiche:", error);
    });
    // In contesti server (API) attendi per garantire invio email e sync calendario
    if (options?.awaitSideEffects) {
      await promise;
    }
  }

  return added.id;
}

export async function updateBooking(booking: Booking): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  if (!booking.id) throw new Error("Booking ID is required for update");
  
  // Trova la prenotazione esistente per confrontare i cambiamenti
  const existingBookingDoc = await getDoc(doc(db as Firestore, "bookings", booking.id));
  if (!existingBookingDoc.exists()) {
    throw new Error("Prenotazione non trovata");
  }
  
  const existingBooking = toBooking(booking.id, existingBookingDoc.data());
  
  // Se si sta cambiando lo slot, controlla che sia disponibile
  if (existingBooking.slot !== booking.slot && booking.slot) {
    const availability = await getAvailabilityByDate(booking.date);
    const location: "online" | "studio" = booking.isFreeConsultation ? "online" : (booking.location || "online");
    const pool = location === "online"
      ? (availability?.onlineSlots ?? availability?.slots ?? [])
      : (availability?.inStudioSlots ?? []);
    if (!availability || !pool.includes(booking.slot)) {
      throw new Error("Il nuovo orario selezionato non è più disponibile");
    }
  }
  
  // Se si sta cambiando la data, controlla che lo slot sia disponibile nella nuova data
  if (existingBooking.date !== booking.date && booking.slot) {
    const newDateAvailability = await getAvailabilityByDate(booking.date);
    const location: "online" | "studio" = booking.isFreeConsultation ? "online" : (booking.location || "online");
    const pool = location === "online"
      ? (newDateAvailability?.onlineSlots ?? newDateAvailability?.slots ?? [])
      : (newDateAvailability?.inStudioSlots ?? []);
    if (!newDateAvailability || !pool.includes(booking.slot)) {
      throw new Error("L'orario selezionato non è disponibile per la nuova data");
    }
  }
  
  // Firestore does not accept undefined values. Normalize optional fields to null.
  const id = booking.id;
  const updateData = {
    clientId: booking.clientId ?? null,
    name: booking.name,
    email: booking.email,
    phone: booking.phone ?? null,
    packageId: booking.packageId ?? null,
    date: booking.date,
    slot: booking.slot ?? null,
    location: booking.isFreeConsultation ? "online" : (booking.location ?? null),
    studioLocation: booking.studioLocation ?? null,
    status: booking.status,
    priority: !!booking.priority,
    channelPreference: booking.channelPreference ?? null,
  };
  await setDoc(doc(db as Firestore, "bookings", id), updateData, { merge: true });
  
  // Update Google Calendar event if it exists
  console.log("🔧 GOOGLE CALENDAR SYNC - Existing Event ID:", existingBooking.googleCalendarEventId);
  console.log("🔧 GOOGLE CALENDAR SYNC - Booking Status:", booking.status);
  console.log("🔧 GOOGLE CALENDAR SYNC - Previous Status:", existingBooking.status);
  
  if (existingBooking.googleCalendarEventId) {
    try {
      console.log("📅 Updating existing Google Calendar event...");
      
      // Get package title for calendar event
      let packageTitle: string | undefined;
      if (booking.packageId) {
        try {
          const packageDoc = await getDoc(doc(db as Firestore, "packages", booking.packageId));
          if (packageDoc.exists()) {
            packageTitle = packageDoc.data().title;
          }
        } catch (error) {
          console.error("Error getting package title for calendar event update:", error);
        }
      }

      const success = booking.status === "confirmed"
        ? !!(await ensureCalendarEvent(existingBooking.googleCalendarEventId, booking, packageTitle))
        : await deleteCalendarEvent(existingBooking.googleCalendarEventId);
      
      console.log("📅 Google Calendar sync result:", success);
      
      if (success) {
        debugLogSync(booking.status === "confirmed" ? "Google Calendar event updated:" : "Google Calendar event deleted (booking not confirmed):", existingBooking.googleCalendarEventId);
      } else {
        console.error("Failed to update Google Calendar event:", existingBooking.googleCalendarEventId);
      }
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      // Don't fail the booking update if calendar fails
    }
  } else {
    // If no event was linked yet (e.g., bookings created before calendar fix), create it now
    console.log("📅 No existing Google Calendar event, checking if we should create one...");
    try {
      let packageTitle: string | undefined;
      if (booking.packageId) {
        try {
          const packageDoc = await getDoc(doc(db as Firestore, "packages", booking.packageId));
          if (packageDoc.exists()) {
            packageTitle = packageDoc.data().title;
          }
        } catch (error) {
          console.error("Error getting package title for calendar event create:", error);
        }
      }
      if (booking.status === "confirmed") {
        console.log("📅 Creating new Google Calendar event for confirmed booking...");
        const newEventId = await ensureCalendarEvent(undefined, booking, packageTitle);
        console.log("📅 New event creation result:", newEventId ? "SUCCESS" : "FAILED");
        if (newEventId && newEventId !== 'pending') {
          await setDoc(doc(db as Firestore, "bookings", booking.id), { googleCalendarEventId: newEventId }, { merge: true });
          debugLogSync("Google Calendar event created for existing booking:", newEventId);
        } else if (newEventId === 'pending') {
          console.log("⚠️ [BOOKING] Evento calendario creato ma con ID 'pending' - non salvato nel database");
        }
      } else {
        console.log("📅 Booking not confirmed, skipping calendar event creation");
      }
    } catch (error) {
      console.error("Error creating Google Calendar event on update:", error);
    }
  }

  // If booking is confirmed, create or update client automatically
  if (booking.status === "confirmed") {
    try {
      // Check if client already exists
      const existingClient = await getClientByEmail(booking.email);
      
      if (existingClient) {
        // Update existing client with booking information
        await upsertClient({
          ...existingClient,
          name: booking.name,
          phone: booking.phone || existingClient.phone,
          assignedPackage: booking.packageId || existingClient.assignedPackage,
          status: "active",
          source: existingClient.source || "website"
        });
      } else {
        // Create new client from booking
        const newClient: ClientCard = {
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          notes: `Cliente creato automaticamente dalla prenotazione confermata del ${new Date(booking.date).toLocaleDateString("it-IT")}`,
          status: "active",
          source: "website",
          assignedPackage: booking.packageId,
          goals: [],
          medicalConditions: [],
          allergies: [],
          medications: [],
          documents: [],
          createdAt: new Date().toISOString()
        };
        
        await upsertClient(newClient);
      }
    } catch (error) {
      console.error("Error creating/updating client from booking:", error);
      // Don't throw here as the main booking update was successful
    }
  }
  
  // If booking is confirmed and has a slot, remove that slot from availability
  if (booking.status === "confirmed" && booking.slot && booking.date) {
    try {
      const dateStr = booking.date.split('T')[0]; // Extract YYYY-MM-DD from date
      const availDoc = col.availability(db as Firestore, dateStr);
      const availSnap = await getDoc(availDoc);
      
      if (availSnap.exists()) {
        const data = availSnap.data();
        const location: "online" | "studio" = booking.isFreeConsultation ? "online" : (booking.location || "online");
        if (location === "online") {
          const online = (data.onlineSlots || data.slots || []) as string[];
          if (online.includes(booking.slot)) {
            const updated = online.filter((s) => s !== booking.slot);
            await setDoc(availDoc, { date: dateStr, onlineSlots: updated }, { merge: true });
          } else {
            console.warn(`Slot ${booking.slot} non più disponibile (online) per la data ${dateStr}`);
          }
        } else {
          const studio = (data.inStudioSlots || []) as string[];
          if (studio.includes(booking.slot)) {
            const updated = studio.filter((s) => s !== booking.slot);
            await setDoc(availDoc, { date: dateStr, inStudioSlots: updated }, { merge: true });
          } else {
            console.warn(`Slot ${booking.slot} non più disponibile (studio) per la data ${dateStr}`);
          }
        }
      }
      
      // Se si è cambiato lo slot, ripristina quello precedente
      if (existingBooking.slot && existingBooking.slot !== booking.slot) {
        const prevDateStr = existingBooking.date.split('T')[0];
        const prevAvailDoc = col.availability(db as Firestore, prevDateStr);
        const prevAvailSnap = await getDoc(prevAvailDoc);
        
        if (prevAvailSnap.exists()) {
          const prevData = prevAvailSnap.data();
          const prevLocation: "online" | "studio" = existingBooking.isFreeConsultation ? "online" : (existingBooking.location || "online");
          if (prevLocation === "online") {
            const prevOnline = (prevData.onlineSlots || prevData.slots || []) as string[];
            if (!prevOnline.includes(existingBooking.slot)) {
              const updatedPrev = [...prevOnline, existingBooking.slot];
              await setDoc(prevAvailDoc, { date: prevDateStr, onlineSlots: updatedPrev }, { merge: true });
            }
          } else {
            const prevStudio = (prevData.inStudioSlots || []) as string[];
            if (!prevStudio.includes(existingBooking.slot)) {
              const updatedPrev = [...prevStudio, existingBooking.slot];
              await setDoc(prevAvailDoc, { date: prevDateStr, inStudioSlots: updatedPrev }, { merge: true });
            }
          }
        }
      }
      
      // Se si è cambiata la data, ripristina lo slot nella data precedente
      if (existingBooking.date !== booking.date && existingBooking.slot) {
        const prevDateStr = existingBooking.date.split('T')[0];
        const prevAvailDoc = col.availability(db as Firestore, prevDateStr);
        const prevAvailSnap = await getDoc(prevAvailDoc);
        
        if (prevAvailSnap.exists()) {
          const prevData = prevAvailSnap.data();
          const prevLocation: "online" | "studio" = existingBooking.isFreeConsultation ? "online" : (existingBooking.location || "online");
          if (prevLocation === "online") {
            const prevOnline = (prevData.onlineSlots || prevData.slots || []) as string[];
            if (!prevOnline.includes(existingBooking.slot)) {
              const updatedPrev = [...prevOnline, existingBooking.slot];
              await setDoc(prevAvailDoc, { date: prevDateStr, onlineSlots: updatedPrev }, { merge: true });
            }
          } else {
            const prevStudio = (prevData.inStudioSlots || []) as string[];
            if (!prevStudio.includes(existingBooking.slot)) {
              const updatedPrev = [...prevStudio, existingBooking.slot];
              await setDoc(prevAvailDoc, { date: prevDateStr, inStudioSlots: updatedPrev }, { merge: true });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating availability in Firebase:", error);
      // Don't throw here as the main booking update was successful
    }
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  
  // Get booking data before deletion to create client if needed
  let bookingData: Booking | null = null;
  try {
    const bookingDoc = await getDoc(doc(db as Firestore, "bookings", bookingId));
    if (bookingDoc.exists()) {
      bookingData = toBooking(bookingId, bookingDoc.data());
      
      // Delete Google Calendar event if it exists
      if (bookingData.googleCalendarEventId) {
        try {
          console.log("🗑️ [BOOKING] Tentativo cancellazione evento calendario:", bookingData.googleCalendarEventId);
          
          // Special handling for 'pending' eventId
          if (bookingData.googleCalendarEventId === 'pending') {
            console.log("⚠️ [BOOKING] EventId è 'pending' - tentativo cancellazione per nome e data");
            console.log("🔍 [BOOKING] Cercando evento nel calendario per:", {
              name: bookingData.name,
              date: bookingData.date,
              slot: bookingData.slot
            });
            
            // Try to delete by searching for the event by name and date
            const success = await deleteCalendarEvent(bookingData.googleCalendarEventId, {
              name: bookingData.name,
              date: bookingData.date,
              slot: bookingData.slot || ''
            });
            
            if (success) {
              console.log("✅ [BOOKING] Evento calendario cancellato tramite ricerca");
            } else {
              console.log("⚠️ [BOOKING] L'evento potrebbe essere presente nel calendario ma non tracciabile");
              console.log("⚠️ [BOOKING] Controlla manualmente il calendario Google per eventi non cancellati");
              
              // Show warning to user
              if (typeof window !== 'undefined') {
                // Import toast dynamically to avoid SSR issues
                import('react-hot-toast').then(({ toast }) => {
                  toast.error(
                    "⚠️ Controlla il calendario Google: l'evento potrebbe non essere stato cancellato automaticamente",
                    { duration: 8000 }
                  );
                });
              }
            }
          } else {
            const success = await deleteCalendarEvent(bookingData.googleCalendarEventId, {
              name: bookingData.name,
              date: bookingData.date,
              slot: bookingData.slot || ''
            });
            if (success) {
              debugLogSync("✅ [BOOKING] Google Calendar event deleted successfully:", bookingData.googleCalendarEventId);
            } else {
              console.error("❌ [BOOKING] Failed to delete Google Calendar event:", bookingData.googleCalendarEventId);
              // Log the failure but don't fail the booking deletion
              console.warn("⚠️ [BOOKING] La prenotazione è stata eliminata dal database ma l'evento calendario potrebbe essere ancora presente");
              
              // Show warning to user
              if (typeof window !== 'undefined') {
                // Import toast dynamically to avoid SSR issues
                import('react-hot-toast').then(({ toast }) => {
                  toast.error(
                    "⚠️ Controlla il calendario Google: l'evento potrebbe non essere stato cancellato automaticamente",
                    { duration: 8000 }
                  );
                });
              }
            }
          }
        } catch (error) {
          console.error("❌ [BOOKING] Error deleting Google Calendar event:", {
            error: error,
            eventId: bookingData.googleCalendarEventId,
            bookingId: bookingId
          });
          // Don't fail the booking deletion if calendar fails
          console.warn("⚠️ [BOOKING] La prenotazione è stata eliminata dal database ma l'evento calendario potrebbe essere ancora presente");
          
          // Show warning to user
          if (typeof window !== 'undefined') {
            // Import toast dynamically to avoid SSR issues
            import('react-hot-toast').then(({ toast }) => {
              toast.error(
                "⚠️ Controlla il calendario Google: l'evento potrebbe non essere stato cancellato automaticamente",
                { duration: 8000 }
              );
            });
          }
        }
      } else {
        console.log("ℹ️ [BOOKING] Nessun evento calendario da cancellare per questa prenotazione");
      }
      
      // Create inactive client from rejected booking
      const existingClient = await getClientByEmail(bookingData.email);
      
      if (existingClient) {
        // Update existing client status to inactive
        await upsertClient({
          ...existingClient,
          status: "inactive",
          notes: existingClient.notes ? 
            `${existingClient.notes}\n\nPrenotazione rifiutata il ${new Date().toLocaleDateString("it-IT")}` :
            `Prenotazione rifiutata il ${new Date().toLocaleDateString("it-IT")}`
        });
      } else {
        // Create new inactive client from rejected booking
        const newClient: ClientCard = {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          notes: `Cliente creato automaticamente dalla prenotazione rifiutata del ${new Date(bookingData.date).toLocaleDateString("it-IT")}`,
          status: "inactive",
          source: "website",
          assignedPackage: bookingData.packageId,
          goals: [],
          medicalConditions: [],
          allergies: [],
          medications: [],
          documents: [],
          createdAt: new Date().toISOString()
        };
        
        await upsertClient(newClient);
      }
    }
  } catch (error) {
    console.error("Error creating client from rejected booking:", error);
    // Don't throw here as the main booking deletion should continue
  }
  
  await deleteDoc(doc(db as Firestore, "bookings", bookingId));
  
  // ✅ CORRETTO: Ripristina slot per qualsiasi prenotazione che occupava uno slot, non solo quelle confermate
  if (bookingData && bookingData.slot && bookingData.date) {
    try {
      const dateStr = bookingData.date.split('T')[0];
      const availDoc = col.availability(db as Firestore, dateStr);
      const availSnap = await getDoc(availDoc);
      
      // Se il documento non esiste, crealo con dati di base
      if (!availSnap.exists()) {
        await setDoc(availDoc, { 
          date: dateStr, 
          onlineSlots: [], 
          freeConsultationSlots: [], 
          inStudioSlots: [], 
          studioSlots: {} 
        });
        // Rileggi il documento appena creato
        const newAvailSnap = await getDoc(availDoc);
        if (newAvailSnap.exists()) {
          const data = newAvailSnap.data();
          // ✅ FALLBACK: Rileva consulenze gratuite anche tramite packageId se isFreeConsultation non è settato
          const isFreeConsultation = bookingData.isFreeConsultation || bookingData.packageId === "free-consultation";
          const location: "online" | "studio" = isFreeConsultation ? "online" : (bookingData.location || "online");
          
          // Processa il ripristino slot
          await processSlotRestoration(availDoc, data, bookingData, isFreeConsultation, location, dateStr);
        }
      } else {
        const data = availSnap.data();
        // ✅ FALLBACK: Rileva consulenze gratuite anche tramite packageId se isFreeConsultation non è settato
        const isFreeConsultation = bookingData.isFreeConsultation || bookingData.packageId === "free-consultation";
        const location: "online" | "studio" = isFreeConsultation ? "online" : (bookingData.location || "online");
        
        // Processa il ripristino slot
        await processSlotRestoration(availDoc, data, bookingData, isFreeConsultation, location, dateStr);
      }
    } catch (error) {
      console.error("Error restoring availability after booking deletion in Firebase:", error);
      // Don't throw here as the main booking deletion was successful
    }
  }
}

// Clients
export async function upsertClient(c: ClientCard): Promise<string> {
  if (!db) throw new Error("Firestore not configured");
  if (c.id) {
    const { id, ...data } = c;
    // Firestore does not accept undefined values – remove them
    const sanitized: Record<string, unknown> = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) sanitized[k] = v;
    });
    await setDoc(doc(db as Firestore, "clients", id), sanitized, { merge: true });
    return id;
  }
  const added = await addDoc(col.clients(db as Firestore), {
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    notes: c.notes ?? null,
    birthDate: c.birthDate ?? null,
    gender: c.gender ?? null,
    address: c.address ?? null,
    city: c.city ?? null,
    postalCode: c.postalCode ?? null,
    emergencyContact: c.emergencyContact ?? null,
    height: c.height ?? null,
    weight: c.weight ?? null,
    fitnessLevel: c.fitnessLevel ?? null,
    goals: c.goals ?? [],
    medicalConditions: c.medicalConditions ?? [],
    allergies: c.allergies ?? [],
    medications: c.medications ?? [],
    source: c.source ?? null,
    status: c.status ?? "prospect",
    assignedPackage: c.assignedPackage ?? null,
    documents: c.documents ?? [],
    createdAt: serverTimestamp(),
  });
  return added.id;
}

export async function getClientByEmail(email: string): Promise<ClientCard | null> {
  if (!db) return null;
  const q = query(collection(db, "clients"), where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? undefined,
    notes: data.notes ?? undefined,
    createdAt: tsToIso(data.createdAt),
  };
}

// Site content
export async function getSiteContent(): Promise<SiteContent | null> {
  // ⚠️ IMPORTANTE: Usa SOLO debugLogSync qui per evitare dipendenze circolari!
  debugLogSync("getSiteContent: Inizio funzione");
  debugLogSync("getSiteContent: Database configurato:", !!db);
  debugLogSync("getSiteContent: Tipo database:", typeof db);
  
  if (!db) {
    debugLogSync("getSiteContent: Database non configurato, return null");
    return null;
  }
  
  try {
    debugLogSync("getSiteContent: Caricamento contenuto da Firebase...");
  const snap = await getDoc(col.content(db as Firestore));
    debugLogSync("getSiteContent: Snap ricevuto:", snap);
    debugLogSync("getSiteContent: Snap exists:", snap.exists());
    
    if (!snap.exists()) {
      debugLogSync("getSiteContent: Nessun contenuto trovato in Firebase, creo contenuto di default");
      
      // Crea contenuto di default e salvalo in Firebase
      const defaultContent: SiteContent = {
        heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
        heroSubtitle: "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
        heroCta: "Prenota ora",
        heroBackgroundImage: "",
        heroBadgeText: "Performance • Estetica • Energia",
        heroBadgeColor: "bg-primary text-primary-foreground",

        // ✅ NUOVA FEATURE: Visibilità sezioni (tutte abilitate di default)
        sectionVisibility: {
          hero: true,
          about: true,
          images: true,
          packages: true,
          bookingForm: true,
          contact: true
        },

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
          isEnabled: true,
          title: "🎯 10 Minuti Consultivi Gratuiti",
          subtitle: "Valuta i tuoi obiettivi gratuitamente",
          description: "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance.",
          ctaText: "Prenota Ora - È Gratis!",
          packageUrl: "free-consultation"
        },
        colorPalette: "gz-default" as const,
        favicon: undefined, // ✅ AGGIUNTO: Favicon di default (undefined)
        debugLogsEnabled: true, // ✅ AGGIUNTO: Debug logs abilitati di default
        notificationEmail: "mirkoditroia@gmail.com", // Default notification email
        businessName: "GZ Nutrition", // Default business name
        recaptchaEnabled: false, // CAPTCHA disabilitato di default per sviluppo
        recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI", // Default test key
        resultsSection: {
          isEnabled: false, // Disabilitata di default
          title: "🎯 Risultati dei Nostri Clienti",
          subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
          photos: []
        },
        // ✅ AGGIUNTO: metaTags di default nel contenuto iniziale
        metaTags: {
          title: "",
          description: "",
          siteUrl: "",
          image: "",
          siteName: "GZnutrition",
          twitterCard: "summary_large_image" as const,
          ogType: "website",
          locale: "it_IT"
        }
      };
      
      // Salva il contenuto di default in Firebase
      try {
        await upsertSiteContent(defaultContent);
        debugLogSync("getSiteContent: Contenuto di default salvato in Firebase");
        return defaultContent;
      } catch (saveError) {
        console.error("getSiteContent: Errore nel salvare contenuto di default:", saveError);
        // Restituisci comunque il contenuto di default per permettere il funzionamento
        return defaultContent;
      }
    }
    
    const data = snap.data();
    debugLogSync("getSiteContent: Contenuto caricato da Firebase:", data);
    debugLogSync("getSiteContent: Contatti - phone:", data.contactPhone);
    debugLogSync("getSiteContent: Contatti - email:", data.contactEmail);
    debugLogSync("getSiteContent: Contatti - addresses:", data.contactAddresses);
    debugLogSync("getSiteContent: Contatti - social:", data.socialChannels);
    debugLogSync("getSiteContent: Popup - freeConsultationPopup:", data.freeConsultationPopup);
    debugLogSync("getSiteContent: Popup - isEnabled:", data.freeConsultationPopup?.isEnabled);
    debugLogSync("getSiteContent: Popup - title:", data.freeConsultationPopup?.title);
    
    // Forza sempre valori di default se i campi sono vuoti o undefined
    const siteContent = {
      heroTitle: data.heroTitle || "Trasforma il tuo fisico. Potenzia la tua performance.",
      heroSubtitle: data.heroSubtitle || "Coaching nutrizionale e training su misura per giovani adulti 20–35.",
      heroCta: data.heroCta || "Prenota ora",
      heroBackgroundImage: data.heroBackgroundImage || "",
      heroBadgeText: data.heroBadgeText || "Performance • Estetica • Energia",
      heroBadgeColor: data.heroBadgeColor || "bg-primary text-primary-foreground",

      // ✅ NUOVA FEATURE: Visibilità sezioni con fallback
      sectionVisibility: data.sectionVisibility ? {
        hero: data.sectionVisibility.hero !== false, // Default true
        about: data.sectionVisibility.about !== false, // Default true
        images: data.sectionVisibility.images !== false, // Default true
        packages: data.sectionVisibility.packages !== false, // Default true
        bookingForm: data.sectionVisibility.bookingForm !== false, // Default true
        contact: data.sectionVisibility.contact !== false // Default true
      } : {
        hero: true,
        about: true,
        images: true,
        packages: true,
        bookingForm: true,
        contact: true
      },

      navbarLogoMode: ((val: unknown) => (val === 'image' || val === 'text' ? val : undefined))((data as { navbarLogoMode?: unknown }).navbarLogoMode) as 'image' | 'text' | undefined,
      navbarLogoImageUrl: (data as { navbarLogoImageUrl?: string }).navbarLogoImageUrl || undefined,
      navbarLogoHeight: typeof (data as { navbarLogoHeight?: number }).navbarLogoHeight === 'number' ? (data as { navbarLogoHeight?: number }).navbarLogoHeight : undefined,
      navbarLogoAutoRemoveBg: Boolean((data as { navbarLogoAutoRemoveBg?: boolean }).navbarLogoAutoRemoveBg),
      navbarLogoText: (data as { navbarLogoText?: string }).navbarLogoText || undefined,
      navbarLogoTextColor: (data as { navbarLogoTextColor?: string }).navbarLogoTextColor || undefined,
      navbarLogoTextWeight: typeof (data as { navbarLogoTextWeight?: number }).navbarLogoTextWeight === 'number' ? (data as { navbarLogoTextWeight?: number }).navbarLogoTextWeight : undefined,
      navbarLogoTextSize: typeof (data as { navbarLogoTextSize?: number }).navbarLogoTextSize === 'number' ? (data as { navbarLogoTextSize?: number }).navbarLogoTextSize : undefined,
      aboutTitle: data.aboutTitle || "Chi Sono",
      aboutBody: data.aboutBody || "Sono Gabriele Zambonin, nutrizionista e personal trainer. Ti guido con un metodo scientifico e pratico per raggiungere forma fisica, energia e benessere reale.",
      aboutImageUrl: data.aboutImageUrl || "",
    images: Array.isArray(data.images) ? data.images : [],
      contactTitle: data.contactTitle || "📞 Contattami",
      contactSubtitle: data.contactSubtitle || "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
      contactPhone: data.contactPhone || "+39 123 456 7890",
      contactEmail: data.contactEmail || "info@gznutrition.it",
      contactAddresses: Array.isArray(data.contactAddresses) && data.contactAddresses.length > 0 ? data.contactAddresses : [
        {
          name: "Studio Principale",
          address: "Via Roma 123",
          city: "Milano",
          postalCode: "20100",
          coordinates: { lat: 45.4642, lng: 9.1900 }
        }
      ],
      socialChannels: Array.isArray(data.socialChannels) && data.socialChannels.length > 0 ? data.socialChannels : [
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
      contactSectionTitle: data.contactSectionTitle || "💬 Contatti Diretti",
      contactSectionSubtitle: data.contactSectionSubtitle || "Siamo qui per aiutarti",
      studiosSectionTitle: data.studiosSectionTitle || "🏢 I Nostri Studi",
      studiosSectionSubtitle: data.studiosSectionSubtitle || "Trova lo studio più vicino a te",
      freeConsultationPopup: {
        isEnabled: data.freeConsultationPopup?.isEnabled === true || data.freeConsultationPopup?.isEnabled === "true" || String(data.freeConsultationPopup?.isEnabled) === "true",
        title: data.freeConsultationPopup?.title || "🎯 10 Minuti Consultivi Gratuiti",
        subtitle: data.freeConsultationPopup?.subtitle || "Valuta i tuoi obiettivi gratuitamente",
        description: data.freeConsultationPopup?.description || "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance.",
        ctaText: data.freeConsultationPopup?.ctaText || "Prenota Ora - È Gratis!",
        packageUrl: data.freeConsultationPopup?.packageUrl || "free-consultation"
      },
      googleCalendar: (() => {
        const calendarConfig = {
          isEnabled: data.googleCalendar?.isEnabled || false,
          calendarId: "dc16aa394525fb01f5906273e6a3f1e47cf616ee466cedd511698e3f285288d6@group.calendar.google.com", // FORCED: Ignora database, usa sempre questo ID
          timezone: data.googleCalendar?.timezone || "Europe/Rome",
          serviceAccountEmail: data.googleCalendar?.serviceAccountEmail || "zambo-489@gznutrition-d5d13.iam.gserviceaccount.com"
        };
        console.log("🔍 [CALENDAR CONFIG] ID utilizzato:", calendarConfig.calendarId);
        console.log("🔍 [CALENDAR CONFIG] Da database:", data.googleCalendar?.calendarId);
        return calendarConfig;
      })(),
      colorPalette: (data.colorPalette as 'gz-default' | 'modern-blue' | 'elegant-dark' | 'nature-green' | 'warm-orange' | 'professional-gray') || 'gz-default',
      favicon: data.favicon || undefined, // ✅ AGGIUNTO: Mapping del favicon da Firebase
      // ✅ AGGIUNTO: Mapping dei metaTags da Firebase
      metaTags: data.metaTags ? {
        title: data.metaTags.title || "",
        description: data.metaTags.description || "",
        siteUrl: data.metaTags.siteUrl || "",
        image: data.metaTags.image || "",
        siteName: data.metaTags.siteName || "GZnutrition",
        twitterCard: (data.metaTags.twitterCard as "summary" | "summary_large_image") || "summary_large_image",
        ogType: data.metaTags.ogType || "website",
        locale: data.metaTags.locale || "it_IT"
      } : {
        title: "",
        description: "",
        siteUrl: "",
        image: "",
        siteName: "GZnutrition",
        twitterCard: "summary_large_image" as const,
        ogType: "website",
        locale: "it_IT"
      },
      debugLogsEnabled: data.debugLogsEnabled !== false, // ✅ AGGIUNTO: Debug logs abilitati di default
      notificationEmail: data.notificationEmail || "mirkoditroia@gmail.com",
      businessName: data.businessName || "GZ Nutrition",
      recaptchaEnabled: data.recaptchaEnabled === true, // Default false, esplicito true per abilitare
      recaptchaSiteKey: data.recaptchaSiteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
      resultsSection: data.resultsSection ? {
        isEnabled: data.resultsSection.isEnabled === true,
        title: data.resultsSection.title || "🎯 Risultati dei Nostri Clienti",
        subtitle: data.resultsSection.subtitle || "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
        photos: Array.isArray(data.resultsSection.photos) ? data.resultsSection.photos : []
      } : {
        isEnabled: false,
        title: "🎯 Risultati dei Nostri Clienti",
        subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
        photos: []
      },

      // ✅ AGGIUNTA MAPPATURA: BMI Calculator
      bmiCalculator: data.bmiCalculator && typeof data.bmiCalculator === 'object' ? {
        enabled: data.bmiCalculator.enabled === true,
        title: data.bmiCalculator.title || "📊 Calcola il tuo BMI",
        subtitle: data.bmiCalculator.subtitle || "Scopri il tuo Indice di Massa Corporea"
      } : undefined,

      // ✅ AGGIUNTA MAPPATURA: Google Reviews  
      googleReviews: data.googleReviews && typeof data.googleReviews === 'object' ? {
        enabled: data.googleReviews.enabled !== false, // Default true
        title: data.googleReviews.title || "⭐ Recensioni Google",
        subtitle: data.googleReviews.subtitle || "Cosa dicono i nostri clienti",
        businessName: data.googleReviews.businessName || "GZ Nutrition",
        profileUrl: data.googleReviews.profileUrl || undefined,
        fallbackReviews: Array.isArray(data.googleReviews.fallbackReviews) 
          ? data.googleReviews.fallbackReviews.map((review: any) => ({
              ...review,
              source: review.source || 'fallback' // Assicura source sempre presente
            }))
          : []
      } : undefined,
      
      // ✅ AGGIUNGI MAPPING PER legalInfo
      legalInfo: data.legalInfo ? {
        companyName: data.legalInfo.companyName || "",
        vatNumber: data.legalInfo.vatNumber || "",
        taxCode: data.legalInfo.taxCode || "",
        email: data.legalInfo.email || "",
        registeredAddress: data.legalInfo.registeredAddress || "",
        footerText: data.legalInfo.footerText || "",
        showLegalLinks: data.legalInfo.showLegalLinks !== false,
        gdprConsentText: data.legalInfo.gdprConsentText || "",
        cookieBanner: {
          enabled: data.legalInfo.cookieBanner?.enabled !== false,
          title: data.legalInfo.cookieBanner?.title || "🍪 Utilizzo dei Cookie",
          message: data.legalInfo.cookieBanner?.message || "Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per fornire funzionalità personalizzate. Continuando a navigare accetti l'utilizzo dei cookie.",
          acceptText: data.legalInfo.cookieBanner?.acceptText || "Accetta",
          declineText: data.legalInfo.cookieBanner?.declineText || "Rifiuta",
          learnMoreText: data.legalInfo.cookieBanner?.learnMoreText || "Scopri di più"
        },
        legalPages: {
          privacyPolicy: {
            title: data.legalInfo.legalPages?.privacyPolicy?.title || "Privacy Policy",
            lastUpdated: data.legalInfo.legalPages?.privacyPolicy?.lastUpdated || new Date().toLocaleDateString('it-IT'),
            content: data.legalInfo.legalPages?.privacyPolicy?.content || ""
          },
          cookiePolicy: {
            title: data.legalInfo.legalPages?.cookiePolicy?.title || "Cookie Policy",
            lastUpdated: data.legalInfo.legalPages?.cookiePolicy?.lastUpdated || new Date().toLocaleDateString('it-IT'),
            content: data.legalInfo.legalPages?.cookiePolicy?.content || ""
          },
          termsOfService: {
            title: data.legalInfo.legalPages?.termsOfService?.title || "Termini di Servizio",
            lastUpdated: data.legalInfo.legalPages?.termsOfService?.lastUpdated || new Date().toLocaleDateString('it-IT'),
            content: data.legalInfo.legalPages?.termsOfService?.content || ""
          }
        }
      } : {
        companyName: "",
        vatNumber: "",
        taxCode: "",
        email: "",
        registeredAddress: "",
        footerText: "",
        showLegalLinks: true,
        gdprConsentText: "",
        cookieBanner: {
          enabled: true,
          title: "🍪 Utilizzo dei Cookie",
          message: "Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per fornire funzionalità personalizzate. Continuando a navigare accetti l'utilizzo dei cookie.",
          acceptText: "Accetta",
          declineText: "Rifiuta",
          learnMoreText: "Scopri di più"
        },
        legalPages: {
          privacyPolicy: {
            title: "Privacy Policy",
            lastUpdated: new Date().toLocaleDateString('it-IT'),
            content: ""
          },
          cookiePolicy: {
            title: "Cookie Policy",
            lastUpdated: new Date().toLocaleDateString('it-IT'),
            content: ""
          },
          termsOfService: {
            title: "Termini di Servizio",
            lastUpdated: new Date().toLocaleDateString('it-IT'),
            content: ""
          }
        }
      }
    };
    
    debugLogSync("getSiteContent: Contenuto finale mappato:", siteContent);
    debugLogSync("🔍 getSiteContent: BMI raw da DB:", data.bmiCalculator);
    debugLogSync("🔍 getSiteContent: BMI mappato finale:", siteContent.bmiCalculator);
    debugLogSync("🔍 getSiteContent: Reviews raw da DB:", data.googleReviews);
    debugLogSync("🔍 getSiteContent: Reviews mappate finale:", siteContent.googleReviews);
    debugLogSync("🔍 getSiteContent: LegalInfo raw da DB:", data.legalInfo);
    debugLogSync("🔍 getSiteContent: LegalInfo mappato finale:", siteContent.legalInfo);
    debugLogSync("🎯 getSiteContent: FAVICON raw da DB:", data.favicon);
    debugLogSync("🎯 getSiteContent: FAVICON mappato finale:", siteContent.favicon);
    debugLogSync("🔗 getSiteContent: META TAGS raw da DB:", data.metaTags);
    debugLogSync("🔗 getSiteContent: META TAGS mappati finale:", siteContent.metaTags);
    return siteContent;
  } catch (error) {
    console.error("getSiteContent: Errore nel caricamento da Firebase:", error);
    return null;
  }
}

export async function upsertSiteContent(content: SiteContent): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  
  debugLogSync("🔥 [Firebase] upsertSiteContent chiamato");
  debugLogSync("🔥 [Firebase] Content originale:", content);
  debugLogSync("🔥 [Firebase] BMI config:", content.bmiCalculator);
  debugLogSync("🔥 [Firebase] Reviews config:", content.googleReviews);
  debugLogSync("🔥 [Firebase] LegalInfo config:", content.legalInfo);
  debugLogSync("🎯 [Firebase] FAVICON config:", content.favicon || "NESSUN FAVICON");
  
  // Firestore non accetta valori undefined: rimuoviamoli in modo sicuro
  const sanitized = JSON.parse(JSON.stringify(content));
  
  // ✅ ASSICURATI che sectionVisibility sia sempre presente con valori di default
  if (!sanitized.sectionVisibility) {
    sanitized.sectionVisibility = {
      hero: true,
      about: true,
      images: true,
      packages: true,
      bookingForm: true,
      contact: true
    };
  } else {
    // Se sectionVisibility esiste, assicurati che tutti i campi necessari siano presenti
    sanitized.sectionVisibility = {
      hero: sanitized.sectionVisibility.hero !== false,
      about: sanitized.sectionVisibility.about !== false,
      images: sanitized.sectionVisibility.images !== false,
      packages: sanitized.sectionVisibility.packages !== false,
      bookingForm: sanitized.sectionVisibility.bookingForm !== false,
      contact: sanitized.sectionVisibility.contact !== false
    };
  }

  // ✅ ASSICURATI che legalInfo sia sempre presente con valori di default
  // Se legalInfo non esiste o è undefined, crealo con valori di default
  if (!sanitized.legalInfo) {
    sanitized.legalInfo = {
      companyName: "",
      vatNumber: "",
      taxCode: "",
      email: "",
      registeredAddress: "",
      footerText: "",
      showLegalLinks: true,
      gdprConsentText: "",
      cookieBanner: {
        enabled: true,
        title: "🍪 Utilizzo dei Cookie",
        message: "Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per fornire funzionalità personalizzate. Continuando a navigare accetti l'utilizzo dei cookie.",
        acceptText: "Accetta",
        declineText: "Rifiuta",
        learnMoreText: "Scopri di più"
      },
      legalPages: {
        privacyPolicy: {
          title: "Privacy Policy",
          lastUpdated: new Date().toLocaleDateString('it-IT'),
          content: ""
        },
        cookiePolicy: {
          title: "Cookie Policy", 
          lastUpdated: new Date().toLocaleDateString('it-IT'),
          content: ""
        },
        termsOfService: {
          title: "Termini di Servizio",
          lastUpdated: new Date().toLocaleDateString('it-IT'),
          content: ""
        }
      }
    };
  } else {
    // Se legalInfo esiste, assicurati che tutti i campi necessari siano presenti
    sanitized.legalInfo = {
      companyName: sanitized.legalInfo.companyName || "",
      vatNumber: sanitized.legalInfo.vatNumber || "",
      taxCode: sanitized.legalInfo.taxCode || "",
      email: sanitized.legalInfo.email || "",
      registeredAddress: sanitized.legalInfo.registeredAddress || "",
      footerText: sanitized.legalInfo.footerText || "",
      showLegalLinks: sanitized.legalInfo.showLegalLinks !== false,
      gdprConsentText: sanitized.legalInfo.gdprConsentText || "",
      cookieBanner: {
        enabled: sanitized.legalInfo.cookieBanner?.enabled !== false,
        title: sanitized.legalInfo.cookieBanner?.title || "🍪 Utilizzo dei Cookie",
        message: sanitized.legalInfo.cookieBanner?.message || "Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per fornire funzionalità personalizzate. Continuando a navigare accetti l'utilizzo dei cookie.",
        acceptText: sanitized.legalInfo.cookieBanner?.acceptText || "Accetta",
        declineText: sanitized.legalInfo.cookieBanner?.declineText || "Rifiuta",
        learnMoreText: sanitized.legalInfo.cookieBanner?.learnMoreText || "Scopri di più"
      },
      legalPages: {
        privacyPolicy: {
          title: sanitized.legalInfo.legalPages?.privacyPolicy?.title || "Privacy Policy",
          lastUpdated: sanitized.legalInfo.legalPages?.privacyPolicy?.lastUpdated || new Date().toLocaleDateString('it-IT'),
          content: sanitized.legalInfo.legalPages?.privacyPolicy?.content || ""
        },
        cookiePolicy: {
          title: sanitized.legalInfo.legalPages?.cookiePolicy?.title || "Cookie Policy",
          lastUpdated: sanitized.legalInfo.legalPages?.cookiePolicy?.lastUpdated || new Date().toLocaleDateString('it-IT'),
          content: sanitized.legalInfo.legalPages?.cookiePolicy?.content || ""
        },
        termsOfService: {
          title: sanitized.legalInfo.legalPages?.termsOfService?.title || "Termini di Servizio",
          lastUpdated: sanitized.legalInfo.legalPages?.termsOfService?.lastUpdated || new Date().toLocaleDateString('it-IT'),
          content: sanitized.legalInfo.legalPages?.termsOfService?.content || ""
        }
      }
    };
  }

  // ✅ ASSICURATI che metaTags sia sempre presente con valori di default
  if (!sanitized.metaTags) {
    sanitized.metaTags = {
      title: "",
      description: "",
      siteUrl: "",
      image: "",
      siteName: "GZnutrition",
      twitterCard: "summary_large_image",
      ogType: "website",
      locale: "it_IT"
    };
  } else {
    // Se metaTags esiste, assicurati che tutti i campi necessari siano presenti
    sanitized.metaTags = {
      title: sanitized.metaTags.title || "",
      description: sanitized.metaTags.description || "",
      siteUrl: sanitized.metaTags.siteUrl || "",
      image: sanitized.metaTags.image || "",
      siteName: sanitized.metaTags.siteName || "GZnutrition",
      twitterCard: sanitized.metaTags.twitterCard || "summary_large_image",
      ogType: sanitized.metaTags.ogType || "website",
      locale: sanitized.metaTags.locale || "it_IT"
    };
  }
  
  debugLogSync("🔥 [Firebase] Content sanitizzato:", sanitized);
  debugLogSync("🔥 [Firebase] BMI sanitizzato:", sanitized.bmiCalculator);
  debugLogSync("🔥 [Firebase] Reviews sanitizzato:", sanitized.googleReviews);
  debugLogSync("🔥 [Firebase] LegalInfo sanitizzato:", sanitized.legalInfo);
  debugLogSync("🔥 [Firebase] 🔗 META TAGS sanitizzato:", sanitized.metaTags);
  
  debugLogSync("🔥 [Firebase] Chiamando setDoc...");
  await setDoc(col.content(db as Firestore), sanitized, { merge: true });
  debugLogSync("🔥 [Firebase] ✅ setDoc completato con successo");
}

// Availability
export async function getAvailabilityByDate(date: string): Promise<Availability | null> {
  if (!db) return null;
  
  debugLogSync("🔍 getAvailabilityByDate Firebase per data:", date);
  const snap = await getDoc(col.availability(db as Firestore, date));
  
  if (!snap.exists()) {
    debugLogSync("❌ Nessun documento availability trovato per data:", date);
    return null;
  }
  
  const data = snap.data() as DocumentData;
  debugLogSync("📊 Dati raw da Firebase per", date, ":", data);
  
  const result = { 
    date,
    onlineSlots: Array.isArray(data.onlineSlots) ? data.onlineSlots : (Array.isArray(data.slots) ? data.slots : []),
    inStudioSlots: Array.isArray(data.inStudioSlots) ? data.inStudioSlots : [],
    studioSlots: (data.studioSlots && typeof data.studioSlots === 'object') ? (data.studioSlots as Record<string, string[]>) : {},
    slots: Array.isArray(data.slots) ? data.slots : undefined,
    freeConsultationSlots: Array.isArray(data.freeConsultationSlots) ? data.freeConsultationSlots : [],
    // Gestione retrocompatibilità per il vecchio formato
    legacyFreeConsultationSlots: Array.isArray(data.legacyFreeConsultationSlots) ? data.legacyFreeConsultationSlots : undefined
  };
  
  debugLogSync("✅ Availability processata:", result);
  debugLogSync("🎯 freeConsultationSlots trovati:", result.freeConsultationSlots);
  
  return result;
}

export async function upsertAvailabilityForDate(
  date: string,
  onlineSlots: string[],
  freeConsultationSlots?: FreeConsultationSlot[] | string[],
  inStudioSlots?: string[],
  studioSlots?: Record<string, string[]>
): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  const payload: Record<string, unknown> = { date, onlineSlots };
  // Evita di inviare campi undefined a Firestore
  if (Array.isArray(freeConsultationSlots)) {
    payload.freeConsultationSlots = freeConsultationSlots;
  }
  if (Array.isArray(inStudioSlots)) {
    payload.inStudioSlots = inStudioSlots;
  }
  if (studioSlots && typeof studioSlots === 'object') {
    payload.studioSlots = studioSlots;
  }
  await setDoc(col.availability(db as Firestore, date), payload, { merge: true });
}

// Helper function per processare il ripristino slot
async function processSlotRestoration(
  availDoc: DocumentReference, 
  data: DocumentData, 
  bookingData: Booking, 
  isFreeConsultation: boolean, 
  location: "online" | "studio", 
  dateStr: string
): Promise<void> {
  if (location === "online") {
    // ✅ CORREZIONE: Per consulenze gratuite, ripristina nei freeConsultationSlots
    if (isFreeConsultation) {
      const freeSlots = (data.freeConsultationSlots || []) as (string | FreeConsultationSlot)[];
      const slotExists = freeSlots.some(slot => {
        const slotTime = typeof slot === 'string' ? slot : slot.time;
        return slotTime === bookingData.slot;
      });
      
      if (!slotExists) {
        // Aggiungi lo slot come oggetto con durata dal booking o default
        const newSlot: FreeConsultationSlot = {
          time: bookingData.slot,
          duration: bookingData.consultationDuration || 10 // Usa durata dal booking o default
        };
        const updated = [...freeSlots, newSlot].sort((a, b) => {
          const timeA = typeof a === 'string' ? a : a.time;
          const timeB = typeof b === 'string' ? b : b.time;
          return timeA.localeCompare(timeB);
        });
        
        // Aggiorna solo freeConsultationSlots mantenendo gli altri dati
        await setDoc(availDoc, { 
          ...data,
          date: dateStr, 
          freeConsultationSlots: updated 
        });
      }
    } else {
      // Per consulenze normali, ripristina negli onlineSlots
      const online = (data.onlineSlots || data.slots || []) as string[];
      if (!online.includes(bookingData.slot)) {
        const updated = [...online, bookingData.slot].sort();
        
        // Aggiorna solo onlineSlots mantenendo gli altri dati
        await setDoc(availDoc, { 
          ...data,
          date: dateStr, 
          onlineSlots: updated 
        });
      }
    }
  } else {
    if (bookingData.studioLocation) {
      const studioMap = (data.studioSlots || {}) as Record<string, string[]>;
      const studio = studioMap[bookingData.studioLocation] || [];
      if (!studio.includes(bookingData.slot)) {
        studioMap[bookingData.studioLocation] = [...studio, bookingData.slot].sort();
        await setDoc(availDoc, { ...data, date: dateStr, studioSlots: studioMap });
      }
    } else {
      const inStudio = (data.inStudioSlots || []) as string[];
      if (!inStudio.includes(bookingData.slot)) {
        const updated = [...inStudio, bookingData.slot].sort();
        await setDoc(availDoc, { ...data, date: dateStr, inStudioSlots: updated });
      }
    }
  }
}

// Serialization helpers
function tsToIso(ts?: Timestamp | null): string | undefined {
  if (!ts) return undefined;
  try {
    return ts.toDate().toISOString();
  } catch {
    return undefined;
  }
}

function toBooking(id: string, data: DocumentData): Booking {
  return {
    id,
    clientId: data.clientId ?? undefined,
    name: data.name,
    email: data.email,
    phone: data.phone ?? undefined,
    packageId: data.packageId ?? undefined,
    date: data.date,
    slot: data.slot ?? undefined,
    location: data.location ?? undefined,
    studioLocation: data.studioLocation ?? undefined,
    status: data.status,
    priority: !!data.priority,
    channelPreference: data.channelPreference ?? undefined,
    isFreeConsultation: !!data.isFreeConsultation, // ✅ AGGIUNTO: Mapping flag consulenza gratuita
    consultationDuration: data.consultationDuration ?? undefined, // ✅ AGGIUNTO: Mapping durata consulenza gratuita
    notes: data.notes ?? undefined, // ✅ AGGIUNTO: Mapping note del cliente
    createdAt: tsToIso(data.createdAt),
    googleCalendarEventId: data.googleCalendarEventId ?? undefined,
  };
}

function toClientCard(id: string, data: DocumentData): ClientCard {
  return {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? undefined,
    notes: data.notes ?? undefined,
    birthDate: data.birthDate ?? undefined,
    gender: data.gender ?? undefined,
    address: data.address ?? undefined,
    city: data.city ?? undefined,
    postalCode: data.postalCode ?? undefined,
    emergencyContact: data.emergencyContact ?? undefined,
    height: data.height ?? undefined,
    weight: data.weight ?? undefined,
    fitnessLevel: data.fitnessLevel ?? undefined,
    goals: Array.isArray(data.goals) ? data.goals : [],
    medicalConditions: Array.isArray(data.medicalConditions) ? data.medicalConditions : [],
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    source: data.source ?? undefined,
    status: data.status ?? "prospect",
    assignedPackage: data.assignedPackage ?? undefined,
    documents: Array.isArray(data.documents) ? data.documents : [],
    createdAt: tsToIso(data.createdAt),
  };
}

// SSR helpers via Firestore REST (for ISR-friendly fetch without Admin SDK)
export async function getSiteContentSSR(projectId: string): Promise<SiteContent | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/content/landing`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  const f: Record<string, unknown> = json.fields || {};
  const fromFs = (k: string) => (typeof f[k] === "object" && f[k] && (f[k] as { stringValue?: string }).stringValue) || "";

  type FirestoreMapValue = { mapValue: { fields: Record<string, { stringValue?: string }> } };
  type FirestoreArrayValue = { arrayValue?: { values?: FirestoreMapValue[] } } | undefined;
  const arr = <T>(field: FirestoreArrayValue, mapFn: (x: FirestoreMapValue) => T): T[] => {
    const values = field?.arrayValue?.values;
    return Array.isArray(values) ? values.map(mapFn) : [];
  };
  const images = arr(f.images as FirestoreArrayValue, (v) => ({ key: v.mapValue.fields.key.stringValue!, url: v.mapValue.fields.url.stringValue! }));
  return {
    heroTitle: fromFs("heroTitle"),
    heroSubtitle: fromFs("heroSubtitle"),
    heroCta: fromFs("heroCta"),
    heroBackgroundImage: fromFs("heroBackgroundImage"),
    heroBadgeText: fromFs("heroBadgeText") || "Performance • Estetica • Energia",
    heroBadgeColor: fromFs("heroBadgeColor") || "bg-primary text-primary-foreground",
    aboutTitle: fromFs("aboutTitle"),
    aboutBody: fromFs("aboutBody"),
    aboutImageUrl: fromFs("aboutImageUrl"),
    images,
    contactTitle: fromFs("contactTitle"),
    contactSubtitle: fromFs("contactSubtitle"),
    contactPhone: fromFs("contactPhone"),
    contactEmail: fromFs("contactEmail"),
    contactAddresses: arr(f.contactAddresses as FirestoreArrayValue, (v) => ({
      name: v.mapValue.fields.name?.stringValue || "",
      address: v.mapValue.fields.address?.stringValue || "",
      city: v.mapValue.fields.city?.stringValue || "",
      postalCode: v.mapValue.fields.postalCode?.stringValue || "",
      coordinates: v.mapValue.fields.coordinates?.stringValue ? JSON.parse(v.mapValue.fields.coordinates.stringValue) : undefined
    })),
    socialChannels: arr(f.socialChannels as FirestoreArrayValue, (v) => ({
      platform: v.mapValue.fields.platform?.stringValue || "",
      url: v.mapValue.fields.url?.stringValue || "",
      icon: v.mapValue.fields.icon?.stringValue || ""
    })),
    contactSectionTitle: fromFs("contactSectionTitle") || "💬 Contatti Diretti",
    contactSectionSubtitle: fromFs("contactSectionSubtitle"),
    studiosSectionTitle: fromFs("studiosSectionTitle") || "🏢 I Nostri Studi",
    studiosSectionSubtitle: fromFs("studiosSectionSubtitle"),
    freeConsultationPopup: {
      isEnabled: fromFs("freeConsultationPopup.isEnabled") === "true",
      title: fromFs("freeConsultationPopup.title") || "🎯 10 Minuti Consultivi Gratuiti",
      subtitle: fromFs("freeConsultationPopup.subtitle") || "Valuta i tuoi obiettivi gratuitamente",
      description: fromFs("freeConsultationPopup.description") || "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance.",
      ctaText: fromFs("freeConsultationPopup.ctaText") || "Prenota Ora - È Gratis!",
      packageUrl: fromFs("freeConsultationPopup.packageUrl") || "free-consultation"
    },
    colorPalette: (fromFs("colorPalette") as 'gz-default' | 'modern-blue' | 'elegant-dark' | 'nature-green' | 'warm-orange' | 'professional-gray') || 'gz-default',
    notificationEmail: fromFs("notificationEmail") || "mirkoditroia@gmail.com",
    businessName: fromFs("businessName") || "GZ Nutrition",
    recaptchaEnabled: fromFs("recaptchaEnabled") === "true", // Default false
    recaptchaSiteKey: fromFs("recaptchaSiteKey") || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
  };
}

export const defaultFaq: { q: string; a: string }[] = [
  { q: "Quanto tempo serve per vedere risultati?", a: "Generalmente 4–6 settimane per cambi visibili, dipende dall'aderenza." },
  { q: "Serve palestra?", a: "Consigliata ma non obbligatoria. Programmi adattabili anche a casa." },
  { q: "I piani sono personalizzati?", a: "Sì: obiettivi, preferenze alimentari e disponibilità oraria." },
  { q: "Come avviene il follow-up?", a: "Check-in settimanali e chat per aggiustamenti in tempo reale." },
  { q: "Posso sospendere?", a: "Puoi mettere in pausa e riprendere senza costi aggiuntivi." },
];

// Additional client functions
export async function listClients(): Promise<ClientCard[]> {
  if (!db) return [];
  const snap = await getDocs(query(col.clients(db as Firestore), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => toClientCard(d.id, d.data()));
}

export async function getClientById(id: string): Promise<ClientCard | null> {
  if (!db) return null;
  const database = db as Firestore;
  const snap = await getDoc(doc(database, "clients", id));
  if (!snap.exists()) return null;
  return toClientCard(snap.id, snap.data());
}

export async function deleteClient(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  await deleteDoc(doc(db as Firestore, "clients", id));
}

// Funzioni per gestire i progressi dei clienti
export async function saveClientProgress(progress: Omit<ClientProgress, 'id' | 'createdAt'>): Promise<string> {
  if (!db) throw new Error("Firestore not configured");
  
  const progressData = {
    ...progress,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db as Firestore, "clientProgress"), progressData);
  return docRef.id;
}

export async function getClientProgress(clientId: string): Promise<ClientProgress[]> {
  if (!db) return [];
  
  try {
    // Prova prima con l'ordinamento (quando l'indice sarà pronto)
    const q = query(
      collection(db as Firestore, "clientProgress"),
      where("clientId", "==", clientId),
      orderBy("date", "desc")
    );
    
    const snap = await getDocs(q);
    const results = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        clientId: data.clientId,
        date: data.date,
        weight: data.weight,
        bodyFat: data.bodyFat,
        muscleMass: data.muscleMass,
        measurements: data.measurements,
        notes: data.notes,
        photos: data.photos,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as ClientProgress;
    });
    
    return results;
  } catch (error) {
    // Se l'indice non è ancora pronto, usa una query senza ordinamento
    debugLogSync("Indice non ancora pronto, uso query senza ordinamento");
    const q = query(
      collection(db as Firestore, "clientProgress"),
      where("clientId", "==", clientId)
    );
    
    const snap = await getDocs(q);
    const results = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        clientId: data.clientId,
        date: data.date,
        weight: data.weight,
        bodyFat: data.bodyFat,
        muscleMass: data.muscleMass,
        measurements: data.measurements,
        notes: data.notes,
        photos: data.photos,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as ClientProgress;
    });
    
    // Ordina manualmente i risultati
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export async function updateClientProgress(progressId: string, updates: Partial<ClientProgress>): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  
  const { id, createdAt, ...updateData } = updates;
  await updateDoc(doc(db as Firestore, "clientProgress", progressId), updateData);
}

export async function deleteClientProgress(progressId: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  await deleteDoc(doc(db as Firestore, "clientProgress", progressId));
}

export async function createClientFromPendingBooking(booking: Booking): Promise<string> {
  if (!db) throw new Error("Firestore not configured");
  
  // Check if client already exists
  const existingClient = await getClientByEmail(booking.email);
  
  if (existingClient) {
    // Update existing client with pending booking information
    await upsertClient({
      ...existingClient,
      name: booking.name,
      phone: booking.phone || existingClient.phone,
      assignedPackage: booking.packageId || existingClient.assignedPackage,
      status: "prospect",
      source: existingClient.source || "website"
    });
    return existingClient.id!;
  } else {
    // Create new prospect client from pending booking
    const newClient: ClientCard = {
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      notes: `Cliente creato automaticamente dalla prenotazione in attesa del ${new Date(booking.date).toLocaleDateString("it-IT")}`,
      status: "prospect",
      source: "website",
      assignedPackage: booking.packageId,
      goals: [],
      medicalConditions: [],
      allergies: [],
      medications: [],
      documents: [],
      createdAt: new Date().toISOString()
    };
    
    return await upsertClient(newClient);
  }
}


