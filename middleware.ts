import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  
  // ✅ NUOVA FEATURE: Protezione admin con Firebase Auth
  // Il middleware ora permette l'accesso alle route admin
  // La protezione è gestita dal componente AdminProtected lato client
  
  // Escludi la pagina setup dalla protezione
  if (url.pathname === "/admin/setup") {
    return NextResponse.next();
  }
  
  if (!url.pathname.startsWith("/admin")) return NextResponse.next();

  // Permetti l'accesso alle route admin - la protezione è gestita lato client
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};


