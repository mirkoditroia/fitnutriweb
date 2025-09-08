"use client";

import { useEffect, useState } from "react";
import { getSiteContent } from "@/lib/datasource";
import type { SiteContent } from "@/lib/data";

export default function CookiePolicyPage() {
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    getSiteContent().then(setSiteContent);
  }, []);

  const legalInfo = siteContent?.legalInfo;
  const companyName = legalInfo?.companyName || siteContent?.businessName || "GZnutrition";
  const email = legalInfo?.email || siteContent?.contactEmail;

  const cookieContent = siteContent?.legalInfo?.legalPages?.cookiePolicy;
  const hasCustomContent = cookieContent?.content && cookieContent.content.trim() !== "";

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-16 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {cookieContent?.title || "Cookie Policy"}
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Ultimo aggiornamento:</strong> {cookieContent?.lastUpdated || new Date().toLocaleDateString('it-IT')}
          </p>

          {hasCustomContent ? (
            <div 
              dangerouslySetInnerHTML={{ __html: cookieContent.content || "" }}
              className="text-gray-700"
            />
          ) : (
            <>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Cosa sono i Cookie</h2>
            <p className="text-gray-700 mb-4">
              I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente quando visita un sito web. 
              Vengono utilizzati per migliorare l'esperienza di navigazione e fornire funzionalità personalizzate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Tipologie di Cookie Utilizzati</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cookie Tecnici (Necessari)</h3>
              <p className="text-gray-700 mb-4">
                Questi cookie sono essenziali per il funzionamento del sito e non possono essere disabilitati:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Cookie di sessione:</strong> mantengono la sessione attiva durante la navigazione</li>
                <li><strong>Cookie di sicurezza:</strong> proteggono da attacchi e frodi</li>
                <li><strong>Cookie di preferenze:</strong> ricordano le impostazioni dell'utente</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cookie di Prestazioni</h3>
              <p className="text-gray-700 mb-4">
                Questi cookie raccolgono informazioni su come gli utenti utilizzano il sito:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Pagine più visitate</li>
                <li>Tempo di permanenza sul sito</li>
                <li>Errori riscontrati</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cookie di Funzionalità</h3>
              <p className="text-gray-700 mb-4">
                Questi cookie permettono al sito di ricordare le scelte dell'utente:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Preferenze di lingua</li>
                <li>Impostazioni di accessibilità</li>
                <li>Consenso ai cookie</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cookie di Terze Parti</h2>
            <p className="text-gray-700 mb-4">
              Il nostro sito può utilizzare cookie di terze parti per:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Google Analytics:</strong> analisi del traffico e comportamento degli utenti</li>
              <li><strong>Google reCAPTCHA:</strong> protezione da spam e bot</li>
              <li><strong>Social Media:</strong> integrazione con piattaforme social</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Questi cookie sono gestiti dalle rispettive terze parti secondo le loro policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Durata dei Cookie</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Tipo Cookie</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Durata</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Finalità</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cookie di sessione</td>
                    <td className="border border-gray-300 px-4 py-2">Fino alla chiusura del browser</td>
                    <td className="border border-gray-300 px-4 py-2">Funzionamento del sito</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cookie di consenso</td>
                    <td className="border border-gray-300 px-4 py-2">12 mesi</td>
                    <td className="border border-gray-300 px-4 py-2">Ricorda le preferenze</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cookie analitici</td>
                    <td className="border border-gray-300 px-4 py-2">24 mesi</td>
                    <td className="border border-gray-300 px-4 py-2">Analisi del traffico</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Gestione dei Cookie</h2>
            <p className="text-gray-700 mb-4">
              Puoi gestire i cookie attraverso:
            </p>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Impostazioni del Browser</h3>
              <p className="text-gray-700 mb-4">
                La maggior parte dei browser permette di:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Visualizzare i cookie memorizzati</li>
                <li>Eliminare i cookie esistenti</li>
                <li>Bloccare i cookie di terze parti</li>
                <li>Ricevere notifiche prima dell'installazione di nuovi cookie</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Banner di Consenso</h3>
              <p className="text-gray-700 mb-4">
                Al primo accesso al sito, apparirà un banner che ti permette di:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Accettare tutti i cookie</li>
                <li>Rifiutare i cookie non necessari</li>
                <li>Personalizzare le preferenze</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Conseguenze della Disabilitazione</h2>
            <p className="text-gray-700 mb-4">
              Disabilitare i cookie può comportare:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Impossibilità di utilizzare alcune funzionalità del sito</li>
              <li>Perdita delle preferenze salvate</li>
              <li>Necessità di reinserire informazioni ad ogni visita</li>
              <li>Riduzione della personalizzazione dell'esperienza</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Aggiornamenti</h2>
            <p className="text-gray-700 mb-4">
              Questa Cookie Policy può essere aggiornata per riflettere modifiche nella legislazione o nelle nostre pratiche. 
              Ti consigliamo di consultare periodicamente questa pagina.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contatti</h2>
            <p className="text-gray-700 mb-4">
              Per domande sui cookie o per esercitare i tuoi diritti, contattare:
            </p>
            <p className="text-gray-700 mb-4">
              <strong>{companyName}</strong><br />
              {email && <>Email: {email}</>}
            </p>
          </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
