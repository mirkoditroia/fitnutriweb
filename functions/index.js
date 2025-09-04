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
const nodemailer = require('nodemailer');

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

// Email configuration
function getEmailConfig() {
  // Configurazione email diretta (temporanea per test)
  return {
    enabled: true,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'memirkod95@gmail.com',
    password: 'nlld aigt bwim ixkd',
    from: 'noreply@gznutrition.it',
    notificationEmail: 'mirkoditroia@gmail.com'
  };
}

// Create email transporter
function createEmailTransporter() {
  const emailConfig = getEmailConfig();
  
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });
}

// Generate HTML email for new booking
function generateBookingNotificationHTML(booking, packageTitle) {
  const locationText = booking.location === 'online' ? 'Online' : 
                      booking.studioLocation ? `Studio: ${booking.studioLocation}` : 'In Studio';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuova Prenotazione - GZ Nutrition</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0B5E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
        .info-row { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #0B5E0B; }
        .urgent { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Nuova Prenotazione Ricevuta</h1>
          <p>GZ Nutrition - Sistema di Gestione</p>
        </div>
        
        <div class="content">
          <div class="urgent">
            <strong>⚠️ Azione Richiesta:</strong> Una nuova prenotazione è in attesa di conferma nell'admin panel.
          </div>
          
          <h2>📋 Dettagli Prenotazione</h2>
          
          <div class="info-row">
            <span class="label">👤 Cliente:</span> ${booking.name}
          </div>
          
          <div class="info-row">
            <span class="label">📧 Email:</span> ${booking.email}
          </div>
          
          ${booking.phone ? `
          <div class="info-row">
            <span class="label">📞 Telefono:</span> ${booking.phone}
          </div>
          ` : ''}
          
          <div class="info-row">
            <span class="label">📅 Data:</span> ${new Date(booking.date).toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          <div class="info-row">
            <span class="label">🕐 Orario:</span> ${booking.slot}
          </div>
          
          <div class="info-row">
            <span class="label">📍 Modalità:</span> ${locationText}
          </div>
          
          ${packageTitle ? `
          <div class="info-row">
            <span class="label">📦 Pacchetto:</span> ${packageTitle}
          </div>
          ` : ''}
          
          ${booking.isFreeConsultation ? `
          <div class="info-row" style="background: #e8f5e8;">
            <span class="label">🆓 Tipo:</span> Consultazione Gratuita (10 minuti)
          </div>
          ` : ''}
          
          ${booking.notes ? `
          <div class="info-row">
            <span class="label">📝 Note del cliente:</span><br>
            <em>"${booking.notes}"</em>
          </div>
          ` : ''}
          
          <div class="info-row">
            <span class="label">📊 Stato:</span> <strong style="color: #ffc107;">In Attesa di Conferma</strong>
          </div>
          
          <div style="margin: 25px 0; text-align: center;">
            <p><strong>🎯 Prossimi Passi:</strong></p>
            <p>1. Accedi all'admin panel per confermare o rifiutare la prenotazione</p>
            <p>2. Il cliente verrà automaticamente aggiunto alla lista clienti</p>
            <p>3. Verrà creato l'evento in Google Calendar (se configurato)</p>
          </div>
        </div>
        
        <div class="footer">
          <p>📧 Email automatica dal sistema GZ Nutrition</p>
          <p>🕐 Ricevuta il ${new Date().toLocaleString('it-IT')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send booking notification email
exports.sendBookingNotification = onRequest(async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;
  
  try {
    const { type, booking, packageTitle } = req.body;
    
    if (type !== 'new-booking') {
      return res.status(400).json({ success: false, message: 'Invalid notification type' });
    }

    const emailConfig = getEmailConfig();
    
    if (!emailConfig.enabled) {
      console.log('Email notifications disabled, skipping...');
      return res.json({ success: true, message: 'Email notifications disabled' });
    }

    if (!emailConfig.notificationEmail) {
      console.error('NOTIFICATION_EMAIL not configured');
      return res.status(500).json({ success: false, message: 'Notification email not configured' });
    }

    const transporter = createEmailTransporter();
    
    // Verify configuration
    await transporter.verify();
    
    const subject = `🔔 Nuova Prenotazione - ${booking.name} (${new Date(booking.date).toLocaleDateString('it-IT')})`;
    const html = generateBookingNotificationHTML(booking, packageTitle);
    
    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.notificationEmail,
      subject: subject,
      html: html,
      text: `Nuova prenotazione ricevuta da ${booking.name} per il ${new Date(booking.date).toLocaleDateString('it-IT')} alle ${booking.slot}. Accedi all'admin panel per gestire la richiesta.`
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`Notification email sent for booking from ${booking.name}`);
    res.json({ 
      success: true, 
      message: 'Notification email sent successfully',
      sentTo: emailConfig.notificationEmail 
    });

  } catch (error) {
    console.error('Failed to send notification email:', error);
    const errorMessage = error.message || 'Unknown error';
    res.status(500).json({ 
      success: false, 
      message: `Failed to send notification: ${errorMessage}` 
    });
  }
});

// Test email configuration
exports.testEmailConfiguration = onRequest(async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;
  
  try {
    const emailConfig = getEmailConfig();
    
    if (!emailConfig.enabled) {
      return res.json({ 
        success: false, 
        message: 'Email notifications are not enabled. Set EMAIL_NOTIFICATIONS_ENABLED=true to enable.' 
      });
    }

    const transporter = createEmailTransporter();
    await transporter.verify();

    res.json({ 
      success: true, 
      message: 'Email configuration is valid',
      config: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        from: emailConfig.from,
        notificationEmail: emailConfig.notificationEmail,
        enabled: emailConfig.enabled
      }
    });

  } catch (error) {
    console.error('Email configuration test failed:', error);
    const errorMessage = error.message || 'Configuration test failed';
    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
});
