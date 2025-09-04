import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configurazione email dal env
const EMAIL_CONFIG = {
  enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
  notificationEmail: process.env.NOTIFICATION_EMAIL // Email del nutrizionista
};

// Crea il transporter
function createTransporter() {
  if (!EMAIL_CONFIG.enabled) {
    throw new Error('Email notifications are not enabled');
  }

  if (!EMAIL_CONFIG.host || !EMAIL_CONFIG.user || !EMAIL_CONFIG.password) {
    throw new Error('Missing email configuration. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.');
  }

  return nodemailer.createTransporter({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.password,
    },
  });
}

// Genera HTML email per nuova prenotazione
function generateBookingNotificationHTML(booking: any, packageTitle?: string) {
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

// POST - Invia notifica email per nuova prenotazione
export async function POST(request: NextRequest) {
  try {
    const { type, booking, packageTitle } = await request.json();
    
    if (type !== 'new-booking') {
      return NextResponse.json({ success: false, message: 'Invalid notification type' }, { status: 400 });
    }

    if (!EMAIL_CONFIG.enabled) {
      console.log('Email notifications disabled, skipping...');
      return NextResponse.json({ success: true, message: 'Email notifications disabled' });
    }

    if (!EMAIL_CONFIG.notificationEmail) {
      console.error('NOTIFICATION_EMAIL not configured');
      return NextResponse.json({ success: false, message: 'Notification email not configured' }, { status: 500 });
    }

    const transporter = createTransporter();
    
    // Verifica configurazione
    await transporter.verify();
    
    const subject = `🔔 Nuova Prenotazione - ${booking.name} (${new Date(booking.date).toLocaleDateString('it-IT')})`;
    const html = generateBookingNotificationHTML(booking, packageTitle);
    
    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.notificationEmail,
      subject: subject,
      html: html,
      text: `Nuova prenotazione ricevuta da ${booking.name} per il ${new Date(booking.date).toLocaleDateString('it-IT')} alle ${booking.slot}. Accedi all'admin panel per gestire la richiesta.`
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`Notification email sent for booking from ${booking.name}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Notification email sent successfully',
      sentTo: EMAIL_CONFIG.notificationEmail 
    });

  } catch (error: unknown) {
    console.error('Failed to send notification email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      message: `Failed to send notification: ${errorMessage}` 
    }, { status: 500 });
  }
}

// GET - Test configurazione email
export async function GET() {
  try {
    if (!EMAIL_CONFIG.enabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email notifications are disabled. Set EMAIL_NOTIFICATIONS_ENABLED=true to enable.' 
      });
    }

    const missingConfig = [];
    if (!EMAIL_CONFIG.host) missingConfig.push('SMTP_HOST');
    if (!EMAIL_CONFIG.user) missingConfig.push('SMTP_USER');
    if (!EMAIL_CONFIG.password) missingConfig.push('SMTP_PASSWORD');
    if (!EMAIL_CONFIG.notificationEmail) missingConfig.push('NOTIFICATION_EMAIL');

    if (missingConfig.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Missing configuration: ${missingConfig.join(', ')}` 
      }, { status: 400 });
    }

    const transporter = createTransporter();
    await transporter.verify();

    return NextResponse.json({ 
      success: true, 
      message: 'Email configuration is valid',
      config: {
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        from: EMAIL_CONFIG.from,
        notificationEmail: EMAIL_CONFIG.notificationEmail,
        enabled: EMAIL_CONFIG.enabled
      }
    });

  } catch (error: unknown) {
    console.error('Email configuration test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Configuration test failed';
    return NextResponse.json({ 
      success: false, 
      message: errorMessage 
    }, { status: 500 });
  }
}
