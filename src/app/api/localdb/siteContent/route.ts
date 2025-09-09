import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "siteContent.json");

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize with demo data if file doesn't exist
if (!existsSync(filePath)) {
  const demoData = {
    heroTitle: "Trasforma il tuo fisico. Potenzia la tua performance.",
    heroSubtitle: "Demo content: coaching nutrizionale e training su misura per giovani adulti 20–35.",
    heroCta: "Prenota ora",
    aboutTitle: "Chi sono",
    aboutBody: "Mi chiamo Gabriele Zambonin e da anni aiuto persone come te a raggiungere i propri obiettivi di benessere e performance.\n\nUnisco la mia esperienza come nutrizionista e personal trainer per offrirti piani su misura, che rispettano il tuo stile di vita e i tuoi obiettivi.\n\nIl mio approccio è scientifico ma pratico: niente diete estreme, solo strategie sostenibili per risultati duraturi.",
    aboutImageUrl: "",
    images: [],
    contactPhone: "+39 123 456 7890",
    contactEmail: "info@gznutrition.it",
    contactTitle: "📞 Contattami",
    contactSubtitle: "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza.",
    socialChannels: [
      {
        platform: "Instagram",
        url: "https://instagram.com/gznutrition",
        icon: "📸"
      },
      {
        platform: "LinkedIn",
        url: "https://linkedin.com/in/gznutrition",
        icon: "💼"
      },
      {
        platform: "Facebook",
        url: "https://facebook.com/gznutrition",
        icon: "📘"
      }
    ],
    contactAddresses: [
      {
        name: "Studio Principale",
        address: "Via Roma 123",
        city: "Milano",
        postalCode: "20100",
        coordinates: {
          lat: 45.4642,
          lng: 9.1900
        }
      },
      {
        name: "Studio Secondario",
        address: "Corso Italia 45",
        city: "Milano",
        postalCode: "20122"
      }
    ],
    colorPalette: "gz-default",
    resultsSection: {
      isEnabled: false,
      title: "🎯 Risultati dei Nostri Clienti",
      subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
      photos: []
    }
  };
  
  writeFileSync(filePath, JSON.stringify(demoData, null, 2));
}

export async function GET() {
  try {
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    const data = readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading siteContent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("[API siteContent] Ricevuti dati per salvataggio:", Object.keys(data));
    console.log("[API siteContent] Favicon nel payload:", data.favicon || "NESSUN FAVICON");
    
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("[API siteContent] File salvato con successo:", filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing siteContent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
