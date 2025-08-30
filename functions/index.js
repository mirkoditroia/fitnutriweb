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

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Google Calendar API function
exports.testCalendarConnection = onRequest(async (req, res) => {
  try {
    const config = functions.config();
    
    if (!config.gcal || !config.gcal.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar integration is disabled'
      });
    }

    if (!config.google || !config.google.client_email || !config.google.private_key) {
      return res.status(400).json({
        success: false,
        message: 'Missing Google Service Account credentials'
      });
    }

    // Test connection logic would go here
    res.json({
      success: true,
      message: 'Firebase Functions configured correctly',
      config: {
        enabled: config.gcal.enabled,
        calendarId: config.gcal.calendar_id,
        timezone: config.gcal.timezone,
        serviceAccountEmail: config.google.client_email ? 'Present' : 'Missing',
        privateKey: config.google.private_key ? 'Present' : 'Missing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
