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
  notes?: string;
}, packageTitle?: string): Promise<string | null> {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      console.log('Google Calendar event created:', result.eventId);
      return result.eventId;
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
      throw new Error(`HTTP error! status: ${response.status}`);
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

// Delete Google Calendar event
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/calendar', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      console.log('Google Calendar event deleted:', eventId);
      return true;
    } else {
      console.error('Failed to delete calendar event:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
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
    // Use Firebase Function instead of local API route
    const response = await fetch('https://testcalendarconnection-4ks3j6nupa-uc.a.run.app', {
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
    calendarId: process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || '9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com',
    timezone: process.env.NEXT_PUBLIC_GCAL_TIMEZONE || 'Europe/Rome',
    serviceAccountEmail: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL || 'zambo-489@gznutrition-d5d13.iam.gserviceaccount.com'
  };
}
