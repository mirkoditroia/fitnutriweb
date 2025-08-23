import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { env, hasFirebaseConfig } from "@/lib/env";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp | null = hasFirebaseConfig()
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth: ReturnType<typeof getAuth> | undefined = app ? getAuth(app) : undefined;
export const db: ReturnType<typeof getFirestore> | undefined = app ? getFirestore(app) : undefined;

// Analytics only on client and when measurement id is provided
export async function setupAnalytics() {
  if (typeof window === "undefined") return;
  if (!app) return;
  if (!env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return;
  if (!(await isSupported())) return;
  try {
    getAnalytics(app);
  } catch {}
}

// Expose client app for other SDKs (e.g., Storage)
export function getClientApp(): FirebaseApp | null {
  return app;
}


