import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Calendar configuration
const CALENDAR_CONFIG = {
  enabled: true, // Forziamo l'abilitazione per il test
  calendarId: process.env.GCAL_CALENDAR_ID || '9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com',
  timezone: process.env.GCAL_TIMEZONE || 'Europe/Rome',
  serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL || 'zambo-489@gznutrition-d5d13.iam.gserviceaccount.com',
  privateKey: process.env.GOOGLE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCUTLRg38ATseW2\nEIVj4oIHc1EKiwagXrGZfJFUOAEe+7+Y0ziQzS4Az62X0asQ7Z2TiyrD+nOwsUUD\n/m4UZIntYe4oqvaj+5y4ttnyr0YwQP0CUoCi6Xvymj34K2Llk4fieLSJalQzcse2\nx0sjQmTCHz3yilfBQnvj7esAmhywYCkNOV7mV+vtO6dCIkVFNg3szb7cEJZroFLN\nTE2u8a9t1xYKb6qSkrcG/ktUMrTuV4F7RrBrAwMIcJWRcDmCLAGkx26XTdyxG7Ln\n30OZwiUkiPD062Dhl/eq6Qx77MJnuMVxaikERML/ffrRkH309f8+++6n8MRPbOfJ\ng9kbIzutAgMBAAECggEAPN1cXLQIX6zwM/CE5pFUv50PAk476n7i0jVDajbQEvjM\n0nrCKP/k5RVXUEuPs5NqTF9eLm/wonCm/DQk1r7KswAx4EQGlRfT4yW8vrM8Edri\nXF0jCXndUp0GWP/ph4KszwCuTAW1SCZQHE6gInkB5IAxCwXHbXyNX2dKv4UAyEwX\nGHNR8H1FX/4BwqTirR+2JR4wzu+0+psmlHHFyptOPQIAWbrGCzqmQewT2b6ZfBhy\nnUdUFsfYwlA3Hzo+TIRQDNi9Tm4tNf/PIeRYlZlwitlhXgRsBkl732N68nRWc47x\nRUh4b5j+Qv0th8dlpegrXS32bzZPXgFZ7He3RRhcWwKBgQDJHTUNqXAfYVGKcalu\nRGncxa7YuI4m2oR//lYS0JupWjU5GoOlWIRNbG2aMmwtzHWzs3a3jomW0lE3wZuc\naC/5hWdNr3mFQ0DDrEDXAWHoDd7QFgUhy4IByfq3jog4n+F3r7ppIDM6TiV8oVzo\nO/8S0wlZUTsTzkxxBv5Jch5HVwKBgQC8xaBP42KzhHkM6LKeRL6z9uphqW6EKPOS\nW+jZx81aL4RAFbEA/JW/k2BPsTruS/Ieqe6xBDhw2YfZ9wLUuYb1rkBLoOeEpn/E\nz5vBNkq8q10dVMR8r+F9BAOpi1W17ddTC9YA57IEO0aHOv2LZwxV6CUC52AHuvaY\nut0MsK4GmwKBgGa8w+hpwTxWk7gcnkgVLNs6JTrS9NNGV9+mxsOvy4U07vFv6QZj\ndJq0pDzcO0UeKJaXPDNC3misog7QmbTJyJA4JPCbjoGUPJZ4/VqYezJ3O3ajeRWt\nh4lwa+KvLkl261Af9iNT7rd/SkkjiXmdhI1SP3lgNMTGY2huASL16B/bAoGANdNo\nHb9pgmSQm6SyYbyaX/hU5poIQDjpEt+QKqD1JfUMkbVdrjlXfbPJL5AKjK4tEJ9F\nx0W7zjnIqdbsALoSCHWyMZ5kxYcwQW8tK0+OyfNW7qkgCamg8yO046AuRVzXG//w\n+nsWYGyCdMbWSuyMMOarvwM4d5vQ+sW1iAvM42cCgYBacCLf97V3ZCl4xTfmoUlW\nWoYCtbvHCm8g7eVXe/DMThFhmpIfKOdB8euJWXEu0fW0bx6j6Nld2xF6SCBV7JxW\nA05jNVQB0O12hNFrFzKjCgyBTQkey9ZJp52/K9A2HmmB2wQAPkaNtLDFD9Nq0dIU\neT2MCmLPo98SykSgkndxiw==\n-----END PRIVATE KEY-----\n'
};

// Initialize Google Calendar client
function getCalendarClient() {
  if (!CALENDAR_CONFIG.enabled) {
    throw new Error('Google Calendar integration is not enabled');
  }

  const auth = new google.auth.JWT({
    email: CALENDAR_CONFIG.serviceAccountEmail,
    key: CALENDAR_CONFIG.privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  return google.calendar({ version: 'v3', auth });
}

// Convert time slot to start/end times
function slotToTimes(date: string, slot: string): { start: string; end: string } {
  const [hours, minutes] = slot.split(':').map(Number);
  const startDate = new Date(date);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(hours + 1, minutes, 0, 0); // 1 hour duration
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}

// POST - Create or update calendar event
export async function POST(request: NextRequest) {
  try {
    const { action, booking, packageTitle, eventId } = await request.json();

    if (!CALENDAR_CONFIG.enabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Google Calendar integration is disabled' 
      });
    }

    const calendar = getCalendarClient();
    const { start, end } = slotToTimes(booking.date, booking.slot);
    
    const eventTitle = booking.isFreeConsultation 
      ? '🎯 10 Minuti Consultivi Gratuiti'
      : `📋 Consulenza Nutrizionale${packageTitle ? ` - ${packageTitle}` : ''}`;
    
    const eventDescription = [
      `Cliente: ${booking.name}`,
      `Email: ${booking.email}`,
      booking.phone ? `Telefono: ${booking.phone}` : null,
      packageTitle ? `Pacchetto: ${packageTitle}` : null,
      `Status: ${booking.status === 'confirmed' ? 'Confermata' : booking.status === 'pending' ? 'In attesa' : 'Cancellata'}`,
      `Sede: ${booking.location === 'studio' ? (booking.studioLocation || 'Studio fisico') : 'Online'}`,
      booking.notes ? `Note: ${booking.notes}` : null
    ].filter(Boolean).join('\n');

    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: start,
        timeZone: CALENDAR_CONFIG.timezone,
      },
      end: {
        dateTime: end,
        timeZone: CALENDAR_CONFIG.timezone,
      },
      attendees: [
        { email: booking.email, displayName: booking.name },
        { email: 'admin@gznutrition.it', displayName: 'GZnutrition', organizer: true }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ],
      },
      colorId: booking.isFreeConsultation ? '11' : '10', // Different colors for free vs paid
    };

    let response;
    if (action === 'create') {
      response = await calendar.events.insert({
        calendarId: CALENDAR_CONFIG.calendarId,
        requestBody: event,
        sendUpdates: 'all',
      });
      console.log('Google Calendar event created:', response.data.id);
      return NextResponse.json({ 
        success: true, 
        eventId: response.data.id 
      });
    } else if (action === 'update' && eventId) {
      await calendar.events.update({
        calendarId: CALENDAR_CONFIG.calendarId,
        eventId: eventId,
        requestBody: event,
        sendUpdates: 'all',
      });
      console.log('Google Calendar event updated:', eventId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action or missing eventId for update' 
      });
    }
  } catch (error: unknown) {
    console.error('Google Calendar API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Calendar operation failed';
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

    if (!CALENDAR_CONFIG.enabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Google Calendar integration is disabled' 
      });
    }

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Event ID is required' 
      });
    }

    const calendar = getCalendarClient();
    
    await calendar.events.delete({
      calendarId: CALENDAR_CONFIG.calendarId,
      eventId: eventId,
      sendUpdates: 'all',
    });

    console.log('Google Calendar event deleted:', eventId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Google Calendar delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Delete operation failed';
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
    if (!CALENDAR_CONFIG.serviceAccountEmail || !CALENDAR_CONFIG.privateKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Google Service Account credentials. Please configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.'
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
    
    let errorMessage = 'Connection test failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Missing Google Service Account credentials')) {
        errorMessage = error.message;
        statusCode = 400;
      } else if (error.message.includes('invalid_grant') || error.message.includes('unauthorized_client')) {
        errorMessage = 'Invalid Google Service Account credentials. Please check your GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.';
        statusCode = 401;
      } else if (error.message.includes('notFound')) {
        errorMessage = 'Calendar not found. Please check your GCAL_CALENDAR_ID.';
        statusCode = 404;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: statusCode });
  }
}
