import { NextResponse } from "next/server";
import { writeJson, readJson } from "@/lib/localdb";
import { promises as fs } from "fs";
import path from "path";
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
      const app = getClientApp();
      if (!app) return NextResponse.json({ error: "firebase app not ready" }, { status: 500 });
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const storage = getStorage(app);
      const key = `${folder}/${Date.now()}-${file.name}`;
      const r = ref(storage, key);
      await uploadBytes(r, buffer, { contentType: file.type });
      const url = await getDownloadURL(r);
      return NextResponse.json({ url, path: key });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // local/demo: persist a data URL mapping and expose via /api/upload/[...path]
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const relKey = `${folder}/${Date.now()}-${safeName}`;
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  // read and update mapping
  const files = await readJson<Record<string, string>>("_files", {});
  files[relKey] = dataUrl;
  await writeJson("_files", files);

  // Return a short URL that redirects to the data URL when fetched
  const url = `/api/upload/${encodeURIComponent(relKey)}`;
  return NextResponse.json({ url, path: relKey });
}


