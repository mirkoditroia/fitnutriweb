export type DataMode = "firebase" | "demo" | "local";

// Immediate behavior requested:
// - npm dev (local) => "local"
// - production/hosting (e.g., Firebase) => "firebase"
// - optional override via NEXT_PUBLIC_DATA_MODE (e.g., "demo")
export function getDataMode(): DataMode {
  const override = process.env.NEXT_PUBLIC_DATA_MODE;
  if (override === "local" || override === "demo" || override === "firebase") return override;

  if (process.env.NODE_ENV !== "production") return "local";
  return "firebase";
}


