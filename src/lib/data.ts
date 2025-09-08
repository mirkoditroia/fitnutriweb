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
  updateDoc,
} from "firebase/firestore";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, ensureCalendarEvent } from "./googleCalendar";

// Funzione per inviare notifica email per nuova prenotazione al dottore
async function sendBookingNotification(booking: Booking, packageTitle?: string, notificationEmail?: string, businessName?: string, colorPalette?: string) {
  try {
    console.log("📤 sendBookingNotification chiamata con:", { 
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

    console.log("📬 Risposta Firebase Functions:", response.status);
    const result = await response.json();
    console.log("📋 Risultato email:", result);
    
    if (result.success) {
      console.log('✅ Booking notification sent successfully:', result.sentTo);
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
  status?: "active" | "inactive" | "prospect";
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
  isFreeConsultation?: boolean; // Flag per i 10 minuti consultivi
  notes?: string; // Note del cliente (sezione "Parlami di te")
  googleCalendarEventId?: string; // ID dell'evento Google Calendar
};

export interface SiteContent {
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
    placeId?: string; // Google Place ID per link diretto alle recensioni
    fallbackReviews?: GoogleReview[]; // Recensioni manuali gestite da admin
  };
  
  // ✅ LEGAL COMPLIANCE: Informazioni legali per footer e GDPR
  legalInfo?: {
    // Informazioni aziendali
    companyName?: string; // Nome dell'azienda (default: "GZnutrition")
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
}

export type Availability = {
  date: string;
  // Slot separati per sede
  onlineSlots?: string[];
  inStudioSlots?: string[];
  studioSlots?: Record<string, string[]>; // mappa sede -> slot specifici
  // Retrocompatibilità: slots aggregati (preferire i campi sopra)
  slots?: string[];
  // Slot dedicati ai 10 minuti consultivi (sempre online per default)
  freeConsultationSlots?: string[];
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
    console.log("getPackages: Database non configurato");
    return [];
  }
  
  try {
    console.log("getPackages: Caricamento pacchetti da Firebase...");
  const database = db as Firestore;
    const snap = await getDocs(query(col.packages(database), orderBy("createdAt", "desc")));
    
    console.log("getPackages: Snap ricevuto:", snap);
    console.log("getPackages: Numero documenti:", snap.docs.length);
    
    const packages = snap.docs.map((d) => {
      const data = d.data();
      console.log(`getPackages: Documento ${d.id}:`, data);
      
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
      
      console.log(`getPackages: Pacchetto mappato ${d.id}:`, mappedPackage);
      return mappedPackage;
    });
    
    console.log("getPackages: Pacchetti processati:", packages);
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

export async function createBooking(b: Booking, captchaToken?: string): Promise<string> {
  console.log("🔥 createBooking Firebase iniziato:", { 
    isFreeConsultation: b.isFreeConsultation, 
    slot: b.slot, 
    date: b.date,
    dateFormatted: new Date(b.date).toISOString().split('T')[0],
    packageId: b.packageId 
  });
  
  if (!db) throw new Error("Firestore not configured");
  
  // Verifica CAPTCHA se abilitato
  const siteContent = await getSiteContent();
  if (siteContent?.recaptchaEnabled && captchaToken) {
    try {
      const response = await fetch('https://us-central1-gznutrition-d5d13.cloudfunctions.net/verifyCaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error("Verifica CAPTCHA fallita. Riprova.");
      }
    } catch (error) {
      console.error("Errore verifica CAPTCHA:", error);
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
  console.log("🔍 FORMATO DATA DEBUG:");
  console.log("📅 Data originale dal form:", b.date);
  console.log("📅 Data standardizzata per query:", dateString);
  
  // Controlla che lo slot sia effettivamente disponibile
  const availability = await getAvailabilityByDate(dateString);
  const location: "online" | "studio" = b.isFreeConsultation ? "online" : (b.location || "online");
  
  let pool: string[] = [];
  if (b.isFreeConsultation) {
    // ✅ CORRETO: Per consulenze gratuite, usa SOLO slot promozionali dedicati
    pool = availability?.freeConsultationSlots ?? [];
    console.log("🔍 Consulenza gratuita - Slot promozionali disponibili:", pool.length, "slot");
    console.log("📅 Slot richiesto:", b.slot);
    
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
  
  console.log("✅ Slot validato correttamente:", b.slot);
  
  // Get package title for calendar event
  let packageTitle: string | undefined;
  
  // ✅ CORREZIONE: Gestisci le consulenze gratuite
  if (b.isFreeConsultation) {
    packageTitle = "Consultazione Gratuita (10 minuti)";
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

  console.log("💾 Salvando prenotazione nel database...");
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
    notes: b.notes ?? null, // ✅ AGGIUNTO: Salva note del cliente
    createdAt: serverTimestamp(),
  });
  
  console.log("✅ Prenotazione salvata con ID:", added.id);
  
  // Rimuovi lo slot occupato dalla disponibilità (blocca anche in pending)
  if (b.isFreeConsultation) {
    // ✅ CORRETTO: Per consulenze gratuite, rimuovi SOLO da slot promozionali
    const nextFreeSlots = (availability?.freeConsultationSlots ?? []).filter((slot) => slot !== b.slot);
    console.log("🗑️ Rimuovendo slot promozionale:", b.slot);
    console.log("📋 Slot promozionali rimanenti:", nextFreeSlots);
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
  
  // Create Google Calendar event
  try {
    if (b.status === "confirmed") {
      const calendarEventId = await ensureCalendarEvent(undefined, b, packageTitle);
      if (calendarEventId) {
        // Update booking with calendar event ID
        await updateDoc(doc(db as Firestore, "bookings", added.id), {
          googleCalendarEventId: calendarEventId
        });
        console.log("Google Calendar event created and linked to booking:", calendarEventId);
      }
    }
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    // Don't fail the booking creation if calendar fails
  }

  // Invia notifica email al nutrizionista per nuova prenotazione
  try {
    console.log("📧 Preparando invio email notifica...");
    const bookingWithId = { ...b, id: added.id };
    
    // Ottieni l'email di notifica, nome business e palette dalle impostazioni
    const siteContent = await getSiteContent();
    const notificationEmail = siteContent?.notificationEmail || "mirkoditroia@gmail.com";
    const businessName = siteContent?.businessName || "GZ Nutrition";
    const colorPalette = siteContent?.colorPalette || "gz-default";
    
    console.log("📬 Inviando email a:", notificationEmail, "per", packageTitle);
    await sendBookingNotification(bookingWithId, packageTitle, notificationEmail, businessName, colorPalette);
    console.log("✅ Email al dottore inviata con successo!");
    
    // Email al nutrizionista completata - sistema funzionante
    
  } catch (error) {
    console.error("❌ Errore invio email:", error);
    // Don't fail the booking creation if notification fails
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
  if (existingBooking.googleCalendarEventId) {
    try {
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
      if (success) {
        console.log(booking.status === "confirmed" ? "Google Calendar event updated:" : "Google Calendar event deleted (booking not confirmed):", existingBooking.googleCalendarEventId);
      } else {
        console.error("Failed to update Google Calendar event:", existingBooking.googleCalendarEventId);
      }
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      // Don't fail the booking update if calendar fails
    }
  } else {
    // If no event was linked yet (e.g., bookings created before calendar fix), create it now
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
        const newEventId = await ensureCalendarEvent(undefined, booking, packageTitle);
        if (newEventId) {
          await setDoc(doc(db as Firestore, "bookings", booking.id), { googleCalendarEventId: newEventId }, { merge: true });
          console.log("Google Calendar event created for existing booking:", newEventId);
        }
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
          const success = await deleteCalendarEvent(bookingData.googleCalendarEventId);
          if (success) {
            console.log("Google Calendar event deleted:", bookingData.googleCalendarEventId);
          } else {
            console.error("Failed to delete Google Calendar event:", bookingData.googleCalendarEventId);
          }
        } catch (error) {
          console.error("Error deleting Google Calendar event:", error);
          // Don't fail the booking deletion if calendar fails
        }
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
  
  // Se la prenotazione aveva uno slot confermato, ripristinalo nella disponibilità
  if (bookingData && bookingData.status === "confirmed" && bookingData.slot && bookingData.date) {
    try {
      const dateStr = bookingData.date.split('T')[0];
      const availDoc = col.availability(db as Firestore, dateStr);
      const availSnap = await getDoc(availDoc);
      if (availSnap.exists()) {
        const data = availSnap.data();
        const location: "online" | "studio" = bookingData.isFreeConsultation ? "online" : (bookingData.location || "online");
        if (location === "online") {
          const online = (data.onlineSlots || data.slots || []) as string[];
          if (!online.includes(bookingData.slot)) {
            const updated = [...online, bookingData.slot].sort();
            await setDoc(availDoc, { date: dateStr, onlineSlots: updated }, { merge: true });
          }
        } else {
          if (bookingData.studioLocation) {
            const studioMap = (data.studioSlots || {}) as Record<string, string[]>;
            const studio = studioMap[bookingData.studioLocation] || [];
            if (!studio.includes(bookingData.slot)) {
              studioMap[bookingData.studioLocation] = [...studio, bookingData.slot].sort();
              await setDoc(availDoc, { date: dateStr, studioSlots: studioMap }, { merge: true });
            }
          } else {
            const inStudio = (data.inStudioSlots || []) as string[];
            if (!inStudio.includes(bookingData.slot)) {
              const updated = [...inStudio, bookingData.slot].sort();
              await setDoc(availDoc, { date: dateStr, inStudioSlots: updated }, { merge: true });
            }
          }
        }
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
  console.log("getSiteContent: Inizio funzione");
  console.log("getSiteContent: Database configurato:", !!db);
  console.log("getSiteContent: Tipo database:", typeof db);
  
  if (!db) {
    console.log("getSiteContent: Database non configurato, return null");
    return null;
  }
  
  try {
    console.log("getSiteContent: Caricamento contenuto da Firebase...");
  const snap = await getDoc(col.content(db as Firestore));
    console.log("getSiteContent: Snap ricevuto:", snap);
    console.log("getSiteContent: Snap exists:", snap.exists());
    
    if (!snap.exists()) {
      console.log("getSiteContent: Nessun contenuto trovato in Firebase, creo contenuto di default");
      
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
          ctaText: "Prenota Ora - È Gratis!"
        },
        colorPalette: "gz-default" as const,
        notificationEmail: "mirkoditroia@gmail.com", // Default notification email
        businessName: "GZ Nutrition", // Default business name
        recaptchaEnabled: false, // CAPTCHA disabilitato di default per sviluppo
        recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI", // Default test key
        resultsSection: {
          isEnabled: false, // Disabilitata di default
          title: "🎯 Risultati dei Nostri Clienti",
          subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
          photos: []
        }
      };
      
      // Salva il contenuto di default in Firebase
      try {
        await upsertSiteContent(defaultContent);
        console.log("getSiteContent: Contenuto di default salvato in Firebase");
        return defaultContent;
      } catch (saveError) {
        console.error("getSiteContent: Errore nel salvare contenuto di default:", saveError);
        // Restituisci comunque il contenuto di default per permettere il funzionamento
        return defaultContent;
      }
    }
    
    const data = snap.data();
    console.log("getSiteContent: Contenuto caricato da Firebase:", data);
    console.log("getSiteContent: Contatti - phone:", data.contactPhone);
    console.log("getSiteContent: Contatti - email:", data.contactEmail);
    console.log("getSiteContent: Contatti - addresses:", data.contactAddresses);
    console.log("getSiteContent: Contatti - social:", data.socialChannels);
    console.log("getSiteContent: Popup - freeConsultationPopup:", data.freeConsultationPopup);
    console.log("getSiteContent: Popup - isEnabled:", data.freeConsultationPopup?.isEnabled);
    console.log("getSiteContent: Popup - title:", data.freeConsultationPopup?.title);
    
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
        ctaText: data.freeConsultationPopup?.ctaText || "Prenota Ora - È Gratis!"
      },
      googleCalendar: {
        isEnabled: data.googleCalendar?.isEnabled || false,
        calendarId: data.googleCalendar?.calendarId || "9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com",
        timezone: data.googleCalendar?.timezone || "Europe/Rome",
        serviceAccountEmail: data.googleCalendar?.serviceAccountEmail || "zambo-489@gznutrition-d5d13.iam.gserviceaccount.com"
      },
      colorPalette: (data.colorPalette as 'gz-default' | 'modern-blue' | 'elegant-dark' | 'nature-green' | 'warm-orange' | 'professional-gray') || 'gz-default',
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
        placeId: data.googleReviews.placeId || undefined,
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
    
    console.log("getSiteContent: Contenuto finale mappato:", siteContent);
    console.log("🔍 getSiteContent: BMI raw da DB:", data.bmiCalculator);
    console.log("🔍 getSiteContent: BMI mappato finale:", siteContent.bmiCalculator);
    console.log("🔍 getSiteContent: Reviews raw da DB:", data.googleReviews);
    console.log("🔍 getSiteContent: Reviews mappate finale:", siteContent.googleReviews);
    console.log("🔍 getSiteContent: LegalInfo raw da DB:", data.legalInfo);
    console.log("🔍 getSiteContent: LegalInfo mappato finale:", siteContent.legalInfo);
    return siteContent;
  } catch (error) {
    console.error("getSiteContent: Errore nel caricamento da Firebase:", error);
    return null;
  }
}

export async function upsertSiteContent(content: SiteContent): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  
  console.log("🔥 [Firebase] upsertSiteContent chiamato");
  console.log("🔥 [Firebase] Content originale:", content);
  console.log("🔥 [Firebase] BMI config:", content.bmiCalculator);
  console.log("🔥 [Firebase] Reviews config:", content.googleReviews);
  console.log("🔥 [Firebase] LegalInfo config:", content.legalInfo);
  
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
  
  console.log("🔥 [Firebase] Content sanitizzato:", sanitized);
  console.log("🔥 [Firebase] BMI sanitizzato:", sanitized.bmiCalculator);
  console.log("🔥 [Firebase] Reviews sanitizzato:", sanitized.googleReviews);
  console.log("🔥 [Firebase] LegalInfo sanitizzato:", sanitized.legalInfo);
  
  console.log("🔥 [Firebase] Chiamando setDoc...");
  await setDoc(col.content(db as Firestore), sanitized, { merge: true });
  console.log("🔥 [Firebase] ✅ setDoc completato con successo");
}

// Availability
export async function getAvailabilityByDate(date: string): Promise<Availability | null> {
  if (!db) return null;
  
  console.log("🔍 getAvailabilityByDate Firebase per data:", date);
  const snap = await getDoc(col.availability(db as Firestore, date));
  
  if (!snap.exists()) {
    console.log("❌ Nessun documento availability trovato per data:", date);
    return null;
  }
  
  const data = snap.data() as DocumentData;
  console.log("📊 Dati raw da Firebase per", date, ":", data);
  
  const result = { 
    date,
    onlineSlots: Array.isArray(data.onlineSlots) ? data.onlineSlots : (Array.isArray(data.slots) ? data.slots : []),
    inStudioSlots: Array.isArray(data.inStudioSlots) ? data.inStudioSlots : [],
    studioSlots: (data.studioSlots && typeof data.studioSlots === 'object') ? (data.studioSlots as Record<string, string[]>) : {},
    slots: Array.isArray(data.slots) ? data.slots : undefined,
    freeConsultationSlots: Array.isArray(data.freeConsultationSlots) ? data.freeConsultationSlots : []
  };
  
  console.log("✅ Availability processata:", result);
  console.log("🎯 freeConsultationSlots trovati:", result.freeConsultationSlots);
  
  return result;
}

export async function upsertAvailabilityForDate(
  date: string,
  onlineSlots: string[],
  freeConsultationSlots?: string[],
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
      ctaText: fromFs("freeConsultationPopup.ctaText") || "Prenota Ora - È Gratis!"
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


