import { NextResponse } from "next/server";
import { Booking } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { 
      booking, 
      packageTitle, 
      businessName, 
      colorPalette,
      customMessage,
      siteContent 
    } = await req.json();

    console.log("📧 API Email Cliente chiamata per:", booking.email);

    // ✅ Usa Nodemailer per invio email (più semplice, senza dipendenze esterne)
    const nodemailer = await import('nodemailer');

    // ✅ Configurazione SMTP (usa credenziali Firebase Functions)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true per 465, false per altri porti
      auth: {
        user: process.env.SMTP_USER || 'fitnutriweb@gmail.com',
        pass: process.env.SMTP_PASS || 'luvuupdxynysdgxu', // Password Gmail da Firebase
      },
    });

    // ✅ Template HTML personalizzato per il cliente
    const clientEmailHtml = generateClientEmailTemplate({
      booking,
      packageTitle,
      businessName,
      colorPalette,
      customMessage,
      siteContent
    });

    const emailData = {
      from: `"${businessName || 'GZ Nutrition'}" <${process.env.SMTP_USER || siteContent?.contactEmail || 'noreply@gmail.com'}>`,
      to: booking.email,
      subject: `✅ Conferma Prenotazione - ${businessName || 'GZ Nutrition'}`,
      html: clientEmailHtml,
    };

    console.log("📤 Inviando email cliente via Nodemailer...");
    
    // ✅ Invio email reale con credenziali Firebase
    const result = await transporter.sendMail(emailData);

    if (result.messageId) {
      console.log("✅ Email cliente inviata con successo:", result.messageId);
      return NextResponse.json({ 
        success: true, 
        sentTo: booking.email,
        emailId: result.messageId 
      });
    } else {
      console.error("❌ Nodemailer error - no messageId");
      return NextResponse.json({ 
        success: false, 
        message: 'Email sending failed - no messageId returned' 
      });
    }

  } catch (error) {
    console.error("❌ Errore API email cliente:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ Template HTML elegante per email cliente
function generateClientEmailTemplate({
  booking,
  packageTitle,
  businessName,
  colorPalette,
  customMessage,
  siteContent
}: {
  booking: Booking;
  packageTitle?: string;
  businessName?: string;
  colorPalette?: string;
  customMessage?: string;
  siteContent?: any;
}) {
  const colors = getColorsFromPalette(colorPalette || 'gz-default');
  const formattedDate = new Date(booking.date).toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma Prenotazione</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                ✅ Prenotazione Confermata!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                ${businessName || 'GZ Nutrition'}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333; margin-top: 0; font-size: 22px;">
                Ciao ${booking.name}! 👋
              </h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                ${customMessage || 'Grazie per aver prenotato con noi! La tua prenotazione è stata confermata e sarai ricontattato al più presto per ulteriori dettagli.'}
              </p>
              
              <!-- Booking Details -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid ${colors.primary};">
                <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">
                  📋 Dettagli della Prenotazione
                </h3>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: ${colors.primary};">📅 Data:</strong>
                  <span style="color: #333; margin-left: 10px;">${formattedDate}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: ${colors.primary};">🕐 Orario:</strong>
                  <span style="color: #333; margin-left: 10px;">${booking.slot}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: ${colors.primary};">💼 Servizio:</strong>
                  <span style="color: #333; margin-left: 10px;">${packageTitle || 'Consultazione'}</span>
                </div>
                
                ${booking.location ? `
                <div style="margin-bottom: 12px;">
                  <strong style="color: ${colors.primary};">📍 Modalità:</strong>
                  <span style="color: #333; margin-left: 10px;">${booking.location === 'online' ? '💻 Online' : '🏢 In Studio'}</span>
                </div>
                ` : ''}
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #e8f4fd; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #0066cc; margin-top: 0; font-size: 16px; margin-bottom: 10px;">
                  🔄 Prossimi Passi
                </h3>
                <p style="color: #004499; margin: 0; font-size: 14px; line-height: 1.5;">
                  Ti contatteremo entro le prossime 24 ore per confermare i dettagli finali e fornirti tutte le informazioni necessarie per il tuo appuntamento.
                </p>
              </div>
              
              <!-- Contact Info -->
              ${generateContactSection(siteContent, colors)}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                Questa email è stata generata automaticamente. Per qualsiasi domanda, contattaci usando i recapiti sopra.
              </p>
              <p style="color: #999; margin: 10px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} ${businessName || 'GZ Nutrition'}. Tutti i diritti riservati.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ✅ Sezione contatti dinamica
function generateContactSection(siteContent: any, colors: any) {
  if (!siteContent?.contactPhone && !siteContent?.contactEmail) {
    return '';
  }

  return `
    <div style="border-top: 2px solid ${colors.primary}; padding-top: 25px; margin-top: 30px;">
      <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">
        📞 I Nostri Contatti
      </h3>
      
      ${siteContent.contactPhone ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: ${colors.primary};">📱 Telefono:</strong>
          <a href="tel:${siteContent.contactPhone}" style="color: #333; text-decoration: none; margin-left: 10px;">
            ${siteContent.contactPhone}
          </a>
        </div>
      ` : ''}
      
      ${siteContent.contactEmail ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: ${colors.primary};">📧 Email:</strong>
          <a href="mailto:${siteContent.contactEmail}" style="color: #333; text-decoration: none; margin-left: 10px;">
            ${siteContent.contactEmail}
          </a>
        </div>
      ` : ''}
      
      ${siteContent.contactAddresses && siteContent.contactAddresses.length > 0 ? `
        <div style="margin-top: 15px;">
          <strong style="color: ${colors.primary};">📍 I Nostri Studi:</strong>
          ${siteContent.contactAddresses.map((addr: any) => `
            <div style="margin-left: 10px; margin-top: 5px; color: #333;">
              ${addr.name} - ${addr.address}, ${addr.city} ${addr.postalCode}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// ✅ Colori della palette
function getColorsFromPalette(palette: string) {
  const palettes: Record<string, { primary: string; secondary: string }> = {
    'gz-default': { primary: '#22c55e', secondary: '#16a34a' },
    'modern-blue': { primary: '#3b82f6', secondary: '#1d4ed8' },
    'elegant-dark': { primary: '#6366f1', secondary: '#4338ca' },
    'nature-green': { primary: '#059669', secondary: '#047857' },
    'warm-orange': { primary: '#ea580c', secondary: '#c2410c' },
    'professional-gray': { primary: '#6b7280', secondary: '#4b5563' }
  };
  
  return palettes[palette] || palettes['gz-default'];
}
