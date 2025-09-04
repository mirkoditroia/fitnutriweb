"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

type EmailConfig = {
  success: boolean;
  message: string;
  config?: {
    host: string;
    port: number;
    secure: boolean;
    from: string;
    notificationEmail: string;
    enabled: boolean;
  };
};

export default function AdminNotificationsPage() {
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  // Carica configurazione email
  const loadEmailConfig = async () => {
    try {
      const response = await fetch('https://testemailconfiguration-4ks3j6nupa-uc.a.run.app');
      const result = await response.json();
      setEmailConfig(result);
    } catch (error) {
      console.error("Error loading email config:", error);
      toast.error("Errore nel caricamento della configurazione email");
    } finally {
      setLoading(false);
    }
  };

  // Test email
  const testEmailConfiguration = async () => {
    setTesting(true);
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
          packageTitle: 'Pacchetto Test'
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Email di test inviata con successo a: ${result.sentTo}`);
      } else {
        toast.error(`Errore nell'invio dell'email di test: ${result.message}`);
      }
    } catch (error) {
      console.error("Error testing email:", error);
      toast.error("Errore nel test dell'email");
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    loadEmailConfig();
  }, []);

  if (loading) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold text-black">Gestione Notifiche Email</h1>
        <p className="mt-4 text-black/70">Caricamento...</p>
      </main>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-black pt-4 tracking-tight">Gestione Notifiche Email</h1>
      
      <div className="admin-surface mt-6 rounded-xl p-6 space-y-8 border border-foreground/10 bg-background/70 backdrop-blur-sm shadow-md">
        
        {/* Stato Configurazione */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg text-black">Stato Configurazione</h2>
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${emailConfig?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium text-black">
              {emailConfig?.success ? 'Configurazione email valida' : 'Configurazione email non valida'}
            </span>
          </div>

          {emailConfig?.message && (
            <div className={`p-4 rounded-lg border ${
              emailConfig.success 
                ? 'border-green-200 bg-green-50 text-green-800' 
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">{emailConfig.message}</p>
            </div>
          )}

          {emailConfig?.config && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-black">Host SMTP:</span>
                <p className="text-sm text-black/70">{emailConfig.config.host}</p>
              </div>
              <div>
                <span className="font-medium text-black">Porta:</span>
                <p className="text-sm text-black/70">{emailConfig.config.port} {emailConfig.config.secure ? '(SSL)' : ''}</p>
              </div>
              <div>
                <span className="font-medium text-black">Email mittente:</span>
                <p className="text-sm text-black/70">{emailConfig.config.from}</p>
              </div>
              <div>
                <span className="font-medium text-black">Email nutrizionista:</span>
                <p className="text-sm text-black/70">{emailConfig.config.notificationEmail}</p>
              </div>
            </div>
          )}
        </section>

        {/* Test Email */}
        {emailConfig?.success && (
          <section className="space-y-4">
            <h2 className="font-semibold text-lg text-black">Test Sistema</h2>
            <p className="text-sm text-black/70">
              Invia un'email di test per verificare che il sistema di notifiche funzioni correttamente.
            </p>
            
            <Button 
              onClick={testEmailConfiguration}
              disabled={testing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {testing ? 'Inviando email di test...' : '📧 Invia Email di Test'}
            </Button>
          </section>
        )}

        {/* Configurazione Variabili Ambiente */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg text-black">Configurazione Richiesta</h2>
          <p className="text-sm text-black/70">
            Per abilitare le notifiche email, configura le seguenti variabili d'ambiente:
          </p>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="space-y-1">
              <div># Abilita notifiche email</div>
              <div>EMAIL_NOTIFICATIONS_ENABLED=true</div>
              <div></div>
              <div># Configurazione SMTP</div>
              <div>SMTP_HOST=smtp.gmail.com</div>
              <div>SMTP_PORT=587</div>
              <div>SMTP_SECURE=false</div>
              <div>SMTP_USER=tua-email@gmail.com</div>
              <div>SMTP_PASSWORD=tua-password-app</div>
              <div></div>
              <div># Email destinazione notifiche</div>
              <div>NOTIFICATION_EMAIL=nutrizionista@example.com</div>
              <div></div>
              <div># Email mittente (opzionale, default = SMTP_USER)</div>
              <div>SMTP_FROM=noreply@gznutrition.it</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">💡 Suggerimenti per Gmail</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. Attiva la verifica in 2 passaggi nel tuo account Google</p>
              <p>2. Genera una "Password per le app" dalle impostazioni di sicurezza</p>
              <p>3. Usa quella password invece della password normale</p>
              <p>4. Host: smtp.gmail.com, Porta: 587, Secure: false</p>
            </div>
          </div>
        </section>

        {/* Funzionalità */}
        <section className="space-y-4">
          <h2 className="font-semibold text-lg text-black">Funzionalità Attive</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-green-600">✅ Notifiche Automatiche</h3>
              <ul className="text-sm space-y-1 text-black/70">
                <li>• Email immediata per ogni nuova prenotazione</li>
                <li>• Dettagli completi del cliente e appuntamento</li>
                <li>• Link diretto all'admin panel (futuro)</li>
                <li>• Design professionale e mobile-friendly</li>
                <li>• Informazioni su pacchetti e modalità</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-blue-600">📧 Contenuto Email</h3>
              <ul className="text-sm space-y-1 text-black/70">
                <li>• Nome e contatti del cliente</li>
                <li>• Data, orario e modalità appuntamento</li>
                <li>• Pacchetto selezionato</li>
                <li>• Note del cliente</li>
                <li>• Istruzioni per prossimi passi</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button onClick={loadEmailConfig} variant="outline">
            🔄 Ricarica Configurazione
          </Button>
        </div>
      </div>
    </>
  );
}
