import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const col = {
  packages: () => collection(db, "packages"),
  availability: () => collection(db, "availability"),
  bookings: () => collection(db, "bookings"),
  clients: () => collection(db, "clients"),
  content: () => collection(db, "content"),
  logs: () => collection(db, "logs"),
};

export const docRef = {
  landingContent: () => doc(db, "content/landing"),
};


