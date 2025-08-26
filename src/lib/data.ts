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
import { db } from "@/lib/firebase";
import type { Firestore } from "firebase/firestore";

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
  paymentText?: string; // Testo personalizzabile sotto il prezzo (default: "pagabile mensilmente")
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
  channelPreference: "whatsapp" | "email";
  date: string;
  slot: string;
  packageId?: string;
  priority?: boolean;
  status: "pending" | "confirmed" | "cancelled";
  createdAt?: string;
  isFreeConsultation?: boolean; // Flag per i 10 minuti consultivi
  notes?: string; // Note del cliente (sezione "Parlami di te")
};

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  heroBackgroundImage: string;
  heroBadgeText?: string; // Testo del badge (default: "Performance • Estetica • Energia")
  heroBadgeColor?: string; // Colore del badge (default: "bg-primary text-primary-foreground")
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
  }>;
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
}

export type Availability = {
  date: string;
  slots: string[];
  freeConsultationSlots?: string[]; // Slot dedicati ai 10 minuti consultivi
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
      return { id: d.id, ...(data as Package) };
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
      paymentText: pkg.paymentText ?? "pagabile mensilmente",
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
      paymentText: pkg.paymentText ?? "pagabile mensilmente",
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

export async function createBooking(b: Booking): Promise<string> {
  if (!db) throw new Error("Firestore not configured");
  
  // Validazione: lo slot deve essere obbligatorio e disponibile
  if (!b.slot) {
    throw new Error("Lo slot orario è obbligatorio per la prenotazione");
  }
  
  // Controlla che lo slot sia effettivamente disponibile
  const availability = await getAvailabilityByDate(b.date);
  if (!availability || !availability.slots.includes(b.slot)) {
    throw new Error("L'orario selezionato non è più disponibile");
  }
  
  const added = await addDoc(col.bookings(db as Firestore), {
    clientId: b.clientId ?? null,
    name: b.name,
    email: b.email,
    phone: b.phone ?? null,
    packageId: b.packageId ?? null,
    date: b.date,
    slot: b.slot ?? null,
    status: b.status,
    priority: !!b.priority,
    channelPreference: b.channelPreference ?? null,
    createdAt: serverTimestamp(),
  });
  
  // Rimuovi lo slot occupato dalla disponibilità
  availability.slots = availability.slots.filter(slot => slot !== b.slot);
  await upsertAvailabilityForDate(b.date, availability.slots);
  
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
    if (!availability || !availability.slots.includes(booking.slot)) {
      throw new Error("Il nuovo orario selezionato non è più disponibile");
    }
  }
  
  // Se si sta cambiando la data, controlla che lo slot sia disponibile nella nuova data
  if (existingBooking.date !== booking.date && booking.slot) {
    const newDateAvailability = await getAvailabilityByDate(booking.date);
    if (!newDateAvailability || !newDateAvailability.slots.includes(booking.slot)) {
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
    status: booking.status,
    priority: !!booking.priority,
    channelPreference: booking.channelPreference ?? null,
  };
  await setDoc(doc(db as Firestore, "bookings", id), updateData, { merge: true });
  
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
        const currentSlots = availSnap.data().slots || [];
        // Controlla che lo slot sia ancora disponibile prima di rimuoverlo
        if (currentSlots.includes(booking.slot)) {
          const updatedSlots = currentSlots.filter((slot: string) => slot !== booking.slot);
          await setDoc(availDoc, { date: dateStr, slots: updatedSlots }, { merge: true });
        } else {
          console.warn(`Slot ${booking.slot} non più disponibile per la data ${dateStr}`);
        }
      }
      
      // Se si è cambiato lo slot, ripristina quello precedente
      if (existingBooking.slot && existingBooking.slot !== booking.slot) {
        const prevDateStr = existingBooking.date.split('T')[0];
        const prevAvailDoc = col.availability(db as Firestore, prevDateStr);
        const prevAvailSnap = await getDoc(prevAvailDoc);
        
        if (prevAvailSnap.exists()) {
          const prevSlots = prevAvailSnap.data().slots || [];
          if (!prevSlots.includes(existingBooking.slot)) {
            const updatedPrevSlots = [...prevSlots, existingBooking.slot];
            await setDoc(prevAvailDoc, { date: prevDateStr, slots: updatedPrevSlots }, { merge: true });
          }
        }
      }
      
      // Se si è cambiata la data, ripristina lo slot nella data precedente
      if (existingBooking.date !== booking.date && existingBooking.slot) {
        const prevDateStr = existingBooking.date.split('T')[0];
        const prevAvailDoc = col.availability(db as Firestore, prevDateStr);
        const prevAvailSnap = await getDoc(prevAvailDoc);
        
        if (prevAvailSnap.exists()) {
          const prevSlots = prevAvailSnap.data().slots || [];
          if (!prevSlots.includes(existingBooking.slot)) {
            const updatedPrevSlots = [...prevSlots, existingBooking.slot];
            await setDoc(prevAvailDoc, { date: prevDateStr, slots: updatedPrevSlots }, { merge: true });
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
        const currentSlots = availSnap.data().slots || [];
        if (!currentSlots.includes(bookingData.slot)) {
          const updatedSlots = [...currentSlots, bookingData.slot];
          await setDoc(availDoc, { date: dateStr, slots: updatedSlots }, { merge: true });
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
    await setDoc(doc(db as Firestore, "clients", id), data, { merge: true });
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
  if (!db) return null;
  
  try {
    console.log("getSiteContent: Caricamento contenuto da Firebase...");
    const snap = await getDoc(col.content(db as Firestore));
    if (!snap.exists()) {
      console.log("getSiteContent: Nessun contenuto trovato in Firebase");
      return null;
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
    
    return {
      heroTitle: data.heroTitle ?? "",
      heroSubtitle: data.heroSubtitle ?? "",
      heroCta: data.heroCta ?? "",
      heroBackgroundImage: data.heroBackgroundImage ?? "",
      heroBadgeText: data.heroBadgeText ?? "Performance • Estetica • Energia",
      heroBadgeColor: data.heroBadgeColor ?? "bg-primary text-primary-foreground",
      aboutTitle: data.aboutTitle ?? "",
      aboutBody: data.aboutBody ?? "",
      aboutImageUrl: data.aboutImageUrl ?? "",
      images: Array.isArray(data.images) ? data.images : [],
      contactTitle: data.contactTitle ?? "",
      contactSubtitle: data.contactSubtitle ?? "",
      contactPhone: data.contactPhone ?? "",
      contactEmail: data.contactEmail ?? "",
      contactAddresses: Array.isArray(data.contactAddresses) ? data.contactAddresses : [],
      socialChannels: Array.isArray(data.socialChannels) ? data.socialChannels : [],
      contactSectionTitle: data.contactSectionTitle ?? "💬 Contatti Diretti",
      contactSectionSubtitle: data.contactSectionSubtitle ?? "",
      studiosSectionTitle: data.studiosSectionTitle ?? "🏢 I Nostri Studi",
      studiosSectionSubtitle: data.studiosSectionSubtitle ?? "",
      freeConsultationPopup: {
        isEnabled: data.freeConsultationPopup?.isEnabled === true,
        title: data.freeConsultationPopup?.title ?? "🎯 10 Minuti Consultivi Gratuiti",
        subtitle: data.freeConsultationPopup?.subtitle ?? "Valuta i tuoi obiettivi gratuitamente",
        description: data.freeConsultationPopup?.description ?? "Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance.",
        ctaText: data.freeConsultationPopup?.ctaText ?? "Prenota Ora - È Gratis!"
      },
    };
  } catch (error) {
    console.error("getSiteContent: Errore nel caricamento da Firebase:", error);
    return null;
  }
}

export async function upsertSiteContent(content: SiteContent): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  await setDoc(col.content(db as Firestore), content, { merge: true });
}

// Availability
export async function getAvailabilityByDate(date: string): Promise<Availability | null> {
  if (!db) return null;
  const snap = await getDoc(col.availability(db as Firestore, date));
  if (!snap.exists()) return null;
  const data = snap.data() as DocumentData;
  return { 
    date, 
    slots: Array.isArray(data.slots) ? data.slots : [],
    freeConsultationSlots: Array.isArray(data.freeConsultationSlots) ? data.freeConsultationSlots : []
  };
}

export async function upsertAvailabilityForDate(date: string, slots: string[], freeConsultationSlots?: string[]): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  await setDoc(col.availability(db as Firestore, date), { date, slots, freeConsultationSlots }, { merge: true });
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
    status: data.status,
    priority: !!data.priority,
    channelPreference: data.channelPreference ?? undefined,
    createdAt: tsToIso(data.createdAt),
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
  const snap = await getDoc(doc(db as Firestore, "clients", id));
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


