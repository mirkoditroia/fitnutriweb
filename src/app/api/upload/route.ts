import { NextResponse } from "next/server";
// import { writeJson, readJson } from "@/lib/localdb";
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

  // local/demo: write to .data/uploads and serve from /uploads/*
  const uploadsDir = path.join(process.cwd(), ".data", "uploads", folder);
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const relKey = `${folder}/${Date.now()}-${safeName}`;
  const absPath = path.join(process.cwd(), ".data", "uploads", relKey);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, buffer);
  const url = `/uploads/${encodeURIComponent(relKey)}`;
  return NextResponse.json({ url, path: relKey });
}


