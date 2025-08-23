export type DataMode = "firebase" | "demo" | "local";

// Immediate behavior requested:
// - npm dev (local) => "local"
// - production/hosting (e.g., Firebase) => "firebase"
// - optional override via NEXT_PUBLIC_DATA_MODE (e.g., "demo")
export function getDataMode(): DataMode {
  const override = process.env.NEXT_PUBLIC_DATA_MODE;
  if (override === "local" || override === "demo" || override === "firebase") return override;

  // Development mode
  if (process.env.NODE_ENV !== "production") return "local";
  
  // Production: check if Firebase is properly configured
  const hasFirebase = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
                     process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  // If in production but no Firebase config, use demo mode
  if (!hasFirebase) return "demo";
  
  return "firebase";
}


