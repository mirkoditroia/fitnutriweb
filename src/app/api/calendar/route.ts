import { NextRequest, NextResponse } from 'next/server';

// Firebase Functions URLs for secure Google Calendar operations
const CALENDAR_FUNCTIONS = {
  test: 'https://testcalendarconnection-4ks3j6nupa-uc.a.run.app',
  operations: 'https://calendaroperations-4ks3j6nupa-uc.a.run.app'
};

// Validate eventId format
function validateEventId(eventId: string): boolean {
  if (!eventId || typeof eventId !== 'string') {
    return false;
  }
  
  const trimmedId = eventId.trim();
  
  // Check for invalid eventIds
  if (trimmedId === 'pending' || trimmedId === 'null' || trimmedId === 'undefined') {
    console.log('❌ [VALIDATION] EventId non valido (pending/null/undefined):', trimmedId);
    return false;
  }
  
  // Google Calendar event IDs typically contain alphanumeric characters and some special chars
  // They should not be empty and should have a reasonable length
  return trimmedId.length > 0 && trimmedId.length < 200;
}

// Enhanced delete function with better error handling
async function deleteCalendarEventWithRetry(eventId: string, maxRetries: number = 2): Promise<{ success: boolean; message: string; error?: any }> {
  console.log('🗑️ [DELETE] Inizio cancellazione evento:', eventId);
  
  // Special handling for 'pending' eventId
  if (eventId === 'pending') {
    console.log('⚠️ [DELETE] EventId è "pending" - evento non ancora creato nel calendario');
    return {
      success: true,
      message: 'Evento non ancora creato nel calendario (pending) - nessuna cancellazione necessaria'
    };
  }
  
  // Validate eventId first
  if (!validateEventId(eventId)) {
    console.error('❌ [DELETE] EventId non valido:', eventId);
    return {
      success: false,
      message: 'Event ID non valido o mancante',
      error: 'Invalid eventId format'
    };
  }

  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [DELETE] Tentativo ${attempt}/${maxRetries} per evento:`, eventId);
      
      const result = await callFirebaseFunction(CALENDAR_FUNCTIONS.operations, {
        action: 'delete',
        eventId: eventId.trim()
      });
      
      console.log('✅ [DELETE] Cancellazione riuscita:', result);
      return {
        success: true,
        message: 'Evento cancellato con successo'
      };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ [DELETE] Tentativo ${attempt} fallito:`, error);
      
      // If it's a 400 error, don't retry as it's likely a data issue
      if (error instanceof Error && error.message.includes('400')) {
        console.error('❌ [DELETE] Errore 400 - non riprovo:', error.message);
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, etc.
        console.log(`⏳ [DELETE] Attendo ${waitTime}ms prima del prossimo tentativo...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('❌ [DELETE] Tutti i tentativi falliti. Ultimo errore:', lastError);
  return {
    success: false,
    message: `Impossibile cancellare l'evento dopo ${maxRetries} tentativi`,
    error: lastError
  };
}

// Proxy function to call Firebase Functions securely
async function callFirebaseFunction(url: string, data?: any) {
  try {
    console.log('🔧 [FIREBASE] Chiamata a:', url);
    console.log('🔧 [FIREBASE] Dati inviati:', data);
    
    const response = await fetch(url, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined
    });

    console.log('🔧 [FIREBASE] Status response:', response.status);
    console.log('🔧 [FIREBASE] Headers response:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [FIREBASE] Errore response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        url: url,
        data: data
      });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [FIREBASE] Risultato ricevuto:', result);
    return result;
  } catch (error) {
    console.error('❌ [FIREBASE] Firebase Function call failed:', {
      error: error,
      url: url,
      data: data
    });
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
  
  console.log('🔍 [CALENDAR] buildEventFromBooking chiamata con:', {
    name: booking.name,
    isFreeConsultation: booking.isFreeConsultation,
    consultationDuration: booking.consultationDuration,
    slot: booking.slot,
    packageTitle
  });
  
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
      console.log('🔍 [CALENDAR] Durata consultazione ricevuta:', booking.consultationDuration);
      console.log('🔍 [CALENDAR] Durata consultazione utilizzata:', consultationDuration);
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + consultationDuration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMins = totalMinutes % 60;
      endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      console.log('🔍 [CALENDAR] Orario calcolato:', startTime, '->', endTime, `(${consultationDuration} minuti)`);
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
  return handleCalendarRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleCalendarRequest(request);
}

async function handleCalendarRequest(request: NextRequest) {
  try {
    let body: any = {};
    
    try {
      body = await request.json();
    } catch (error) {
      console.log('❌ JSON parsing failed:', error);
      // If JSON parsing fails, try to get eventId from URL params for DELETE requests
      const url = new URL(request.url);
      const eventId = url.searchParams.get('eventId');
      if (eventId) {
        body = { action: 'delete', eventId };
      }
    }
    
    const { action, booking, packageTitle, eventId } = body;

    console.log(`Performing calendar operation: ${action}`);
    console.log('Request body:', body);
    console.log('EventId received:', eventId);
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);

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
      console.log('🗑️ [DELETE] Inizio operazione di cancellazione');
      console.log('🗑️ [DELETE] EventId ricevuto:', eventId);
      console.log('🗑️ [DELETE] Tipo eventId:', typeof eventId);
      console.log('🗑️ [DELETE] Body completo:', body);
      
      if (!eventId) {
        console.log('❌ [DELETE] EventId mancante nel body:', body);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Event ID is required for delete action',
            details: 'Nessun eventId fornito nella richiesta'
          },
          { status: 400 }
        );
      }

      // Use the enhanced delete function with retry logic
      const deleteResult = await deleteCalendarEventWithRetry(eventId);
      
      console.log('🗑️ [DELETE] Risultato cancellazione:', deleteResult);
      
      if (deleteResult.success) {
        return NextResponse.json({
          success: true,
          message: deleteResult.message,
          eventId: eventId
        });
      } else {
        // Return appropriate status code based on error type
        const statusCode = deleteResult.error?.message?.includes('400') ? 400 : 500;
        return NextResponse.json(
          {
            success: false,
            message: deleteResult.message,
            error: deleteResult.error?.message || 'Unknown error',
            eventId: eventId
          },
          { status: statusCode }
        );
      }
    }

    if (action === 'delete_by_search') {
      console.log('🔍 [DELETE_SEARCH] Inizio cancellazione per ricerca');
      const { bookingName, bookingDate, bookingSlot } = body;
      
      if (!bookingName || !bookingDate) {
        console.log('❌ [DELETE_SEARCH] Dati mancanti per ricerca:', body);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Booking name and date are required for search-based deletion',
            details: 'Dati prenotazione mancanti per la ricerca'
          },
          { status: 400 }
        );
      }

      console.log('🔍 [DELETE_SEARCH] Ricerca evento per:', { bookingName, bookingDate, bookingSlot });
      
      // For now, we can't actually search and delete from the Firebase Function
      // This is a placeholder for future implementation
      console.log('⚠️ [DELETE_SEARCH] Cancellazione per ricerca non ancora implementata');
      
      return NextResponse.json({
        success: false,
        message: 'Search-based deletion not yet implemented',
        details: 'La cancellazione per ricerca non è ancora implementata. Controlla manualmente il calendario Google.'
      });
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