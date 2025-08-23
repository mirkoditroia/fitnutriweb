// Firestore data models

export type Package = {
  id: string;
  title: string;
  description: string;
  priceEuro: number;
  imageUrl?: string;
  featured?: boolean;
  badge?: string;
  active: boolean;
};

export type AvailabilitySlot = {
  id: string;
  startIso: string; // ISO date string
  endIso: string; // ISO date string
  capacity: number; // seats
  bookedCount: number;
};

export type Booking = {
  id: string;
  createdAt: string;
  status: "pending" | "confirmed" | "cancelled";
  slotId: string;
  packageId: string;
  clientId: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
};

export type LandingContent = {
  id: "landing";
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  sectionImages: { key: string; url: string; alt: string }[];
  faqs: { q: string; a: string }[];
};


