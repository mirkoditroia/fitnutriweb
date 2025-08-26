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

export async function createBooking(b: Booking): Promise<string> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_createBooking(b);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  
  // Validazione: lo slot deve essere obbligatorio e disponibile
  if (!b.slot) {
    throw new Error("Lo slot orario è obbligatorio per la prenotazione");
  }
  
  // Controlla che lo slot sia effettivamente disponibile
  const availability = await getAvailabilityByDate(b.date);
  if (!availability || !availability.slots.includes(b.slot)) {
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
    availability.slots = availability.slots.filter(slot => slot !== b.slot);
    await upsertAvailabilityForDate(b.date, availability.slots);
    
    return id;
  } catch {
    // fallback write new list
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify([{ ...b, id, createdAt }]) });
    
    // Rimuovi lo slot occupato dalla disponibilità anche nel fallback
    try {
      const availRes = await fetch("/api/localdb/availability", { cache: "no-store" });
      const allAvailability = availRes.ok ? ((await availRes.json()) as Record<string, string[]>) : {};
      if (allAvailability[b.date]) {
        allAvailability[b.date] = allAvailability[b.date].filter(slot => slot !== b.slot);
        await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(allAvailability) });
      }
    } catch (error) {
      console.error("Error updating availability in fallback:", error);
    }
    
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
      if (!availability || !availability.slots.includes(booking.slot)) {
        throw new Error("Il nuovo orario selezionato non è più disponibile");
      }
    }
    
    // Se si sta cambiando la data, controlla che lo slot sia disponibile nella nuova data
    if (existingBooking && existingBooking.date !== booking.date && booking.slot) {
      const newDateAvailability = await getAvailabilityByDate(booking.date);
      if (!newDateAvailability || !newDateAvailability.slots.includes(booking.slot)) {
        throw new Error("L'orario selezionato non è disponibile per la nuova data");
      }
    }
    
    const updatedItems = current.map(item => 
      item.id === booking.id ? booking : item
    );
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify(updatedItems) });
    
    // If booking is confirmed and has a slot, remove that slot from availability
    if (booking.status === "confirmed" && booking.slot && booking.date) {
      try {
        const dateStr = booking.date.split('T')[0]; // Extract YYYY-MM-DD from date
        const availRes = await fetch("/api/localdb/availability", { cache: "no-store" });
        const availability = availRes.ok ? ((await availRes.json()) as Record<string, string[]>) : {};
        
        if (availability[dateStr]) {
          // Controlla che lo slot sia ancora disponibile prima di rimuoverlo
          if (availability[dateStr].includes(booking.slot)) {
            availability[dateStr] = availability[dateStr].filter(slot => slot !== booking.slot);
            await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(availability) });
          } else {
            console.warn(`Slot ${booking.slot} non più disponibile per la data ${dateStr}`);
          }
        }
        
        // Se si è cambiato lo slot, ripristina quello precedente
        if (existingBooking && existingBooking.slot && existingBooking.slot !== booking.slot) {
          const prevDateStr = existingBooking.date.split('T')[0];
          if (availability[prevDateStr] && !availability[prevDateStr].includes(existingBooking.slot)) {
            availability[prevDateStr] = [...availability[prevDateStr], existingBooking.slot];
            await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(availability) });
          }
        }
        
        // Se si è cambiata la data, ripristina lo slot nella data precedente
        if (existingBooking && existingBooking.date !== booking.date && existingBooking.slot) {
          const prevDateStr = existingBooking.date.split('T')[0];
          if (availability[prevDateStr] && !availability[prevDateStr].includes(existingBooking.slot)) {
            availability[prevDateStr] = [...availability[prevDateStr], existingBooking.slot];
            await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(availability) });
          }
        }
      } catch (error) {
        console.error("Error updating availability:", error);
        // Don't throw here as the main booking update was successful
      }
    }
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
    
    // Se la prenotazione aveva uno slot confermato, ripristinalo nella disponibilità
    if (bookingToDelete && bookingToDelete.status === "confirmed" && bookingToDelete.slot && bookingToDelete.date) {
      try {
        const dateStr = bookingToDelete.date.split('T')[0];
        const availRes = await fetch("/api/localdb/availability", { cache: "no-store" });
        const availability = availRes.ok ? ((await availRes.json()) as Record<string, string[]>) : {};
        
        if (availability[dateStr] && !availability[dateStr].includes(bookingToDelete.slot)) {
          availability[dateStr] = [...availability[dateStr], bookingToDelete.slot];
          await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(availability) });
        }
      } catch (error) {
        console.error("Error restoring availability after booking deletion:", error);
        // Don't throw here as the main booking deletion was successful
      }
    }
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
  if (mode === "firebase") return fb_getAvailabilityByDate(date);
  if (mode === "demo") return fetchDemo<Availability>(`/demo/availability/${date}.json`, { date, slots: [] });
  try {
    const res = await fetch("/api/localdb/availability", { cache: "no-store" });
    const all = res.ok ? ((await res.json()) as Record<string, { slots: string[]; freeConsultationSlots?: string[] }>) : {};
    const dateData = all[date];
    if (dateData) {
      return { 
        date, 
        slots: dateData.slots || [], 
        freeConsultationSlots: dateData.freeConsultationSlots || [] 
      };
    }
    return { date, slots: [], freeConsultationSlots: [] };
  } catch { return { date, slots: [], freeConsultationSlots: [] }; }
}

export async function upsertAvailabilityForDate(date: string, slots: string[], freeConsultationSlots?: string[]): Promise<void> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_upsertAvailabilityForDate(date, slots);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  try {
    const res = await fetch("/api/localdb/availability", { cache: "no-store" });
    const all = res.ok ? ((await res.json()) as Record<string, { slots: string[]; freeConsultationSlots?: string[] }>) : {};
    all[date] = { slots, freeConsultationSlots: freeConsultationSlots || [] };
    await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(all) });
  } catch {}
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as { randomUUID: () => string }).randomUUID();
  return Math.random().toString(36).slice(2);
}




