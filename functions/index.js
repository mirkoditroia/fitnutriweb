/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// CORS helper function
function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Handle preflight requests
function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(204).send('');
    return true;
  }
  setCorsHeaders(res);
  return false;
}

// Google Calendar configuration
function getCalendarConfig() {
  const config = functions.config();
  
  if (!config.gcal || !config.gcal.enabled) {
    throw new Error('Google Calendar integration is disabled');
  }
  
  if (!config.google || !config.google.client_email || !config.google.private_key) {
    throw new Error('Missing Google Service Account credentials');
  }

  return {
    calendarId: config.gcal.calendar_id,
    timezone: config.gcal.timezone,
    serviceAccountEmail: config.google.client_email,
    privateKey: config.google.private_key
  };
}

// Get Google Calendar client
function getCalendarClient() {
  const config = getCalendarConfig();
  
  let cleanPrivateKey = config.privateKey;
  
  // Fix for DECODER routines::unsupported error
  // Based on Stack Overflow solution: https://stackoverflow.com/questions/74131595/error-error1e08010cdecoder-routinesunsupported-with-google-auth-library
  
  // Remove quotes if present
  if (cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) {
    cleanPrivateKey = cleanPrivateKey.slice(1, -1);
  }
  
  // Replace \\n with \n (double backslash to single)
  cleanPrivateKey = cleanPrivateKey.replace(/\\\\n/g, '\n');
  
  // Replace \n with actual newlines
  cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
  
  // Alternative method: split and join
  if (cleanPrivateKey.includes('\\n')) {
    cleanPrivateKey = cleanPrivateKey.split(String.raw`\n`).join('\n');
  }

  if (!cleanPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format. Must be in PEM format.');
  }

  try {
    const auth = new google.auth.JWT({
      email: config.serviceAccountEmail,
      key: cleanPrivateKey,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error('Error creating JWT auth:', error);
    throw new Error(`Failed to create Google Calendar authentication: ${error.message}`);
  }
}

// Test Google Calendar connection
exports.testCalendarConnection = onRequest(async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;
  
  try {
    const config = getCalendarConfig();
    const calendar = getCalendarClient();
    
    const calendarInfo = await calendar.calendars.get({
      calendarId: config.calendarId
    });
    
    const events = await calendar.events.list({
      calendarId: config.calendarId,
      maxResults: 1,
      timeMin: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Connection successful',
      calendarInfo: {
        id: calendarInfo.data.id,
        summary: calendarInfo.data.summary,
        timeZone: calendarInfo.data.timeZone,
        eventsCount: events.data.items?.length || 0
      }
    });
  } catch (error) {
    console.error('Google Calendar connection test failed:', error);
    let errorMessage = 'Connection test failed';
    let statusCode = 500;

    if (error.message.includes('Google Calendar integration is disabled')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('Missing Google Service Account credentials')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('invalid_grant') || error.message.includes('unauthorized_client')) {
      errorMessage = 'Invalid Google Service Account credentials';
      statusCode = 401;
    } else if (error.message.includes('Calendar not found')) {
      errorMessage = 'Calendar not found. Please check your calendar ID.';
      statusCode = 404;
    } else {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});

// Google Calendar operations (create, update, delete)
exports.calendarOperations = onRequest(async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;
  
  try {
    const { action, eventData, eventId } = req.body;
    const calendar = getCalendarClient();
    const config = getCalendarConfig();

    if (action === 'create') {
      const event = await calendar.events.insert({
        calendarId: config.calendarId,
        requestBody: eventData
      });
      
      res.json({
        success: true,
        eventId: event.data.id,
        message: 'Event created successfully'
      });
    } else if (action === 'update') {
      const event = await calendar.events.update({
        calendarId: config.calendarId,
        eventId: eventId,
        requestBody: eventData
      });
      
      res.json({
        success: true,
        eventId: event.data.id,
        message: 'Event updated successfully'
      });
    } else if (action === 'delete') {
      await calendar.events.delete({
        calendarId: config.calendarId,
        eventId: eventId
      });
      
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action specified'
      });
    }
  } catch (error) {
    console.error('Google Calendar operation failed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
