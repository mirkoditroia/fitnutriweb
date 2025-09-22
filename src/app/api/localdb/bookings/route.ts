import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getSiteContent, getPackages } from "@/lib/datasource";

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "bookings.json");

// ✅ Funzione per inviare notifiche email (come in datasource.ts)
async function sendBookingNotification(booking: any): Promise<void> {
  try {
    // Ottieni configurazione dal siteContent
    const siteContent = await getSiteContent();
    const notificationEmail = siteContent?.notificationEmail || "mirkoditroia@gmail.com";
    const businessName = siteContent?.businessName || "GZ Nutrition";
    const colorPalette = siteContent?.colorPalette || "gz-default";
    
    // Get package title
    let packageTitle: string | undefined;
    if (booking.packageId) {
      try {
        const packages = await getPackages();
        const pkg = packages.find((p: any) => p.id === booking.packageId);
        if (pkg) {
          packageTitle = pkg.title;
        }
      } catch (error) {
        console.error("Error getting package title:", error);
      }
    }
    
    // Set title for free consultation
    if (booking.isFreeConsultation) {
      packageTitle = "Consultazione Gratuita (10 minuti)";
    }
    
    // Invia email tramite Firebase Functions
    const response = await fetch('https://sendbookingnotification-4ks3j6nupa-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'new-booking',
        booking,
        packageTitle,
        notificationEmail,
        businessName,
        colorPalette
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Booking notification sent successfully to:', result.sentTo);
    } else {
      console.error('❌ Failed to send booking notification:', result.message);
    }
    
  } catch (error) {
    console.error("❌ Error sending booking notification:", error);
    throw error;
  }
}

// ✅ Helper per aggiungere header CORS e cache control per Safari iOS
async function addCorsHeaders(response: NextResponse, request?: NextRequest) {
  response.headers.set("Access-Control-Allow-Credentials", "true");

  // ✅ Origin della richiesta (può essere null su same-origin)
  const requestOrigin = request?.headers.get("origin") || "";

  // ✅ Usa dominio dinamico da admin settings o fallback
  let primaryOrigin = "https://www.demo.it";
  try {
    const siteContent = await getSiteContent();
    if (siteContent?.siteUrl) {
      primaryOrigin = siteContent.siteUrl.startsWith("http")
        ? siteContent.siteUrl.replace(/\/$/, "")
        : `https://${siteContent.siteUrl.replace(/\/$/, "")}`;
    }
  } catch {
    // fallback
  }

  // ✅ Genera varianti www/non-www per maggiore tolleranza
  const variants = new Set<string>();
  const addVariant = (urlStr: string) => {
    try {
      const u = new URL(urlStr);
      const host = u.host.replace(/\.$/, "");
      const noWww = host.replace(/^www\./, "");
      const withWww = host.startsWith("www.") ? host : `www.${host}`;
      variants.add(`${u.protocol}//${host}`);
      variants.add(`${u.protocol}//${noWww}`);
      variants.add(`${u.protocol}//${withWww}`);
    } catch {
      // ignore malformed
    }
  };

  addVariant(primaryOrigin);
  // ✅ Consenti anche dominio Firebase hosting (preview/hosting)
  addVariant("https://demo.web.app");

  // ✅ Se l'Origin della richiesta è nella whitelist, fai echo di quello specifico
  let allowOrigin = primaryOrigin;
  if (requestOrigin) {
    try {
      const o = new URL(requestOrigin);
      const candidate = `${o.protocol}//${o.host}`;
      if (variants.has(candidate)) {
        allowOrigin = candidate;
      }
    } catch {
      // ignore
    }
  }

  response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, Authorization, Accept, Cache-Control, Pragma, X-Requested-With"
  );
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Access-Control-Expose-Headers", "Content-Type, Content-Length, ETag, Date");
  // ✅ Evita cache proxy/CDN differenziando per Origin
  response.headers.append("Vary", "Origin");
  return response;
}

// ✅ Handler per preflight OPTIONS (necessario per Safari iOS)
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return await addCorsHeaders(response, request);
}

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize with demo data if file doesn't exist
if (!existsSync(filePath)) {
  const demoData = [
    {
      "id": "demo-booking-1",
      "name": "Mario Rossi",
      "email": "mario.rossi@example.com",
      "phone": "+39 123 456 789",
      "date": "2024-12-20",
      "slot": "14:00",
      "packageId": "basic-package",
      "channelPreference": "whatsapp",
      "priority": false,
      "status": "pending",
      "isFreeConsultation": false,
      "notes": "Mario vuole migliorare la sua performance sportiva e ha bisogno di un piano nutrizionale personalizzato per il calcio. Ha già provato alcune diete ma senza risultati soddisfacenti.",
      "createdAt": "2024-12-19T10:00:00.000Z"
    },
    {
      "id": "demo-booking-2",
      "name": "Giulia Bianchi",
      "email": "giulia.bianchi@example.com",
      "phone": "+39 987 654 321",
      "date": "2024-12-21",
      "slot": "16:00",
      "packageId": "free-consultation",
      "channelPreference": "email",
      "priority": true,
      "status": "confirmed",
      "isFreeConsultation": true,
      "notes": "Giulia è interessata a perdere peso in modo sano e sostenibile. Ha problemi di digestione e vorrebbe capire come migliorare la sua alimentazione quotidiana.",
      "createdAt": "2024-12-18T15:30:00.000Z"
    }
  ];
  
  writeFileSync(filePath, JSON.stringify(demoData, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const data = readFileSync(filePath, "utf8");
    const response = NextResponse.json(JSON.parse(data));
    return await addCorsHeaders(response, request);
  } catch (error) {
    console.error("Error reading bookings:", error);
    const response = NextResponse.json([], { status: 500 });
    return await addCorsHeaders(response, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // ✅ DEBUGGING: Log della richiesta per tracciare iOS
    console.log("📡 API /api/localdb/bookings POST ricevuta");
    console.log("📱 User-Agent:", request.headers.get('user-agent') || 'unknown');
    console.log("📦 Payload ricevuto:", JSON.stringify(data, null, 2));
    
    // Se è un array, salva direttamente (per aggiornamenti bulk)
    if (Array.isArray(data)) {
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      const response = NextResponse.json({ success: true });
      return await addCorsHeaders(response, request);
    }
    
    // ✅ Pulisci il payload da campi non-booking (come captchaToken)
    const { captchaToken, forceFirebase, deviceType, ...bookingData } = data;
    console.log("🧹 Payload pulito:", JSON.stringify(bookingData, null, 2));

    // ✅ In produzione: salva sempre su Firebase per massima affidabilità (bypass locale/Safari)
    if (process.env.NODE_ENV === "production") {
      try {
        const { createBooking: fbCreateBooking } = await import("@/lib/data");
        const firebaseId = await fbCreateBooking(bookingData as any, captchaToken);
        const response = NextResponse.json({ success: true, id: firebaseId, source: "firebase" });
        return await addCorsHeaders(response, request);
      } catch (prodErr) {
        console.error("❌ Firebase save failed in production, falling back to local file:", prodErr);
        // Continua con salvataggio locale come fallback estremo
      }
    }

    // Se è un singolo booking, lo aggiunge alla lista esistente (ambiente locale)
    const existingBookings = existsSync(filePath) 
      ? JSON.parse(readFileSync(filePath, "utf8"))
      : [];
    
    const newBooking = {
      ...bookingData,
      id: bookingData.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: bookingData.createdAt || new Date().toISOString()
    };
    
    const updatedBookings = [...existingBookings, newBooking];
    writeFileSync(filePath, JSON.stringify(updatedBookings, null, 2));
    console.log("💾 Booking salvato nel file:", newBooking.id);
    console.log("📊 Totale prenotazioni:", updatedBookings.length);
    
    // ✅ AGGIUNTO: Invio notifica email per nuove prenotazioni
    try {
      console.log("📧 Tentativo invio email notifica...");
      await sendBookingNotification(newBooking);
      console.log("✅ Email notification sent for booking:", newBooking.id);
    } catch (emailError) {
      console.error("❌ Failed to send email notification:", emailError);
      // Non fallire la prenotazione se l'email fallisce
    }
    
    const response = NextResponse.json({ success: true, id: newBooking.id });
    return await addCorsHeaders(response, request);
  } catch (error) {
    console.error("Error writing bookings:", error);
    const response = NextResponse.json({ error: "Failed to save bookings" }, { status: 500 });
    return await addCorsHeaders(response, request);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const existingBookings = existsSync(filePath) 
      ? JSON.parse(readFileSync(filePath, "utf8"))
      : [];
    
    const updatedBookings = existingBookings.map((booking: { id: string; [key: string]: unknown }) => 
      booking.id === data.id ? { ...booking, ...data } : booking
    );
    
    writeFileSync(filePath, JSON.stringify(updatedBookings, null, 2));
    const response = NextResponse.json({ success: true });
    return await addCorsHeaders(response, request);
  } catch (error) {
    console.error("Error updating booking:", error);
    const response = NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    return await addCorsHeaders(response, request);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      const response = NextResponse.json({ error: "Booking ID required" }, { status: 400 });
      return await addCorsHeaders(response, request);
    }
    
    const existingBookings = existsSync(filePath) 
      ? JSON.parse(readFileSync(filePath, "utf8"))
      : [];
    
    const updatedBookings = existingBookings.filter((booking: { id: string; [key: string]: unknown }) => booking.id !== id);
    writeFileSync(filePath, JSON.stringify(updatedBookings, null, 2));
    
    const response = NextResponse.json({ success: true });
    return await addCorsHeaders(response, request);
  } catch (error) {
    console.error("Error deleting booking:", error);
    const response = NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    return await addCorsHeaders(response, request);
  }
}
