import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/data";

function addNoCache(resp: NextResponse, req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) {
    resp.headers.set("Access-Control-Allow-Origin", origin);
    resp.headers.set("Vary", "Origin");
  }
  resp.headers.set("Access-Control-Allow-Credentials", "true");
  resp.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  resp.headers.set(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, Authorization, Accept, Cache-Control, Pragma, X-Requested-With"
  );
  resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  resp.headers.set("Pragma", "no-cache");
  resp.headers.set("Expires", "0");
  return resp;
}

export async function OPTIONS(request: NextRequest) {
  const resp = new NextResponse(null, { status: 200 });
  return addNoCache(resp, request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { captchaToken, ...bookingPayload } = body || {};

    // In API, attendiamo gli effetti collaterali (email, calendar)
    const bookingId = await createBooking(bookingPayload, captchaToken, { awaitSideEffects: true });

    const resp = NextResponse.json({ success: true, id: bookingId });
    return addNoCache(resp, request);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const resp = NextResponse.json({ success: false, error: message }, { status: 500 });
    return addNoCache(resp, request);
  }
}


