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
  // Nuovi campi per sconti e personalizzazione
  hasDiscount?: boolean;
  basePrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  paymentText?: string;
  // Sezione dettagli completa
  details?: {
    duration?: string;
    sessions?: number;
    features?: string[];
    includes?: string[];
    requirements?: string[];
    notes?: string;
  };
  createdAt?: string;
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
  notes?: string; // Note del cliente (sezione "Parlami di te")
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


