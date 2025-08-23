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
  const id = cryptoRandomId();
  const createdAt = new Date().toISOString();
  try {
    const res = await fetch("/api/localdb/bookings", { cache: "no-store" });
    const current = res.ok ? ((await res.json()) as Booking[]) : [];
    const next = [{ ...b, id, createdAt }, ...current];
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify(next) });
    return id;
  } catch {
    // fallback write new list
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify([{ ...b, id, createdAt }]) });
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
          availability[dateStr] = availability[dateStr].filter(slot => slot !== booking.slot);
          await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(availability) });
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
    const filteredItems = current.filter(item => item.id !== bookingId);
    await fetch("/api/localdb/bookings", { method: "POST", body: JSON.stringify(filteredItems) });
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

export async function getSiteContent(): Promise<SiteContent | null> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_getSiteContent();
  if (mode === "demo") return fetchDemo<SiteContent>("/demo/siteContent.json", { heroTitle: "", heroSubtitle: "", heroCta: "Prenota ora", images: [] });
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/localdb/siteContent", { cache: "no-store" });
    if (res.ok) return (await res.json()) as SiteContent;
  } catch {}
  return { heroTitle: "", heroSubtitle: "", heroCta: "Prenota ora", aboutTitle: "", aboutBody: "", aboutImageUrl: "", images: [] };
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
    const all = res.ok ? ((await res.json()) as Record<string, string[]>) : {};
    return { date, slots: all[date] ?? [] };
  } catch { return { date, slots: [] }; }
}

export async function upsertAvailabilityForDate(date: string, slots: string[]): Promise<void> {
  const mode = getDataMode();
  if (mode === "firebase") return fb_upsertAvailabilityForDate(date, slots);
  if (mode === "demo") throw new Error("Preprod demo read-only");
  try {
    const res = await fetch("/api/localdb/availability", { cache: "no-store" });
    const all = res.ok ? ((await res.json()) as Record<string, string[]>) : {};
    all[date] = slots;
    await fetch("/api/localdb/availability", { method: "POST", body: JSON.stringify(all) });
  } catch {}
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as { randomUUID: () => string }).randomUUID();
  return Math.random().toString(36).slice(2);
}


