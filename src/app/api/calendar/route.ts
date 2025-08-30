import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Calendar configuration from environment variables
const CALENDAR_CONFIG = {
  enabled: process.env.GCAL_ENABLED === 'true',
  calendarId: process.env.GCAL_CALENDAR_ID || '9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com',
  timezone: process.env.GCAL_TIMEZONE || 'Europe/Rome',
  serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY
};

// Initialize Google Calendar client
function getCalendarClient() {
  if (!CALENDAR_CONFIG.enabled) {
    throw new Error('Google Calendar integration is not enabled');
  }

  if (!CALENDAR_CONFIG.serviceAccountEmail || !CALENDAR_CONFIG.privateKey) {
    throw new Error('Missing Google Service Account credentials. Please configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.');
  }

  // Clean and format the private key properly
  let cleanPrivateKey = CALENDAR_CONFIG.privateKey;
  
  // Remove quotes if present
  if (cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) {
    cleanPrivateKey = cleanPrivateKey.slice(1, -1);
  }
  
  // Handle newline characters properly - multiple approaches
  cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
  cleanPrivateKey = cleanPrivateKey.replace(/\\\\n/g, '\n');
  
  // Ensure proper PEM format
  if (!cleanPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format. Must be in PEM format.');
  }

  try {
    const auth = new google.auth.JWT({
      email: CALENDAR_CONFIG.serviceAccountEmail,
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
    const { action, eventData } = await request.json();
    const calendar = getCalendarClient();

    if (action === 'create') {
      const event = await calendar.events.insert({
        calendarId: CALENDAR_CONFIG.calendarId,
        requestBody: eventData
      });

      return NextResponse.json({
        success: true,
        eventId: event.data.id,
        message: 'Event created successfully'
      });
    }

    if (action === 'update') {
      const event = await calendar.events.update({
        calendarId: CALENDAR_CONFIG.calendarId,
        eventId: eventData.id,
        requestBody: eventData
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
    const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}
