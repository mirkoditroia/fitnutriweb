import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "bookings.json");

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

export async function GET() {
  try {
    const data = readFileSync(filePath, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading bookings:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Se è un array, salva direttamente (per aggiornamenti bulk)
    if (Array.isArray(data)) {
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      return NextResponse.json({ success: true });
    }
    
    // Se è un singolo booking, lo aggiunge alla lista esistente
    const existingBookings = existsSync(filePath) 
      ? JSON.parse(readFileSync(filePath, "utf8"))
      : [];
    
    const newBooking = {
      ...data,
      id: data.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: data.createdAt || new Date().toISOString()
    };
    
    const updatedBookings = [...existingBookings, newBooking];
    writeFileSync(filePath, JSON.stringify(updatedBookings, null, 2));
    
    return NextResponse.json({ success: true, id: newBooking.id });
  } catch (error) {
    console.error("Error writing bookings:", error);
    return NextResponse.json({ error: "Failed to save bookings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const existingBookings = existsSync(filePath) 
      ? JSON.parse(readFileSync(filePath, "utf8"))
      : [];
    
    const updatedBookings = existingBookings.map((booking: any) => 
      booking.id === data.id ? { ...booking, ...data } : booking
    );
    
    writeFileSync(filePath, JSON.stringify(updatedBookings, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }
    
    const existingBookings = existsSync(filePath) 
      ? JSON.parse(readFileSync(filePath, "utf8"))
      : [];
    
    const updatedBookings = existingBookings.filter((booking: any) => booking.id !== id);
    writeFileSync(filePath, JSON.stringify(updatedBookings, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
