import { NextResponse } from "next/server";
import { readJson } from "@/lib/localdb";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const key = decodeURIComponent(path.join("/"));
  const files = await readJson<Record<string, string>>("_files", {});
  const data = files[key];
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  // data is a data URL; redirect to it
  return NextResponse.redirect(data);
}


