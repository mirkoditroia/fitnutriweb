import { NextRequest, NextResponse } from 'next/server';

// Firebase Functions URLs for secure Google Calendar operations
const CALENDAR_FUNCTIONS = {
  test: 'https://testcalendarconnection-4ks3j6nupa-uc.a.run.app',
  operations: 'https://calendaroperations-4ks3j6nupa-uc.a.run.app'
};

// Proxy function to call Firebase Functions securely
async function callFirebaseFunction(url: string, data?: any) {
  try {
    const response = await fetch(url, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firebase Function call failed:', error);
    throw error;
  }
}

// Build Google Calendar event from booking data
function buildEventFromBooking(booking: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  slot: string;
  location: 'online' | 'studio';
  studioLocation?: string;
  notes?: string;
  isFreeConsultation?: boolean;
  consultationDuration?: number;
}, packageTitle?: string) {
  
  if (!booking.slot) {
    throw new Error(`Missing slot field in booking: ${JSON.stringify(booking)}`);
  }
  
  // Handle both "HH:MM" and "HH:MM - HH:MM" formats
  let startTime: string, endTime: string;
  if (booking.slot.includes(' - ')) {
    // Full range format: "10:00 - 11:00"
    [startTime, endTime] = booking.slot.split(' - ');
  } else {
    // Single time format: "10:00" - calculate end time based on consultation type
    startTime = booking.slot;
    
    // For free consultations or packages with custom duration, use specific logic
    if (booking.isFreeConsultation) {
      // Use dynamic duration from booking (salvata quando lo slot è stato creato) o default a 10 minuti
      const consultationDuration = booking.consultationDuration || 10;
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + consultationDuration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMins = totalMinutes % 60;
      endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    } else {
      // Regular consultations - default 1 hour
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHour = hours + 1;
      endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  const bookingDate = new Date(booking.date);
  
  // Parse start time - create date in Rome timezone
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const startDateTime = new Date(bookingDate);
  startDateTime.setHours(startHours, startMinutes, 0, 0);
  
  // Parse end time - create date in Rome timezone
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const endDateTime = new Date(bookingDate);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  const locationText = booking.location === 'online' ? 'Online' : 
                      booking.studioLocation ? `Studio: ${booking.studioLocation}` : 'In Studio';

  // Debug per verificare packageTitle
  console.log('[DEBUG] buildEventFromBooking - packageTitle:', packageTitle);
  console.log('[DEBUG] buildEventFromBooking - booking.isFreeConsultation:', booking.isFreeConsultation);
  
  const eventSummary = booking.isFreeConsultation 
    ? `🆓 Consultazione Gratuita - ${booking.name}`
    : packageTitle 
      ? `📅 ${packageTitle} - ${booking.name}`
      : `📅 Appuntamento - ${booking.name}`;

  const eventDescription = [
    `Cliente: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Telefono: ${booking.phone}` : '',
    `Modalità: ${locationText}`,
    packageTitle ? `Pacchetto: ${packageTitle}` : '',
    booking.isFreeConsultation ? `Tipo: Consultazione Gratuita (${booking.consultationDuration || 10} minuti)` : '',
    booking.notes ? `Note: ${booking.notes}` : '',
    '',
    '--- Gestito automaticamente da GZ Nutrition ---'
  ].filter(Boolean).join('\n');

  // Format dates for Rome timezone (avoid UTC conversion)
  const formatDateTimeForRome = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  return {
    summary: eventSummary,
    description: eventDescription,
    start: {
      dateTime: formatDateTimeForRome(startDateTime),
      timeZone: 'Europe/Rome',
    },
    end: {
      dateTime: formatDateTimeForRome(endDateTime),
      timeZone: 'Europe/Rome',
    },
    extendedProperties: booking.id ? { private: { bookingId: booking.id } } : undefined,
  };
}

// GET /api/calendar - Test calendar connection
export async function GET() {
  try {
    console.log('Testing Google Calendar connection via Firebase Functions...');
    
    const result = await callFirebaseFunction(CALENDAR_FUNCTIONS.test);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Calendar connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// POST /api/calendar - Calendar operations (create, update, delete)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, booking, packageTitle, eventId } = body;

    console.log(`Performing calendar operation: ${action}`);

    if (action === 'test') {
      // Test connection
      const result = await callFirebaseFunction(CALENDAR_FUNCTIONS.test);
      return NextResponse.json(result);
    }

    if (action === 'create') {
      if (!booking) {
        return NextResponse.json(
          { success: false, message: 'Booking data is required for create action' },
          { status: 400 }
        );
      }

      const eventData = buildEventFromBooking(booking, packageTitle);
      
      const result = await callFirebaseFunction(CALENDAR_FUNCTIONS.operations, {
        action: 'create',
        eventData
      });

      return NextResponse.json(result);
    }

    if (action === 'update') {
      if (!booking || !eventId) {
        return NextResponse.json(
          { success: false, message: 'Booking data and eventId are required for update action' },
          { status: 400 }
        );
      }

      const eventData = buildEventFromBooking(booking, packageTitle);
      
      const result = await callFirebaseFunction(CALENDAR_FUNCTIONS.operations, {
        action: 'update',
        eventData,
        eventId
      });

      return NextResponse.json(result);
    }

    if (action === 'delete') {
      if (!eventId) {
        return NextResponse.json(
          { success: false, message: 'Event ID is required for delete action' },
          { status: 400 }
        );
      }

      const result = await callFirebaseFunction(CALENDAR_FUNCTIONS.operations, {
        action: 'delete',
        eventId
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action specified' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Calendar operation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}