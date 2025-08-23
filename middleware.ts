import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/admin")) return NextResponse.next();

  const requiredKey = process.env.ADMIN_ACCESS_KEY || "";
  if (!requiredKey) return NextResponse.next();

  const cookieKey = req.cookies.get("admin_key")?.value;
  const queryKey = url.searchParams.get("key");

  if (queryKey && queryKey === requiredKey) {
    const res = NextResponse.redirect(new URL(url.pathname, url.origin));
    res.cookies.set("admin_key", queryKey, { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  }

  if (cookieKey === requiredKey) return NextResponse.next();

  return new NextResponse(
    `<!doctype html><html lang="it"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>401</title></head><body style="font-family:system-ui;padding:2rem;background:#0E0F12;color:#F7F9FB"><h1>Accesso admin</h1><p>Aggiungi ?key=ALLA_FINE_DELL_URL con la chiave corretta per accedere.</p></body></html>`,
    { status: 401, headers: { "content-type": "text/html" } }
  );
}

export const config = {
  matcher: ["/admin/:path*"],
};


