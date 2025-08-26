import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "packages.json");

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize with demo data if file doesn't exist
if (!existsSync(filePath)) {
  const demoData = [
    {
      "id": "free-consultation",
      "title": "🎯 10 Minuti Consultivi Gratuiti",
      "description": "Primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance",
      "price": 0,
      "imageUrl": "",
      "isActive": true,
      "featured": true,
      "badge": "GRATIS",
      "isPromotional": true
    },
    {
      "id": "basic-package",
      "title": "Pacchetto Base",
      "description": "Programma nutrizionale personalizzato con follow-up settimanale",
      "price": 150,
      "imageUrl": "",
      "isActive": true,
      "featured": false,
      "badge": null,
      "isPromotional": false
    }
  ];
  
  writeFileSync(filePath, JSON.stringify(demoData, null, 2));
}

export async function GET() {
  try {
    const data = readFileSync(filePath, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading packages:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing packages:", error);
    return NextResponse.json({ error: "Failed to save packages" }, { status: 500 });
  }
}
