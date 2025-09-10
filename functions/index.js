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
const { defineSecret } = require('firebase-functions/params');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Define secrets for secure email configuration
const smtpPassword = defineSecret('SMTP_PASSWORD');
const recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY');

// Define secrets for Google Calendar configuration
const googleClientEmail = defineSecret('GOOGLE_CLIENT_EMAIL');
const googlePrivateKey = defineSecret('GOOGLE_PRIVATE_KEY');

// Palette configurations for dynamic email styling
const PALETTES = {
  'gz-default': {
    primary: '#0B5E0B',
    accent: '#00D084',
    background: '#FFFFFF',
    foreground: '#0E0F12',
    border: '#E2E8F0',
    card: '#FFFFFF',
    muted: '#F1F5F9'
  },
  'modern-blue': {
    primary: '#2563EB',
    accent: '#3B82F6',
    background: '#FFFFFF',
    foreground: '#1E293B',
    border: '#E2E8F0',
    card: '#FFFFFF',
    muted: '#F1F5F9'
  },
  'elegant-dark': {
    primary: '#D97706',
    accent: '#F59E0B',
    background: '#FFFFFF',
    foreground: '#1F2937',
    border: '#E5E7EB',
    card: '#FFFFFF',
    muted: '#F9FAFB'
  },
  'nature-green': {
    primary: '#059669',
    accent: '#10B981',
    background: '#FFFFFF',
    foreground: '#1F2937',
    border: '#D1FAE5',
    card: '#FFFFFF',
    muted: '#F0FDF4'
  },
  'warm-orange': {
    primary: '#EA580C',
    accent: '#FB923C',
    background: '#FFFFFF',
    foreground: '#1C1917',
    border: '#E7E5E4',
    card: '#FFFFFF',
    muted: '#FAFAF9'
  },
  'professional-gray': {
    primary: '#374151',
    accent: '#6B7280',
    background: '#FFFFFF',
    foreground: '#111827',
    border: '#E5E7EB',
    card: '#FFFFFF',
    muted: '#F9FAFB'
  }
};

function getPaletteColors(paletteId) {
  return PALETTES[paletteId] || PALETTES['gz-default'];
}

// Sanitize error messages to prevent leaking sensitive data
function sanitizeError(error) {
  const sensitivePatterns = [
    /password[^a-zA-Z0-9]*[:\s]*[^\s,;}]*/gi,
    /smtp_password[^a-zA-Z0-9]*[:\s]*[^\s,;}]*/gi,
    /auth[^a-zA-Z0-9]*[:\s]*[^\s,;}]*/gi,
    /credential[^a-zA-Z0-9]*[:\s]*[^\s,;}]*/gi,
    /secret[^a-zA-Z0-9]*[:\s]*[^\s,;}]*/gi
  ];
  
  let sanitized = error.toString();
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}

setGlobalOptions({ 
  maxInstances: 10,
  logLevel: 'WARN' // Reduce logging to prevent sensitive data leaks
});

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

// Google Calendar configuration - Firebase Functions v2 with Secrets
function getCalendarConfig() {
  // Enable Google Calendar by default for Firebase
  const enabled = process.env.GCAL_ENABLED !== 'false';
  if (!enabled) {
    throw new Error('Google Calendar integration is disabled');
  }
  
  // Get credentials from Firebase Secrets (automatically available as environment variables)
  const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  // Check for required credentials
  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google Service Account credentials from Firebase Secrets');
  }

  return {
    calendarId: process.env.GCAL_CALENDAR_ID || '9765caa0fca592efb3eac96010b3f8f770050fad09fe7b379f16aacdc89fa689@group.calendar.google.com',
    timezone: process.env.GCAL_TIMEZONE || 'Europe/Rome',
    serviceAccountEmail: serviceAccountEmail,
    privateKey: privateKey
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
exports.testCalendarConnection = onRequest({ 
  cors: { origin: true },
  invoker: 'public',
  secrets: [googleClientEmail, googlePrivateKey],
  timeoutSeconds: 60  // Timeout di 1 minuto per test connessione
}, async (req, res) => {
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
exports.calendarOperations = onRequest({ 
  cors: { origin: true },
  invoker: 'public',
  secrets: [googleClientEmail, googlePrivateKey],
  timeoutSeconds: 120  // Aumenta timeout a 2 minuti
}, async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;
  
  try {
    const { action, eventData, eventId } = req.body;
    
    // Rispondi immediatamente al frontend per evitare timeout
    res.json({
      success: true,
      message: `Calendar operation ${action} started`,
      eventId: eventId || 'pending'
    });
    
    // Esegui l'operazione Google Calendar in background (non blocca la risposta)
    try {
      const calendar = getCalendarClient();
      const config = getCalendarConfig();
      
      if (action === 'create') {
        const event = await calendar.events.insert({
          calendarId: config.calendarId,
          requestBody: eventData
        });
        console.log(`✅ Calendar event created successfully: ${event.data.id}`);
      } else if (action === 'update') {
        const event = await calendar.events.update({
          calendarId: config.calendarId,
          eventId: eventId,
          requestBody: eventData
        });
        console.log(`✅ Calendar event updated successfully: ${event.data.id}`);
      } else if (action === 'delete') {
        await calendar.events.delete({
          calendarId: config.calendarId,
          eventId: eventId
        });
        console.log(`✅ Calendar event deleted successfully: ${eventId}`);
      } else {
        console.error(`❌ Invalid calendar action: ${action}`);
      }
    } catch (calendarError) {
      console.error(`❌ Calendar operation ${action} failed:`, calendarError);
      // Non rilanciare l'errore - l'operazione è già asincrona
    }
  } catch (error) {
    console.error('Google Calendar operation failed:', error);
    // Se la risposta non è ancora stata inviata
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
});

// Email configuration using secure secrets and environment variables
function getEmailConfig(customNotificationEmail) {
  // Use secure secrets and environment variables
  const enabled = process.env.EMAIL_NOTIFICATIONS_ENABLED || 'true';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || false;
  const user = process.env.SMTP_USER || 'fitnutriweb@gmail.com';
  const password = smtpPassword.value(); // Use secure secret
  const from = process.env.SMTP_FROM || 'noreply@gznutrition.it';
  // Use custom notification email from request, fallback to env var, then default
  const notificationEmail = customNotificationEmail || process.env.NOTIFICATION_EMAIL || 'mirkoditroia@gmail.com';
  
  if (!password) {
    throw new Error('SMTP_PASSWORD secret is required - please configure Firebase Secret');
  }

  return {
    enabled: enabled === 'true',
    host: host,
    port: port,
    secure: secure,
    user: user,
    password: password,
    from: from,
    notificationEmail: notificationEmail
  };
}

// Create email transporter
function createEmailTransporter(customNotificationEmail) {
  const emailConfig = getEmailConfig(customNotificationEmail);
  
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
function generateBookingNotificationHTML(booking, packageTitle, businessName, colorPalette) {
  const locationText = booking.location === 'online' ? 'Online' : 
                      booking.studioLocation ? `Studio: ${booking.studioLocation}` : 'In Studio';
  
  // Get palette colors
  const colors = getPaletteColors(colorPalette || 'gz-default');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuova Prenotazione - ${businessName || 'GZ Nutrition'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: ${colors.foreground}; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${colors.primary}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: ${colors.muted}; padding: 20px; border: 1px solid ${colors.border}; }
        .footer { background: ${colors.primary}; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
        .info-row { margin: 10px 0; padding: 8px; background: ${colors.background}; border-radius: 4px; border: 1px solid ${colors.border}; }
        .label { font-weight: bold; color: ${colors.primary}; }
        .urgent { background: ${colors.card}; border-left: 4px solid ${colors.accent}; padding: 10px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Nuova Prenotazione Ricevuta</h1>
          <p>${businessName || 'GZ Nutrition'} - Sistema di Gestione</p>
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
          <p>📧 Email automatica dal sistema ${businessName || 'GZ Nutrition'}</p>
          <p>🕐 Ricevuta il ${new Date().toLocaleString('it-IT')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send booking notification email
exports.sendBookingNotification = onRequest({ secrets: [smtpPassword] }, async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;
  
  try {
    const { type, booking, packageTitle, notificationEmail, businessName, colorPalette } = req.body;
    
    if (type !== 'new-booking') {
      return res.status(400).json({ success: false, message: 'Invalid notification type' });
    }

    const emailConfig = getEmailConfig(notificationEmail);
    
    if (!emailConfig.enabled) {
      console.log('Email notifications disabled, skipping...');
      return res.json({ success: true, message: 'Email notifications disabled' });
    }

    if (!emailConfig.notificationEmail) {
      console.error('NOTIFICATION_EMAIL not configured');
      return res.status(500).json({ success: false, message: 'Notification email not configured' });
    }

    const transporter = createEmailTransporter(notificationEmail);
    
    // Verify configuration
    await transporter.verify();
    
    const subject = `🔔 Nuova Prenotazione - ${booking.name} (${new Date(booking.date).toLocaleDateString('it-IT')})`;
    const html = generateBookingNotificationHTML(booking, packageTitle, businessName, colorPalette);
    
    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.notificationEmail,
      subject: subject,
      html: html,
      text: `Nuova prenotazione ricevuta da ${booking.name} per il ${new Date(booking.date).toLocaleDateString('it-IT')} alle ${booking.slot}. Accedi all'admin panel per gestire la richiesta.`
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`Notification email sent successfully`);
    res.json({ 
      success: true, 
      message: 'Notification email sent successfully',
      sentTo: emailConfig.notificationEmail 
    });

  } catch (error) {
    console.error('Failed to send notification email:', sanitizeError(error));
    const errorMessage = sanitizeError(error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to send notification: ${errorMessage}` 
    });
  }
});

// Test email configuration
exports.testEmailConfiguration = onRequest({ secrets: [smtpPassword] }, async (req, res) => {
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
    console.error('Email configuration test failed:', sanitizeError(error));
    const errorMessage = sanitizeError(error);
    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
});

// Verify reCAPTCHA token
exports.verifyCaptcha = onRequest({ secrets: [recaptchaSecretKey] }, async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token CAPTCHA mancante' 
      });
    }

    const secretKey = recaptchaSecretKey.value();
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return res.status(500).json({ 
        success: false, 
        message: 'Configurazione CAPTCHA mancante' 
      });
    }

    // Verify token with Google reCAPTCHA API
    const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });

    const verifyData = await verifyResponse.json();
    
    console.log('reCAPTCHA verification result:', { 
      success: verifyData.success,
      hostname: verifyData.hostname,
      score: verifyData.score || 'N/A'
    });

    if (!verifyData.success) {
      console.warn('reCAPTCHA verification failed:', verifyData['error-codes']);
      return res.json({ 
        success: false, 
        message: 'Verifica CAPTCHA fallita',
        errors: verifyData['error-codes']
      });
    }

    // For reCAPTCHA v2, just check success
    // For reCAPTCHA v3, you could also check the score
    return res.json({ 
      success: true, 
      message: 'CAPTCHA verificato con successo',
      hostname: verifyData.hostname 
    });

  } catch (error) {
    console.error('CAPTCHA verification error:', sanitizeError(error));
    return res.status(500).json({ 
      success: false, 
      message: 'Errore interno durante la verifica CAPTCHA',
      error: sanitizeError(error)
    });
  }
});
