export type DataMode = "firebase" | "demo" | "local";

// Immediate behavior requested:
// - npm dev (local) => "local"
// - production/hosting (e.g., Firebase) => "firebase"
// - optional override via NEXT_PUBLIC_DATA_MODE (e.g., "demo")
export function getDataMode(): DataMode {
  const override = process.env.NEXT_PUBLIC_DATA_MODE;
  if (override === "local" || override === "demo" || override === "firebase") {
    console.log("[DataMode] Override detected:", override);
    return override;
  }

  // Development mode
  if (process.env.NODE_ENV !== "production") {
    console.log("[DataMode] Development mode: local");
    return "local";
  }
  
  // Production: check if Firebase is properly configured
  const hasFirebase = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
                     process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  console.log("[DataMode] Production mode, Firebase configured:", hasFirebase);
  
  // If in production but no Firebase config, use demo mode
  if (!hasFirebase) {
    console.log("[DataMode] Using demo mode");
    return "demo";
  }
  
  console.log("[DataMode] Using firebase mode");
  return "firebase";
}


