"use client";
import { useEffect, useState } from "react";
import { getSiteContent, upsertSiteContent, type SiteContent } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { testCalendarConnection } from "@/lib/googleCalendar";

export default function AdminCalendarPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    calendarInfo?: {
      id: string;
      summary: string;
      timeZone: string;
      eventsCount: number;
    };
  } | null>(null);

  useEffect(() => {
    getSiteContent().then((c) => {
      setContent(c ?? { heroTitle: "", heroSubtitle: "", heroCta: "Prenota ora", heroBackgroundImage: "", images: [], colorPalette: "gz-default" as const });
      setLoading(false);
    });
  }, []);

  if (loading || !content) return <main className="container py-8">Caricamento...</main>;

  const save = async () => {
    await upsertSiteContent(content);
    toast.success("Configurazione calendario salvata");
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testCalendarConnection();
      setConnectionStatus(result);
      if (result.success) {
        toast.success('Connessione Google Calendar riuscita!');
      } else {
        toast.error(`Errore connessione: ${result.message}`);
      }
    } catch {
      toast.error('Errore nel test della connessione');
    } finally {
      setTestingConnection(false);
    }
  };

  const openCalendar = () => {
    const calendarId = content.googleCalendar?.calendarId;
    if (calendarId) {
      window.open(`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`, '_blank');
    }
  };

  const openCalendarSettings = () => {
    const calendarId = content.googleCalendar?.calendarId;
    if (calendarId) {
      window.open(`https://calendar.google.com/calendar/r/settings/${encodeURIComponent(calendarId)}`, '_blank');
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground pt-4 tracking-tight">Gestione Google Calendar</h1>
      
      <div className="admin-surface mt-6 rounded-xl p-6 space-y-8 border border-foreground/10 bg-background/70 backdrop-blur-sm shadow-md">
        
        {/* Status e Test */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg">Stato Connessione</h2>
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${content.googleCalendar?.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {content.googleCalendar?.isEnabled ? 'Integrazione attiva' : 'Integrazione disattivata'}
            </span>
          </div>

          {content.googleCalendar?.isEnabled && (
            <div className="flex gap-2">
              <Button 
                onClick={testConnection}
                disabled={testingConnection}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {testingConnection ? 'Testando...' : 'Test Connessione'}
              </Button>
              
              <Button variant="outline" onClick={openCalendar}>
                Apri Calendario
              </Button>
              
              <Button variant="outline" onClick={openCalendarSettings}>
                Impostazioni Calendario
              </Button>
            </div>
          )}

          {connectionStatus && (
            <div className={`p-4 rounded-lg border ${
              connectionStatus.success 
                ? 'border-green-200 bg-green-50 text-green-800' 
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              <h3 className="font-semibold mb-2">
                {connectionStatus.success ? '✅ Connessione Riuscita' : '❌ Errore Connessione'}
              </h3>
              <p className="text-sm">{connectionStatus.message}</p>
              {connectionStatus.calendarInfo && (
                <div className="mt-3 text-sm">
                  <p><strong>ID Calendario:</strong> {connectionStatus.calendarInfo.id}</p>
                  <p><strong>Nome:</strong> {connectionStatus.calendarInfo.summary}</p>
                  <p><strong>Timezone:</strong> {connectionStatus.calendarInfo.timeZone}</p>
                  <p><strong>Eventi recenti:</strong> {connectionStatus.calendarInfo.eventsCount}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Configurazione */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg">Configurazione</h2>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="calendarEnabled"
              checked={content.googleCalendar?.isEnabled ?? false}
              onChange={(e) => setContent({
                ...content,
                googleCalendar: {
                  ...content.googleCalendar,
                  isEnabled: e.target.checked
                }
              })}
              className="text-primary"
            />
            <label htmlFor="calendarEnabled" className="font-medium">
              Abilita sincronizzazione Google Calendar
            </label>
          </div>

          {content.googleCalendar?.isEnabled && (
            <div className="space-y-4 p-4 border border-border rounded-lg bg-background/50">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 text-sm">⚠️</span>
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Modifica Calendar ID</p>
                    <p>Per cambiare l'ID del calendario, contattare il gestore del sito. La modifica richiede un deploy delle funzioni.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Calendar ID (sola lettura)"
                  value={content.googleCalendar?.calendarId ?? ""}
                  readOnly
                  disabled
                  placeholder="ID del calendario Google"
                  className="bg-gray-100"
                />
                
                <Input
                  label="Timezone"
                  value={content.googleCalendar?.timezone ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    googleCalendar: {
                      ...content.googleCalendar,
                      timezone: e.target.value
                    }
                  })}
                  placeholder="Europe/Rome"
                />
                
                <Input
                  label="Service Account Email"
                  value={content.googleCalendar?.serviceAccountEmail ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    googleCalendar: {
                      ...content.googleCalendar,
                      serviceAccountEmail: e.target.value
                    }
                  })}
                  placeholder="email@project.iam.gserviceaccount.com"
                />
              </div>
            </div>
          )}
        </section>

        {/* Informazioni e Help */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg">Informazioni</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-blue-600">✅ Funzionalità Attive</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Sincronizzazione automatica prenotazioni</li>
                <li>• Creazione eventi per consultazioni</li>
                <li>• Promemoria automatici (24h + 30min)</li>
                <li>• Colori diversi per tipo evento</li>
                <li>• Invio email ai partecipanti</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-orange-600">⚠️ Requisiti</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Service Account Google attivo</li>
                <li>• Calendario condiviso correttamente</li>
                <li>• Permessi di scrittura sul calendario</li>
                <li>• Variabili ambiente configurate</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">🔧 Variabili Ambiente</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><code>GCAL_ENABLED=true</code> - Abilita l'integrazione</p>
              <p><code>GCAL_CALENDAR_ID</code> - ID del calendario (opzionale)</p>
              <p><code>GCAL_TIMEZONE</code> - Timezone (opzionale)</p>
              <p><code>GOOGLE_CLIENT_EMAIL</code> - Email service account</p>
              <p><code>GOOGLE_PRIVATE_KEY</code> - Chiave privata service account</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button onClick={save} className="bg-green-600 hover:bg-green-700">
            Salva Configurazione
          </Button>
        </div>
      </div>
    </>
  );
}
