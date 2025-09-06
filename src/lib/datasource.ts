import {
  type Package,
  type Booking,
  type ClientCard,
  type SiteContent,
  type Availability,
  getPackages as fb_getPackages,
  upsertPackage as fb_upsertPackage,
  listBookings as fb_listBookings,
  createBooking as fb_createBooking,
  updateBooking as fb_updateBooking,
  deleteBooking as fb_deleteBooking,
  upsertClient as fb_upsertClient,
  getClientByEmail as fb_getClientByEmail,
  listClients as fb_listClients,
  getClientById as fb_getClientById,
  deleteClient as fb_deleteClient,
  createClientFromPendingBooking as fb_createClientFromPendingBooking,
  getSiteContent as fb_getSiteContent,
  upsertSiteContent as fb_upsertSiteContent,
  getAvailabilityByDate as fb_getAvailabilityByDate,
  upsertAvailabilityForDate as fb_upsertAvailabilityForDate,
} from "@/lib/data";
import { getDataMode } from "@/lib/datamode";
export type { Package, Booking, ClientCard, SiteContent, Availability } from "@/lib/data";

// Helper function per inviare notifiche email in modalità local
async function sendLocalBookingNotification(booking: Booking): Promise<void> {
  try {
    // Ottieni l'email di notifica, nome business e palette dalle impostazioni
    const siteContent = await getSiteContent();
    const notificationEmail = siteContent?.notificationEmail || "mirkoditroia@gmail.com";
    const businessName = siteContent?.businessName || "GZ Nutrition";
    const colorPalette = siteContent?.colorPalette || "gz-default";
    
    // Get package title for calendar event
    let packageTitle: string | undefined;
    if (booking.packageId) {
      try {
        const packages = await getPackages();
        const pkg = packages.find(p => p.id === booking.packageId);
        if (pkg) {
          packageTitle = pkg.title;
        }
      } catch (error) {
        console.error("Error getting package title for calendar event:", error);
      }
    }
    
    // Set title for free consultation
    if (booking.isFreeConsultation) {
      packageTitle = "Consultazione Gratuita (10 minuti)";
    }
    
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
        notificationEmail,
        businessName,
        colorPalette
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Booking notification sent successfully:', result.sentTo);
      if (booking.isFreeConsultation) {
        console.log('📧 Email sent for free consultation booking');
      }
    } else {
      console.error('❌ Failed to send booking notification:', result.message);
    }
  } catch (error) {
    console.error("❌ Error sending booking notification:", error);
    // Don't fail the booking creation if notification fails
  }
}

// Local storage helpers
const isBrowser = typeof window !== "undefined";
const mem: Record<string, unknown> = {};
function readLS<T>(key: string, fallback: T): T {
  if (!isBrowser) return (mem[key] as T) ?? fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T) {
  if (!isBrowser) {
    mem[key] = value;
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

// Demo data helpers (from /public/demo)
async function fetchDemo<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// Public API (mode-aware)
export async function getPackages(): Promise<Package[]> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_getPackages();
  if (mode === "demo") return fetchDemo<Package[]>("/demo/packages.json", []);
  // local file JSON persisted via API
  try {
    const res = await fetch("/api/localdb/packages", { cache: "no-store" });
    if (res.ok) return (await res.json()) as Package[];
  } catch {}
  return [];
}

export async function upsertPackage(pkg: Package): Promise<string> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_upsertPackage(pkg);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  const id = pkg.id ?? cryptoRandomId();
  const current = await getPackages();
  const next = [{ ...pkg, id }, ...current.filter((p) => p.id !== id)];
  await fetch("/api/localdb/packages", { method: "POST", body: JSON.stringify(next) });
  return id;
}

export async function deletePackage(packageId: string): Promise<void> {
  const mode = getDataMode();
  if (mode === "firebase") {
    // Usa la nuova funzione deletePackage implementata in data.ts
    const { deletePackage: fb_deletePackage } = await import("./data");
    return fb_deletePackage(packageId);
  }
  if (mode === "demo") throw new Error("Preprod demo read-only");
  
  // Per local mode, rimuovi il pacchetto dalla lista
  const current = await getPackages();
  const next = current.filter((p) => p.id !== packageId);
  await fetch("/api/localdb/packages", { method: "POST", body: JSON.stringify(next) });
}

export async function listBookings(): Promise<Booking[]> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_listBookings();
  if (mode === "demo") return fetchDemo<Booking[]>("/demo/bookings.json", []);
  try {
    const res = await fetch("/api/localdb/bookings", { cache: "no-store" });
    if (res.ok) return (await res.json()) as Booking[];
  } catch {}
  return [];
}

export async function createBooking(b: Booking, captchaToken?: string): Promise<string> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_createBooking(b, captchaToken);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  
  // Validazione: lo slot deve essere obbligatorio e disponibile
  if (!b.slot) {
    throw new Error("Lo slot orario è obbligatorio per la prenotazione");
  }
  
  // Controlla che lo slot sia effettivamente disponibile
  const availability = await getAvailabilityByDate(b.date);
  const location: "online" | "studio" = b.isFreeConsultation ? "online" : (b.location || "online");
  const pool = location === "online"
    ? (availability?.onlineSlots ?? availability?.slots ?? [])
    : (b.studioLocation ? (availability?.studioSlots?.[b.studioLocation] ?? []) : (availability?.inStudioSlots ?? []));
  if (!availability || !pool.includes(b.slot)) {
    throw new Error("L'orario selezionato non è più disponibile");
  }
  
  const id = cryptoRandomId();
  const createdAt = new Date().toISOString();
  try {
    const res = await fetch("/api/localdb/bookings", { cache: "no-store" });
    const current = res.ok ? ((await res.json()) as Booking[]) : [];
    const next = [{ ...b, id, createdAt }, ...current];
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify(next) });
    
    // Rimuovi lo slot occupato dalla disponibilità
    if (location === "online") {
      const next = (availability.onlineSlots ?? availability.slots ?? []).filter((slot) => slot !== b.slot);
      await upsertAvailabilityForDate(b.date, next, availability.freeConsultationSlots, availability.inStudioSlots ?? [], availability.studioSlots ?? {});
    } else {
      if (b.studioLocation) {
        const studioMap = { ...(availability.studioSlots ?? {}) };
        studioMap[b.studioLocation] = (studioMap[b.studioLocation] ?? []).filter((slot) => slot !== b.slot);
        await upsertAvailabilityForDate(
          b.date,
          availability.onlineSlots ?? availability.slots ?? [],
          availability.freeConsultationSlots,
          availability.inStudioSlots ?? [],
          studioMap
        );
      } else {
        const nextStudio = (availability.inStudioSlots ?? []).filter((slot) => slot !== b.slot);
        await upsertAvailabilityForDate(b.date, availability.onlineSlots ?? availability.slots ?? [], availability.freeConsultationSlots, nextStudio, availability.studioSlots ?? {});
      }
    }
    
    // ✅ AGGIUNTO: Invio email di notifica anche in modalità local
    const bookingWithId = { ...b, id, createdAt };
    await sendLocalBookingNotification(bookingWithId);
    
    return id;
  } catch {
    // fallback write new list
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify([{ ...b, id, createdAt }]) });
    
    // ✅ RIMOSSO fallback localdb - causava problemi di sincronizzazione
    // In modalità Firebase, la disponibilità è già gestita correttamente dalla funzione principale
    
    // ✅ AGGIUNTO: Invio email di notifica anche nel fallback
    const bookingWithId = { ...b, id, createdAt };
    await sendLocalBookingNotification(bookingWithId);
    
    return id;
  }
}

export async function updateBooking(booking: Booking): Promise<void> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_updateBooking(booking);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  
  try {
    const res = await fetch("/api/localdb/bookings", { cache: "no-store" });
    const current = res.ok ? ((await res.json()) as Booking[]) : [];
    
    // Trova la prenotazione esistente per confrontare i cambiamenti
    const existingBooking = current.find(item => item.id === booking.id);
    
    // Se si sta cambiando lo slot, controlla che sia disponibile
    if (existingBooking && existingBooking.slot !== booking.slot && booking.slot) {
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
    if (existingBooking && existingBooking.date !== booking.date && booking.slot) {
      const newDateAvailability = await getAvailabilityByDate(booking.date);
      const location: "online" | "studio" = booking.isFreeConsultation ? "online" : (booking.location || "online");
      const pool = location === "online"
        ? (newDateAvailability?.onlineSlots ?? newDateAvailability?.slots ?? [])
        : (newDateAvailability?.inStudioSlots ?? []);
      if (!newDateAvailability || !pool.includes(booking.slot)) {
        throw new Error("L'orario selezionato non è disponibile per la nuova data");
      }
    }
    
    const updatedItems = current.map(item => 
      item.id === booking.id ? booking : item
    );
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify(updatedItems) });
    
    // ✅ RIMOSSA gestione localdb/availability - causava problemi di sincronizzazione
    // In modalità Firebase, la disponibilità è gestita automaticamente da Firebase
    // In modalità local, la gestione locale funziona tramite altri meccanismi
    console.log("📋 Prenotazione aggiornata:", booking.id, "- gestione disponibilità delegata al sistema principale");
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_deleteBooking(bookingId);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  
  try {
    const res = await fetch("/api/localdb/bookings", { cache: "no-store" });
    const current = res.ok ? ((await res.json()) as Booking[]) : [];
    
    // Trova la prenotazione da eliminare per ripristinare lo slot
    const bookingToDelete = current.find(item => item.id === bookingId);
    
    const filteredItems = current.filter(item => item.id !== bookingId);
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify(filteredItems) });
    
    // ✅ RIMOSSA logica ripristino availability locale - causava problemi di sincronizzazione
    // Firebase gestisce automaticamente la disponibilità quando una prenotazione viene cancellata
    console.log("📋 Prenotazione cancellata:", bookingToDelete?.id, "- availability gestita dal sistema principale");
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
}

export async function upsertClient(c: ClientCard): Promise<string> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_upsertClient(c);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  const items = readLS<ClientCard[]>("gzn:clients", []);
  const id = c.id ?? cryptoRandomId();
  const next = [{ ...c, id }, ...items.filter((x) => x.id !== id)];
  writeLS("gzn:clients", next);
  return id;
}

export async function getClientByEmail(email: string): Promise<ClientCard | null> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_getClientByEmail(email);
  if (mode === "demo") {
    const clients = await fetchDemo<ClientCard[]>("/demo/clients.json", []);
    return clients.find((c) => c.email === email) ?? null;
  }
  try {
    const res = await fetch("/api/localdb/clients", { cache: "no-store" });
    const items = res.ok ? ((await res.json()) as ClientCard[]) : [];
    return items.find((x) => x.email === email) ?? null;
  } catch { return null; }
}

export async function listClients(): Promise<ClientCard[]> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_listClients();
  if (mode === "demo") return fetchDemo<ClientCard[]>("/demo/clients.json", []);
  try {
    const res = await fetch("/api/localdb/clients", { cache: "no-store" });
    if (res.ok) return (await res.json()) as ClientCard[];
  } catch {}
  return [];
}

export async function getClientById(id: string): Promise<ClientCard | null> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_getClientById(id);
  if (mode === "demo") {
    const clients = await fetchDemo<ClientCard[]>("/demo/clients.json", []);
    return clients.find((c) => c.id === id) ?? null;
  }
  try {
    const res = await fetch("/api/localdb/clients", { cache: "no-store" });
    const items = res.ok ? ((await res.json()) as ClientCard[]) : [];
    return items.find((x) => x.id === id) ?? null;
  } catch { return null; }
}

export async function deleteClient(id: string): Promise<void> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_deleteClient(id);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  
  try {
    const res = await fetch("/api/localdb/clients", { cache: "no-store" });
    const current = res.ok ? ((await res.json()) as ClientCard[]) : [];
    const filteredItems = current.filter(item => item.id !== id);
    await fetch("/api/localdb/clients", { method: "POST", body: JSON.stringify(filteredItems) });
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
}

export async function createClientFromPendingBooking(booking: Booking): Promise<string> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_createClientFromPendingBooking(booking);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  
  try {
    const res = await fetch("/api/localdb/clients", { cache: "no-store" });
    const current = res.ok ? ((await res.json()) as ClientCard[]) : [];
    
    // Check if client already exists
    const existingClient = current.find(c => c.email === booking.email);
    
    if (existingClient) {
      // Update existing client
      const updatedClient = {
        ...existingClient,
        name: booking.name,
        phone: booking.phone || existingClient.phone,
        assignedPackage: booking.packageId || existingClient.assignedPackage,
        status: "prospect",
        source: existingClient.source || "website"
      };
      
      const updatedList = current.map(c => c.id === existingClient.id ? updatedClient : c);
      await fetch("/api/localdb/clients", { method: "POST", body: JSON.stringify(updatedList) });
      return existingClient.id!;
    } else {
      // Create new client
      const newClient: ClientCard = {
        id: crypto.randomUUID(),
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
      
      const updatedList = [newClient, ...current];
      await fetch("/api/localdb/clients", { method: "POST", body: JSON.stringify(updatedList) });
      return newClient.id!;
    }
  } catch (error) {
    console.error("Error creating client from pending booking:", error);
    throw error;
  }
}

export async function getSiteContent(): Promise<SiteContent | null> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_getSiteContent();
  if (mode === "demo") return fetchDemo<SiteContent>("/demo/siteContent.json", { 
    heroTitle: "", 
    heroSubtitle: "", 
    heroCta: "Prenota ora", 
    heroBackgroundImage: "", 
    heroBadgeText: "Performance • Estetica • Energia",
    heroBadgeColor: "bg-primary text-primary-foreground",
    images: [],
    contactTitle: "",
    contactSubtitle: "",
    contactPhone: "",
    contactEmail: "",
    contactAddresses: [],
    socialChannels: [],
    contactSectionTitle: "💬 Contatti Diretti",
    contactSectionSubtitle: "",
    studiosSectionTitle: "🏢 I Nostri Studi",
    studiosSectionSubtitle: "",
    colorPalette: "gz-default" as const,
    googleCalendar: {
      isEnabled: false,
      calendarId: "9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com",
      timezone: "Europe/Rome",
      serviceAccountEmail: "zambo-489@gznutrition-d5d13.iam.gserviceaccount.com"
    }
  });
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/localdb/siteContent", { cache: "no-store" });
    if (res.ok) return (await res.json()) as SiteContent;
  } catch {}
  return { 
    heroTitle: "", 
    heroSubtitle: "", 
    heroCta: "Prenota ora", 
    heroBackgroundImage: "", 
    heroBadgeText: "Performance • Estetica • Energia",
    heroBadgeColor: "bg-primary text-primary-foreground",
    aboutTitle: "", 
    aboutBody: "", 
    aboutImageUrl: "", 
    images: [],
    contactTitle: "",
    contactSubtitle: "",
    contactPhone: "",
    contactEmail: "",
    contactAddresses: [],
    socialChannels: [],
    contactSectionTitle: "💬 Contatti Diretti",
    contactSectionSubtitle: "",
    studiosSectionTitle: "🏢 I Nostri Studi",
    studiosSectionSubtitle: "",
    colorPalette: "gz-default" as const,
    googleCalendar: {
      isEnabled: false,
      calendarId: "9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com",
      timezone: "Europe/Rome",
      serviceAccountEmail: "zambo-489@gznutrition-d5d13.iam.gserviceaccount.com"
    }
  };
}

export async function upsertSiteContent(content: SiteContent): Promise<void> {
  const mode = getDataMode();
  console.log("[upsertSiteContent] Current mode:", mode);
  
  if (mode === "firebase") {
    console.log("[upsertSiteContent] Using Firebase");
    return fb_upsertSiteContent(content);
  }
  
  if (mode === "demo") {
    console.log("[upsertSiteContent] Demo mode - throwing read-only error");
    throw new Error("Preprod demo read-only");
  }
  
  console.log("[upsertSiteContent] Using local API");
  await fetch("/api/localdb/siteContent", { method: "POST", body: JSON.stringify(content) });
}

export async function getAvailabilityByDate(date: string): Promise<Availability | null> {
  const mode = getDataMode();
  console.log("🌐 [SITO PUBBLICO] getAvailabilityByDate chiamata per:", date, "modalità:", mode);
  
  if (mode === "firebase") {
    const result = await fb_getAvailabilityByDate(date);
    console.log("🔥 [SITO PUBBLICO] Risultato da Firebase:", result);
    return result;
  }
  
  if (mode === "demo") return fetchDemo<Availability>(`/demo/availability/${date}.json`, { date, slots: [] });
  
  try {
    const res = await fetch("/api/localdb/availability", { cache: "no-store" });
    const all = res.ok ? ((await res.json()) as Record<string, { slots?: string[]; freeConsultationSlots?: string[]; onlineSlots?: string[]; inStudioSlots?: string[]; studioSlots?: Record<string, string[]> }>) : {};
    const dateData = all[date];
    console.log("💾 [SITO PUBBLICO] Dati locali per", date, ":", dateData);
    
    if (dateData) {
      const result = { 
        date, 
        onlineSlots: dateData.onlineSlots ?? dateData.slots ?? [],
        inStudioSlots: dateData.inStudioSlots ?? [],
        studioSlots: dateData.studioSlots ?? {},
        slots: dateData.slots, 
        freeConsultationSlots: dateData.freeConsultationSlots ?? [] 
      };
      console.log("✅ [SITO PUBBLICO] Risultato locale processato:", result);
      return result;
    }
    console.log("❌ [SITO PUBBLICO] Nessun dato trovato per:", date);
    return { date, onlineSlots: [], inStudioSlots: [], freeConsultationSlots: [] } as Availability;
  } catch (error) { 
    console.error("❌ [SITO PUBBLICO] Errore caricamento dati:", error);
    return { date, onlineSlots: [], inStudioSlots: [], freeConsultationSlots: [] } as Availability; 
  }
}

export async function upsertAvailabilityForDate(date: string, onlineSlots: string[], freeConsultationSlots?: string[], inStudioSlots?: string[], studioSlots?: Record<string, string[]>): Promise<void> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_upsertAvailabilityForDate(date, onlineSlots, freeConsultationSlots, inStudioSlots, studioSlots);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  try {
    const res = await fetch("/api/localdb/availability", { cache: "no-store" });
    const all = res.ok ? ((await res.json()) as Record<string, { slots?: string[]; freeConsultationSlots?: string[]; onlineSlots?: string[]; inStudioSlots?: string[]; studioSlots?: Record<string, string[]> }>) : {};
    all[date] = { onlineSlots, inStudioSlots: inStudioSlots || [], freeConsultationSlots: freeConsultationSlots || [], studioSlots: studioSlots ?? all[date]?.studioSlots ?? {} };
    await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(all) });
  } catch {}
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as { randomUUID: () => string }).randomUUID();
  return Math.random().toString(36).slice(2);
}




