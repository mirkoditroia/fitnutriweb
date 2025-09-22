// Client-side Google Calendar helper functions
// These functions call the server-side API route

// Create Google Calendar event from booking
export async function createCalendarEvent(booking: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  slot: string;
  location?: 'online' | 'studio';
  studioLocation?: string;
  packageId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  isFreeConsultation?: boolean;
  consultationDuration?: number;
  notes?: string;
}, packageTitle?: string): Promise<string | null> {
  console.log('🔧 createCalendarEvent called for booking:', booking.name, 'Status:', booking.status);
  try {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        booking,
        packageTitle
      }),
    });

    console.log('🔧 createCalendarEvent API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔧 createCalendarEvent API error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔧 createCalendarEvent API result:', result);
    
    if (result.success) {
      console.log('Google Calendar event created:', result.eventId);
      
      // Handle 'pending' eventId - this means the event is being created asynchronously
      if (result.eventId === 'pending') {
        console.log('⚠️ [CALENDAR] EventId è "pending" - evento in creazione asincrona');
        console.log('⚠️ [CALENDAR] L\'evento verrà creato nel calendario ma non avremo l\'ID reale');
        // Return null to indicate we don't have a real eventId yet
        return null;
      }
      
      return result.eventId as string;
    } else {
      console.error('Failed to create calendar event:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

// Update Google Calendar event
export async function updateCalendarEvent(
  eventId: string, 
  booking: {
    name: string;
    email: string;
    phone?: string;
    date: string;
    slot: string;
    location?: 'online' | 'studio';
    studioLocation?: string;
    packageId?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    isFreeConsultation?: boolean;
    consultationDuration?: number;
    notes?: string;
  }, 
  packageTitle?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        eventId,
        booking,
        packageTitle
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    if (result.success) {
      console.log('Google Calendar event updated:', eventId);
      return true;
    } else {
      console.error('Failed to update calendar event:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
}

// Robust helper: ensure event exists and matches current booking
export async function ensureCalendarEvent(
  existingEventId: string | undefined,
  booking: {
    name: string;
    email: string;
    phone?: string;
    date: string;
    slot: string;
    location?: 'online' | 'studio';
    studioLocation?: string;
    packageId?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    isFreeConsultation?: boolean;
    consultationDuration?: number;
    notes?: string;
  },
  packageTitle?: string
): Promise<string | null> {
  console.log('🔧 ensureCalendarEvent called - existingEventId:', existingEventId, 'booking:', booking.name);
  
  // If we have an event id, try update first
  if (existingEventId && existingEventId !== 'pending') {
    console.log('🔧 ensureCalendarEvent - updating existing event:', existingEventId);
    const ok = await updateCalendarEvent(existingEventId, booking, packageTitle);
    if (ok) {
      console.log('🔧 ensureCalendarEvent - update successful');
      return existingEventId;
    }
    // If update failed (possibly 404), try to recreate a fresh event
    console.log('🔧 ensureCalendarEvent - update failed, creating new event');
    const created = await createCalendarEvent(booking, packageTitle);
    return created;
  }
  
  // If existingEventId is 'pending', don't try to update, just create new
  if (existingEventId === 'pending') {
    console.log('🔧 ensureCalendarEvent - existing eventId is pending, creating new event');
  } else {
    console.log('🔧 ensureCalendarEvent - no existing event, creating new one');
  }
  
  const created = await createCalendarEvent(booking, packageTitle);
  return created;
}

// Delete Google Calendar event by searching for it (fallback method)
async function deleteCalendarEventBySearch(bookingName: string, bookingDate: string, bookingSlot: string): Promise<boolean> {
  console.log('🔍 [CALENDAR] Tentativo cancellazione per ricerca:', { bookingName, bookingDate, bookingSlot });
  
  try {
    // Try to delete using a search-based approach
    // This is a fallback when we don't have the real eventId
    const response = await fetch('/api/calendar', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'delete_by_search',
        bookingName,
        bookingDate,
        bookingSlot
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('✅ [CALENDAR] Evento cancellato tramite ricerca');
        return true;
      }
    }
    
    console.log('⚠️ [CALENDAR] Cancellazione per ricerca non supportata o fallita');
    return false;
  } catch (error) {
    console.error('❌ [CALENDAR] Errore nella cancellazione per ricerca:', error);
    return false;
  }
}

// Delete Google Calendar event
export async function deleteCalendarEvent(eventId: string, bookingData?: { name: string; date: string; slot: string }): Promise<boolean> {
  console.log('🗑️ [CALENDAR] Inizio cancellazione evento:', eventId);
  
  // Special handling for 'pending' eventId
  if (eventId === 'pending') {
    console.log('⚠️ [CALENDAR] EventId è "pending" - tentativo cancellazione per ricerca');
    
    if (bookingData) {
      console.log('🔍 [CALENDAR] Tentativo cancellazione per nome e data:', bookingData);
      return await deleteCalendarEventBySearch(bookingData.name, bookingData.date, bookingData.slot);
    } else {
      console.log('⚠️ [CALENDAR] Nessun dato prenotazione fornito per ricerca');
      console.log('✅ [CALENDAR] Considerato successo (evento potrebbe non esistere)');
      return true; // Consider it successful since we can't search
    }
  }
  
  try {
    const response = await fetch('/api/calendar', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId }),
    });

    console.log('🗑️ [CALENDAR] Response status:', response.status);
    console.log('🗑️ [CALENDAR] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CALENDAR] HTTP error response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('🗑️ [CALENDAR] Response result:', result);
    
    if (result.success) {
      console.log('✅ [CALENDAR] Google Calendar event deleted successfully:', eventId);
      return true;
    } else {
      console.error('❌ [CALENDAR] Failed to delete calendar event:', {
        message: result.message,
        error: result.error,
        eventId: eventId
      });
      return false;
    }
  } catch (error) {
    console.error('❌ [CALENDAR] Error deleting Google Calendar event:', {
      error: error,
      eventId: eventId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// Test Google Calendar connection
export async function testCalendarConnection(): Promise<{ success: boolean; message: string; calendarInfo?: {
  id: string;
  summary: string;
  timeZone: string;
  eventsCount: number;
} }> {
  try {
    // Use local API route instead of Firebase Function
    const response = await fetch('/api/calendar', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error: unknown) {
    console.error('Google Calendar connection test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
    return {
      success: false,
      message: errorMessage
    };
  }
}

// Get calendar configuration (client-side only shows enabled status)
export function getCalendarConfig() {
  return {
    enabled: process.env.NEXT_PUBLIC_GCAL_ENABLED === 'true',
    calendarId: process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || 'dc16aa394525fb01f5906273e6a3f1e47cf616ee466cedd511698e3f285288d6@group.calendar.google.com',
    timezone: process.env.NEXT_PUBLIC_GCAL_TIMEZONE || 'Europe/Rome',
    serviceAccountEmail: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL || 'service-account@demo.iam.gserviceaccount.com'
  };
}
