import { collection, doc, type Firestore } from "firebase/firestore";

export const col = {
  packages: (database: Firestore) => collection(database, "packages"),
  availability: (database: Firestore) => collection(database, "availability"),
  bookings: (database: Firestore) => collection(database, "bookings"),
  clients: (database: Firestore) => collection(database, "clients"),
  content: (database: Firestore) => collection(database, "content"),
  logs: (database: Firestore) => collection(database, "logs"),
};

export const docRef = {
  landingContent: (database: Firestore) => doc(database, "content/landing"),
};


