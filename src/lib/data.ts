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
};

export type ClientCard = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt?: string;
};

export type Booking = {
  id?: string;
  clientId?: string;
  name: string;
  email: string;
  phone?: string;
  packageId?: string;
  date: string; // ISO
  slot?: string;
  status: "pending" | "confirmed" | "cancelled";
  priority?: boolean;
  channelPreference?: "whatsapp" | "email";
  createdAt?: string;
};

export type SiteContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  aboutTitle?: string;
  aboutBody?: string;
  aboutImageUrl?: string;
  images?: { key: string; url: string }[];
  faq?: { q: string; a: string }[];
};

export type Availability = {
  date: string; // YYYY-MM-DD
  slots: string[];
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
  if (!db) return [];
  const database = db as Firestore;
  const snap = await getDocs(query(col.packages(database), orderBy("title")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Package) }));
}

export async function upsertPackage(pkg: Package): Promise<string> {
  if (pkg.id) {
    const { id, ...data } = pkg;
    await setDoc(doc(db as Firestore, "packages", id), data, { merge: true });
    return id;
  }
  const added = await addDoc(col.packages(db as Firestore), {
    title: pkg.title,
    description: pkg.description,
    price: pkg.price,
    imageUrl: pkg.imageUrl ?? null,
    isActive: pkg.isActive,
    featured: pkg.featured ?? false,
    badge: pkg.badge ?? null,
    createdAt: serverTimestamp(),
  });
  return added.id;
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
  return added.id;
}

export async function updateBooking(booking: Booking): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  if (!booking.id) throw new Error("Booking ID is required for update");
  
  const { id, ...updateData } = booking;
  await setDoc(doc(db as Firestore, "bookings", id), updateData, { merge: true });
  
  // If booking is confirmed and has a slot, remove that slot from availability
  if (booking.status === "confirmed" && booking.slot && booking.date) {
    try {
      const dateStr = booking.date.split('T')[0]; // Extract YYYY-MM-DD from date
      const availDoc = col.availability(db as Firestore, dateStr);
      const availSnap = await getDoc(availDoc);
      
      if (availSnap.exists()) {
        const currentSlots = availSnap.data().slots || [];
        const updatedSlots = currentSlots.filter((slot: string) => slot !== booking.slot);
        await setDoc(availDoc, { date: dateStr, slots: updatedSlots }, { merge: true });
      }
    } catch (error) {
      console.error("Error updating availability in Firebase:", error);
      // Don't throw here as the main booking update was successful
    }
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  await deleteDoc(doc(db as Firestore, "bookings", bookingId));
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
  const snap = await getDoc(col.content(db as Firestore));
  if (!snap.exists()) return null;
  const data = snap.data() as DocumentData;
  return {
    heroTitle: data.heroTitle ?? "",
    heroSubtitle: data.heroSubtitle ?? "",
    heroCta: data.heroCta ?? "",
    aboutTitle: data.aboutTitle ?? "",
    aboutBody: data.aboutBody ?? "",
    aboutImageUrl: data.aboutImageUrl ?? "",
    images: Array.isArray(data.images) ? data.images : [],
    faq: Array.isArray(data.faq) ? data.faq : [],
  };
}

export async function upsertSiteContent(content: SiteContent): Promise<void> {
  await setDoc(col.content(db as Firestore), content, { merge: true });
}

// Availability
export async function getAvailabilityByDate(date: string): Promise<Availability | null> {
  if (!db) return null;
  const snap = await getDoc(col.availability(db as Firestore, date));
  if (!snap.exists()) return null;
  const data = snap.data() as DocumentData;
  return { date, slots: Array.isArray(data.slots) ? data.slots : [] };
}

export async function upsertAvailabilityForDate(date: string, slots: string[]): Promise<void> {
  if (!db) throw new Error("Firestore not configured");
  await setDoc(col.availability(db as Firestore, date), { date, slots }, { merge: true });
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
  const faq = arr(f.faq as FirestoreArrayValue, (v) => ({ q: v.mapValue.fields.q.stringValue!, a: v.mapValue.fields.a.stringValue! }));
  return {
    heroTitle: fromFs("heroTitle"),
    heroSubtitle: fromFs("heroSubtitle"),
    heroCta: fromFs("heroCta"),
    images,
    faq,
  };
}

export const defaultFaq: { q: string; a: string }[] = [
  { q: "Quanto tempo serve per vedere risultati?", a: "Generalmente 4–6 settimane per cambi visibili, dipende dall’aderenza." },
  { q: "Serve palestra?", a: "Consigliata ma non obbligatoria. Programmi adattabili anche a casa." },
  { q: "I piani sono personalizzati?", a: "Sì: obiettivi, preferenze alimentari e disponibilità oraria." },
  { q: "Come avviene il follow-up?", a: "Check-in settimanali e chat per aggiustamenti in tempo reale." },
  { q: "Posso sospendere?", a: "Puoi mettere in pausa e riprendere senza costi aggiuntivi." },
];


