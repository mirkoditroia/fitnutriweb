import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_: Request, ctx: Ctx) {
  const { path: segments } = await ctx.params;
  const rel = segments.join("/");
  const abs = path.join(process.cwd(), ".data", "uploads", rel);
  try {
    const data = await fs.readFile(abs);
    const ext = abs.split(".").pop()?.toLowerCase();
    const type = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "application/octet-stream";
    return new NextResponse(data as BodyInit, { headers: { "content-type": type } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}


