import { NextResponse } from "next/server";
import { writeJson, readJson } from "@/lib/localdb";
import { getDataMode } from "@/lib/datamode";
import { getClientApp } from "@/lib/firebase";
import { getAdminServices } from "@/lib/firebaseAdmin";

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
      // Verifica token utente dal header Authorization: Bearer <idToken>
      const authHeader = (req.headers.get("authorization") || "").trim();
      const idToken = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7)
        : "";

      const { auth, storage } = getAdminServices();

      if (!idToken) {
        console.warn('[Upload] Nessun ID token fornito. Rifiuto upload.');
        return NextResponse.json({ error: "missing_token" }, { status: 401 });
      }

      // Verifica token e controlla claim admin
      const decoded = await auth.verifyIdToken(idToken);
      if (!(decoded as any).isAdmin && !(decoded as any).admin) {
        console.warn('[Upload] Utente non admin');
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      // Upload via Admin SDK (bypassa rules, ma siamo autenticati come server)
      const bucket = storage.bucket();
      const key = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const fileRef = bucket.file(key);
      await fileRef.save(buffer, {
        resumable: false,
        contentType: file.type,
        public: true,
      });
      const url = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(key)}`;
      console.log('[Upload] Firebase upload successo (admin):', url);
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


