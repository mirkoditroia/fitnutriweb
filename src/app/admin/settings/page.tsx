"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { getSiteContent, upsertSiteContent } from "@/lib/datasource";
import { refreshDebugCache } from "@/lib/debugUtils";
import type { SiteContent } from "@/lib/data";

export default function AdminSettingsPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica contenuti
  useEffect(() => {
    const loadContent = async () => {
      try {
        const c = await getSiteContent();
        setContent(c);
      } catch (error) {
        console.error("Error loading content:", error);
        toast.error("Errore nel caricamento delle impostazioni");
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  // Salva le impostazioni
  const handleSave = async () => {
    if (!content) return;
    
    setSaving(true);
    try {
      await upsertSiteContent(content);
      
      // Forza il refresh della cache dei log di debug
      refreshDebugCache();
      
      toast.success("Impostazioni salvate con successo!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Errore nel salvare le impostazioni");
    } finally {
      setSaving(false);
    }
  };

  // Test email configuration
  const testEmailConfiguration = async () => {
    try {
      const response = await fetch('https://testemailconfiguration-4ks3j6nupa-uc.a.run.app');
      const result = await response.json();
      
      if (result.success) {
        toast.success("✅ Configurazione email valida!");
      } else {
        toast.error(`❌ Errore configurazione: ${result.message}`);
      }
    } catch (error) {
      console.error("Error testing email:", error);
      toast.error("Errore nel test email");
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!content?.notificationEmail) {
      toast.error("Inserisci prima l'email di notifica");
      return;
    }

    try {
      const response = await fetch('https://sendbookingnotification-4ks3j6nupa-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new-booking',
          booking: {
            id: 'test-123',
            name: 'Cliente Test',
            email: 'cliente.test@example.com',
            phone: '+39 123 456 7890',
            date: new Date().toISOString(),
            slot: '10:00',
            location: 'online',
            status: 'pending',
            isFreeConsultation: false,
            notes: 'Questa è una prenotazione di test per verificare il sistema di notifiche email.'
          },
          packageTitle: 'Pacchetto Test',
          notificationEmail: content.notificationEmail,
          businessName: content.businessName,
          colorPalette: content.colorPalette
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`📧 Email di test inviata a: ${content.notificationEmail}`);
      } else {
        toast.error(`❌ Errore invio: ${result.message}`);
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Errore nell'invio dell'email di test");
    }
  };

  if (loading) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold text-black">Impostazioni Avanzate</h1>
        <p className="mt-4 text-black/70">Caricamento...</p>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold text-black">Impostazioni Avanzate</h1>
        <p className="mt-4 text-red-600">Errore nel caricamento delle impostazioni</p>
      </main>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-black pt-4 tracking-tight">Impostazioni Avanzate</h1>
      
      <div className="admin-surface mt-6 rounded-xl p-6 space-y-8 border border-foreground/10 bg-background/70 backdrop-blur-sm shadow-md">
        
        {/* Email Notifications */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg text-black">📧 Notifiche Email</h2>
          <p className="text-sm text-black/70">
            Configura l'email dove ricevere le notifiche delle nuove prenotazioni.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Nome Studio/Nutrizionista
              </label>
              <Input
                value={content.businessName || ""}
                onChange={(e) => setContent({...content, businessName: e.target.value})}
                placeholder="GZ Nutrition"
                className="max-w-md"
              />
              <p className="text-xs text-black/60 mt-1">
                Nome che apparirà nelle email di notifica e in altre comunicazioni
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email Nutrizionista
              </label>
              <Input
                type="email"
                value={content.notificationEmail || ""}
                onChange={(e) => setContent({...content, notificationEmail: e.target.value})}
                placeholder="nutrizionista@example.com"
                className="max-w-md"
              />
              <p className="text-xs text-black/60 mt-1">
                Indirizzo email dove ricevere le notifiche delle nuove prenotazioni
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={testEmailConfiguration}
                variant="outline"
                size="sm"
              >
                🧪 Testa Configurazione
              </Button>
              
              <Button 
                onClick={sendTestEmail}
                variant="outline"
                size="sm"
                disabled={!content.notificationEmail}
              >
                📧 Invia Email Test
              </Button>
            </div>
          </div>
        </section>

        {/* CAPTCHA */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg text-black">🔒 Sicurezza CAPTCHA</h2>
          <p className="text-sm text-black/70">
            Proteggi il form di prenotazione da spam e bot con Google reCAPTCHA.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={content.recaptchaEnabled === true}
                onChange={(e) => setContent({...content, recaptchaEnabled: e.target.checked})}
                className="rounded border-border"
              />
              <label className="text-sm font-medium text-black">
                Abilita verifica CAPTCHA per le prenotazioni
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Site Key reCAPTCHA v2
              </label>
              <Input
                value={content.recaptchaSiteKey || ""}
                onChange={(e) => setContent({...content, recaptchaSiteKey: e.target.value})}
                placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                className="max-w-md font-mono text-xs"
              />
              <p className="text-xs text-black/60 mt-1">
                Ottieni la Site Key da <a href="https://www.google.com/recaptcha/admin" target="_blank" className="text-blue-600 hover:underline">Google reCAPTCHA Console</a>
              </p>
            </div>
          </div>
        </section>

        {/* Google Calendar Integration */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg text-black">📅 Integrazione Google Calendar</h2>
          <p className="text-sm text-black/70">
            Configura l'integrazione con Google Calendar per sincronizzare automaticamente le prenotazioni.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="calendarEnabled"
                checked={content.googleCalendar?.isEnabled || false}
                onChange={(e) => setContent({
                  ...content,
                  googleCalendar: {
                    ...content.googleCalendar,
                    isEnabled: e.target.checked
                  }
                })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="calendarEnabled" className="text-sm font-medium text-black">
                Abilita sincronizzazione Google Calendar
              </label>
            </div>

            {content.googleCalendar?.isEnabled && (
              <div className="pl-7 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Calendar ID
                  </label>
                  <Input
                    value={content.googleCalendar?.calendarId || ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleCalendar: {
                        ...content.googleCalendar,
                        calendarId: e.target.value
                      }
                    })}
                    placeholder="calendario@group.calendar.google.com"
                    className="max-w-md"
                  />
                  <p className="text-xs text-black/60 mt-1">
                    ID del calendario Google dove creare gli eventi
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Timezone
                  </label>
                  <Input
                    value={content.googleCalendar?.timezone || "Europe/Rome"}
                    onChange={(e) => setContent({
                      ...content,
                      googleCalendar: {
                        ...content.googleCalendar,
                        timezone: e.target.value
                      }
                    })}
                    placeholder="Europe/Rome"
                    className="max-w-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Service Account Email
                  </label>
                  <Input
                    value={content.googleCalendar?.serviceAccountEmail || ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleCalendar: {
                        ...content.googleCalendar,
                        serviceAccountEmail: e.target.value
                      }
                    })}
                    placeholder="service-account@project.iam.gserviceaccount.com"
                    className="max-w-md"
                  />
                  <p className="text-xs text-black/60 mt-1">
                    Email del service account Google per l'autenticazione
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Debug Settings */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg text-black">🐛 Impostazioni Debug</h2>
          <p className="text-sm text-black/70">
            Controlla la visualizzazione dei log di debug nella console del browser.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={content.debugLogsEnabled !== false}
                onChange={(e) => setContent({...content, debugLogsEnabled: e.target.checked})}
                className="rounded border-border"
              />
              <label className="text-sm font-medium text-black">
                Abilita log di debug in console
              </label>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Info:</strong> I log di debug mostrano informazioni dettagliate sul funzionamento del sistema.
                Disabilita questa opzione in produzione per migliorare le performance e ridurre il rumore nella console.
              </p>
            </div>
            
            {content.debugLogsEnabled !== false && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ I log di debug sono attualmente <strong>abilitati</strong>. 
                  Ricorda di disabilitarli in produzione.
                </p>
              </div>
            )}
          </div>
        </section>


        {/* Salva */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? "Salvando..." : "💾 Salva Impostazioni"}
          </Button>
        </div>
      </div>
    </>
  );
}
