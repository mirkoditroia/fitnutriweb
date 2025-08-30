import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Calendar configuration from environment variables
const CALENDAR_CONFIG = {
  enabled: process.env.GCAL_ENABLED === 'true',
  calendarId: process.env.GCAL_CALENDAR_ID || '9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com',
  timezone: process.env.GCAL_TIMEZONE || 'Europe/Rome',
  serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY,
  privateKeyB64: process.env.GOOGLE_PRIVATE_KEY_B64
};

// Build Google Calendar event from booking
function buildEventFromBooking(booking: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  date: string; // YYYY-MM-DD
  slot: string; // HH:mm
  location?: 'online' | 'studio';
  studioLocation?: string;
  packageId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  isFreeConsultation?: boolean;
  notes?: string;
}, packageTitle?: string) {
  const startIso = `${booking.date}T${booking.slot}:00`;
  const eventTitleBase = booking.isFreeConsultation
    ? 'Consultazione gratuita'
    : (packageTitle || 'Appuntamento');
  const summary = `${eventTitleBase} - ${booking.name}`;
  const durationMinutes = booking.isFreeConsultation ? 10 : 60;
  const endDate = new Date(`${startIso}:00Z`.replace('Z', ''));
  // Add minutes in local TZ by constructing via Date then ISO again
  const end = new Date(new Date(startIso).getTime() + durationMinutes * 60000);

  const descriptionLines = [
    `Nome: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Telefono: ${booking.phone}` : undefined,
    `Stato: ${booking.status}`,
    `Luogo: ${booking.location || (booking.isFreeConsultation ? 'online' : 'online')}`,
    booking.studioLocation ? `Studio: ${booking.studioLocation}` : undefined,
    booking.notes ? `Note: ${booking.notes}` : undefined,
  ].filter(Boolean) as string[];

  return {
    summary,
    description: descriptionLines.join('\n'),
    start: {
      dateTime: startIso,
      timeZone: CALENDAR_CONFIG.timezone,
    },
    end: {
      dateTime: `${end.toISOString().slice(0,16)}`,
      timeZone: CALENDAR_CONFIG.timezone,
    },
  } as const;
}

// Initialize Google Calendar client
function getCalendarClient() {
  if (!CALENDAR_CONFIG.enabled) {
    throw new Error('Google Calendar integration is not enabled');
  }

  if (!CALENDAR_CONFIG.serviceAccountEmail || (!CALENDAR_CONFIG.privateKey && !CALENDAR_CONFIG.privateKeyB64)) {
    throw new Error('Missing Google Service Account credentials. Please configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY (or GOOGLE_PRIVATE_KEY_B64).');
  }

  // Clean and format the private key properly
  let cleanPrivateKey = CALENDAR_CONFIG.privateKey || '';

  // If base64 provided, prefer decoding it
  if (CALENDAR_CONFIG.privateKeyB64 && !cleanPrivateKey) {
    try {
      const decoded = Buffer.from(CALENDAR_CONFIG.privateKeyB64, 'base64').toString('utf8');
      cleanPrivateKey = decoded;
    } catch {
      // ignore, will try other paths
    }
  }

  // If still not a PEM, try to base64-decode the provided string (Render sometimes strips newlines)
  if (cleanPrivateKey && !cleanPrivateKey.includes('BEGIN PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(cleanPrivateKey, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        cleanPrivateKey = decoded;
      }
    } catch {
      // continue with string normalization
    }
  }
  
  if (cleanPrivateKey) {
    // Remove wrapping quotes if present
    if (cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) {
      cleanPrivateKey = cleanPrivateKey.slice(1, -1);
    }
    // Replace escaped newlines
    cleanPrivateKey = cleanPrivateKey.replace(/\\\\n/g, '\n');
    cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
    if (cleanPrivateKey.includes('\\n')) {
      cleanPrivateKey = cleanPrivateKey.split(String.raw`\n`).join('\n');
    }
  }

  // Ensure proper PEM format
  if (!cleanPrivateKey || !cleanPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format. Must be in PEM format.');
  }

  try {
    const auth = new google.auth.JWT({
      email: CALENDAR_CONFIG.serviceAccountEmail!,
      key: cleanPrivateKey,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error('Error creating JWT auth:', error);
    throw new Error(`Failed to create Google Calendar authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// POST - Create or update calendar event
export async function POST(request: NextRequest) {
  try {
    const { action, booking, packageTitle, eventId, eventData } = await request.json();
    const calendar = getCalendarClient();

    if (action === 'create') {
      const requestBody = booking ? buildEventFromBooking(booking, packageTitle) : (eventData ?? {});
      const event = await calendar.events.insert({
        calendarId: CALENDAR_CONFIG.calendarId,
        requestBody
      });

      return NextResponse.json({
        success: true,
        eventId: event.data.id,
        message: 'Event created successfully'
      });
    }

    if (action === 'update') {
      const body = booking ? buildEventFromBooking(booking, packageTitle) : (eventData ?? {});
      const event = await calendar.events.update({
        calendarId: CALENDAR_CONFIG.calendarId,
        eventId: eventId,
        requestBody: body
      });

      return NextResponse.json({
        success: true,
        eventId: event.data.id,
        message: 'Event updated successfully'
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action specified'
    }, { status: 400 });

  } catch (error: unknown) {
    console.error('Google Calendar operation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}

// DELETE - Delete calendar event
export async function DELETE(request: NextRequest) {
  try {
    const { eventId } = await request.json();
    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId: CALENDAR_CONFIG.calendarId,
      eventId: eventId
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error: unknown) {
    console.error('Google Calendar deletion failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}

// GET - Test connection
export async function GET() {
  try {
    if (!CALENDAR_CONFIG.enabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Google Calendar integration is disabled' 
      });
    }

    // Check if credentials are configured
    if (!CALENDAR_CONFIG.serviceAccountEmail || (!CALENDAR_CONFIG.privateKey && !CALENDAR_CONFIG.privateKeyB64)) {
      return NextResponse.json({
        success: false,
        message: 'Missing Google Service Account credentials. Please configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY (or GOOGLE_PRIVATE_KEY_B64).'
      }, { status: 400 });
    }

    const calendar = getCalendarClient();
    
    // Test by getting calendar info
    const calendarInfo = await calendar.calendars.get({
      calendarId: CALENDAR_CONFIG.calendarId
    });

    // Test by listing events (limit 1)
    const events = await calendar.events.list({
      calendarId: CALENDAR_CONFIG.calendarId,
      maxResults: 1,
      timeMin: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      calendarInfo: {
        id: calendarInfo.data.id,
        summary: calendarInfo.data.summary,
        timeZone: calendarInfo.data.timeZone,
        eventsCount: events.data.items?.length || 0
      }
    });
  } catch (error: unknown) {
    console.error('Google Calendar connection test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}
