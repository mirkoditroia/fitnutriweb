import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

/**
 * Returns initialized Admin SDK services (auth, storage).
 * Uses application default credentials. On Firebase Hosting/Cloud, defaults are provided.
 */
export function getAdminServices() {
  const hasApp = getApps().length > 0;
  const app = hasApp
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
      });

  return {
    auth: getAuth(app),
    storage: getStorage(app),
  };
}


