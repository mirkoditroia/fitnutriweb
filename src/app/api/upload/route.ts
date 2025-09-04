import { NextResponse } from "next/server";
import { writeJson, readJson } from "@/lib/localdb";
import { getDataMode } from "@/lib/datamode";
import { getClientApp } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const mode = getDataMode();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "uploads";
  if (!file) return NextResponse.json({ error: "file missing" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  if (mode === "firebase") {
    try {
      console.log('[Upload] Tentativo Firebase Storage...');
      const app = getClientApp();
      if (!app) {
        console.log('[Upload] Firebase app non disponibile, fallback a local storage');
        // Fallback automatico al sistema local
        return handleLocalUpload(file, folder, buffer);
      }
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const storage = getStorage(app);
      const key = `${folder}/${Date.now()}-${file.name}`;
      const r = ref(storage, key);
      await uploadBytes(r, buffer, { contentType: file.type });
      const url = await getDownloadURL(r);
      console.log('[Upload] Firebase upload successo:', url);
      return NextResponse.json({ url, path: key });
    } catch (e) {
      console.error('[Upload] Firebase fallito, fallback a local:', e);
      // Fallback automatico al sistema local
      return handleLocalUpload(file, folder, buffer);
    }
  }

  // local/demo: persist a data URL mapping and expose via /api/upload/[...path]
  return handleLocalUpload(file, folder, buffer);
}

// Funzione helper per upload local (usata anche come fallback)
async function handleLocalUpload(file: File, folder: string, buffer: Buffer) {
  console.log('[Upload] Usando sistema local storage');
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const relKey = `${folder}/${Date.now()}-${safeName}`;
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  // read and update mapping
  const files = await readJson<Record<string, string>>("_files", {});
  files[relKey] = dataUrl;
  await writeJson("_files", files);

  // Return a short URL that redirects to the data URL when fetched
  const url = `/api/upload/${encodeURIComponent(relKey)}`;
  console.log('[Upload] Local upload successo:', url);
  return NextResponse.json({ url, path: relKey });
}


