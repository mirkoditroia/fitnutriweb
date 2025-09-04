import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/localdb";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { resource } = await ctx.params;
  const fallback = getFallback(resource);
  const data: unknown = await readJson(resource, fallback);
  return NextResponse.json(data);
}

export async function POST(req: Request, ctx: Ctx) {
  const { resource } = await ctx.params;
  const body = await req.json();
  await writeJson(resource, body);
  return NextResponse.json({ ok: true });
}

function getFallback(resource: string): unknown {
  if (resource === "packages" || resource === "bookings" || resource === "clients") return [];
  if (resource === "availability") return {};
  if (resource === "siteContent") return { 
    heroTitle: "", 
    heroSubtitle: "", 
    heroCta: "Prenota ora", 
    heroBackgroundImage: "", 
    images: [], 
    faq: [],
    colorPalette: "gz-default",
    resultsSection: {
      isEnabled: false,
      title: "🎯 Risultati dei Nostri Clienti",
      subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
      photos: []
    }
  };
  return {};
}


