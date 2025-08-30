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
  const pad = (n: number) => String(n).padStart(2, '0');
  // start: YYYY-MM-DDTHH:MM:SS
  const startIso = `${booking.date}T${booking.slot}:00`;

  // compute end by adding minutes to start
  const [bh, bm] = booking.slot.split(":").map(Number);
  const startDate = new Date(booking.date);
  startDate.setHours(bh || 0, bm || 0, 0, 0);
  const durationMinutes = booking.isFreeConsultation ? 10 : 60;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const endIso = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

  const eventTitleBase = booking.isFreeConsultation
    ? 'Consultazione gratuita'
    : (packageTitle || 'Appuntamento');
  const summary = `${eventTitleBase} - ${booking.name}`;

  const descriptionLines = [
    `Nome: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Telefono: ${booking.phone}` : undefined,
    `Stato: ${booking.status}`,
    `Luogo: ${booking.location || (booking.isFreeConsultation ? 'online' : 'online')}`,
    booking.studioLocation ? `Studio: ${booking.studioLocation}` : undefined,
    booking.notes ? `Note: ${booking.notes}` : undefined,
    booking.id ? `BookingID: ${booking.id}` : undefined,
  ].filter(Boolean) as string[];

  return {
    summary,
    description: descriptionLines.join('\n'),
    start: {
      dateTime: startIso,
      timeZone: CALENDAR_CONFIG.timezone,
    },
    end: {
      dateTime: endIso,
      timeZone: CALENDAR_CONFIG.timezone,
    },
    extendedProperties: booking.id ? { private: { bookingId: booking.id } } : undefined,
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

async function getEventById(calendar: ReturnType<typeof google.calendar>, eventId: string) {
  try {
    const ev = await calendar.events.get({ calendarId: CALENDAR_CONFIG.calendarId, eventId });
    return ev.data;
  } catch (e: any) {
    if (e?.code === 404) return null;
    throw e;
  }
}

async function findEventByBookingId(calendar: ReturnType<typeof google.calendar>, bookingId: string) {
  try {
    const res = await calendar.events.list({
      calendarId: CALENDAR_CONFIG.calendarId,
      privateExtendedProperty: [`bookingId=${bookingId}`],
      singleEvents: true,
      maxResults: 1,
      orderBy: 'startTime'
    });
    const items = res.data.items || [];
    return items.length ? items[0] : null;
  } catch (e) {
    console.error('Error searching event by bookingId', e);
    return null;
  }
}

// POST - Create, update or repair calendar event
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
      return NextResponse.json({ success: true, eventId: event.data.id, message: 'Event created successfully' });
    }

    if (action === 'update') {
      const body = booking ? buildEventFromBooking(booking, packageTitle) : (eventData ?? {});
      try {
        const event = await calendar.events.update({ calendarId: CALENDAR_CONFIG.calendarId, eventId, requestBody: body });
        return NextResponse.json({ success: true, eventId: event.data.id, message: 'Event updated successfully' });
      } catch (e: any) {
        // If event not found, create it instead (self-heal)
        if (e?.code === 404 && booking) {
          const created = await calendar.events.insert({ calendarId: CALENDAR_CONFIG.calendarId, requestBody: body });
          return NextResponse.json({ success: true, eventId: created.data.id, message: 'Event recreated successfully' });
        }
        throw e;
      }
    }

    if (action === 'repair' && booking) {
      // Ensure eventual consistency
      // 1) For confirmed bookings: event must exist and be up-to-date
      // 2) For non-confirmed: event must not exist
      const body = buildEventFromBooking(booking, packageTitle);
      let existing = booking.googleCalendarEventId ? await getEventById(calendar, booking.googleCalendarEventId) : null;
      if (!existing && booking.id) {
        existing = await findEventByBookingId(calendar, booking.id);
      }

      if (booking.status === 'confirmed') {
        if (existing) {
          const updated = await calendar.events.update({ calendarId: CALENDAR_CONFIG.calendarId, eventId: existing.id!, requestBody: body });
          return NextResponse.json({ success: true, eventId: updated.data.id, message: 'Event verified/updated' });
        } else {
          const created = await calendar.events.insert({ calendarId: CALENDAR_CONFIG.calendarId, requestBody: body });
          return NextResponse.json({ success: true, eventId: created.data.id, message: 'Event created during repair' });
        }
      } else {
        // pending/cancelled -> ensure deletion
        if (existing?.id) {
          try { await calendar.events.delete({ calendarId: CALENDAR_CONFIG.calendarId, eventId: existing.id }); } catch (e: any) { if (e?.code !== 404) throw e; }
          return NextResponse.json({ success: true, message: 'Event removed during repair', shouldClearEventId: true });
        }
        return NextResponse.json({ success: true, message: 'No event to remove', shouldClearEventId: !!booking.googleCalendarEventId });
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });

  } catch (error: unknown) {
    console.error('Google Calendar operation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// DELETE - Delete calendar event
export async function DELETE(request: NextRequest) {
  try {
    const { eventId } = await request.json();
    const calendar = getCalendarClient();
    try {
      await calendar.events.delete({ calendarId: CALENDAR_CONFIG.calendarId, eventId });
    } catch (e: any) {
      if (e?.code !== 404) throw e; // already deleted is ok
    }
    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: unknown) {
    console.error('Google Calendar deletion failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// GET - Test connection
export async function GET() {
  try {
    if (!CALENDAR_CONFIG.enabled) {
      return NextResponse.json({ success: false, message: 'Google Calendar integration is disabled' });
    }

    if (!CALENDAR_CONFIG.serviceAccountEmail || (!CALENDAR_CONFIG.privateKey && !CALENDAR_CONFIG.privateKeyB64)) {
      return NextResponse.json({ success: false, message: 'Missing Google Service Account credentials. Please configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY (or GOOGLE_PRIVATE_KEY_B64).' }, { status: 400 });
    }

    const calendar = getCalendarClient();
    const calendarInfo = await calendar.calendars.get({ calendarId: CALENDAR_CONFIG.calendarId });
    const events = await calendar.events.list({ calendarId: CALENDAR_CONFIG.calendarId, maxResults: 1, timeMin: new Date().toISOString() });

    return NextResponse.json({ success: true, message: 'Connection successful', calendarInfo: { id: calendarInfo.data.id, summary: calendarInfo.data.summary, timeZone: calendarInfo.data.timeZone, eventsCount: events.data.items?.length || 0 } });
  } catch (error: unknown) {
    console.error('Google Calendar connection test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
