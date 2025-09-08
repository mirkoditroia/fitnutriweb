"use client";

import { useEffect, useState } from "react";
import { getSiteContent } from "@/lib/datasource";
import type { SiteContent } from "@/lib/data";

export default function PrivacyPolicyPage() {
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    getSiteContent().then(setSiteContent);
  }, []);

  const legalInfo = siteContent?.legalInfo;
  const companyName = legalInfo?.companyName || siteContent?.businessName || "GZnutrition";
  const vatNumber = legalInfo?.vatNumber;
  const email = legalInfo?.email || siteContent?.contactEmail;
  const address = legalInfo?.registeredAddress;

  const privacyContent = siteContent?.legalInfo?.legalPages?.privacyPolicy;
  const hasCustomContent = privacyContent?.content && privacyContent.content.trim() !== "";

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-16 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {privacyContent?.title || "Privacy Policy"}
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Ultimo aggiornamento:</strong> {privacyContent?.lastUpdated || new Date().toLocaleDateString('it-IT')}
          </p>

          {hasCustomContent ? (
            <div 
              dangerouslySetInnerHTML={{ __html: privacyContent.content || "" }}
              className="text-gray-700"
            />
          ) : (
            <>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Titolare del Trattamento</h2>
            <p className="text-gray-700 mb-4">
              Il titolare del trattamento dei dati personali è <strong>{companyName}</strong>.
            </p>
            {vatNumber && (
              <p className="text-gray-700 mb-4">
                <strong>Partita IVA:</strong> {vatNumber}
              </p>
            )}
            {address && (
              <p className="text-gray-700 mb-4">
                <strong>Sede legale:</strong> {address}
              </p>
            )}
            {email && (
              <p className="text-gray-700 mb-4">
                <strong>Email:</strong> {email}
              </p>
            )}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Tipologie di Dati Raccolti</h2>
            <p className="text-gray-700 mb-4">
              Raccogliamo i seguenti tipi di dati personali:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Dati di identificazione:</strong> nome, cognome, email, numero di telefono</li>
              <li><strong>Dati di prenotazione:</strong> data e ora degli appuntamenti, preferenze di sede</li>
              <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate</li>
              <li><strong>Dati di comunicazione:</strong> messaggi inviati tramite form di contatto</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Finalità del Trattamento</h2>
            <p className="text-gray-700 mb-4">
              I dati personali vengono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Gestione delle prenotazioni e appuntamenti</li>
              <li>Comunicazione con i clienti per servizi nutrizionali</li>
              <li>Invio di comunicazioni relative ai servizi offerti</li>
              <li>Miglioramento del sito web e dei servizi</li>
              <li>Adempimenti di legge e fiscali</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Base Giuridica</h2>
            <p className="text-gray-700 mb-4">
              Il trattamento dei dati personali si basa su:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Consenso dell'interessato</strong> (art. 6, par. 1, lett. a GDPR)</li>
              <li><strong>Esecuzione di un contratto</strong> (art. 6, par. 1, lett. b GDPR)</li>
              <li><strong>Interesse legittimo</strong> (art. 6, par. 1, lett. f GDPR)</li>
              <li><strong>Adempimento di obblighi di legge</strong> (art. 6, par. 1, lett. c GDPR)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Conservazione dei Dati</h2>
            <p className="text-gray-700 mb-4">
              I dati personali vengono conservati per il tempo necessario alle finalità per cui sono stati raccolti:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Dati di prenotazione:</strong> 10 anni (obblighi fiscali)</li>
              <li><strong>Dati di comunicazione:</strong> 2 anni dall'ultimo contatto</li>
              <li><strong>Dati di navigazione:</strong> 12 mesi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Diritti dell'Interessato</h2>
            <p className="text-gray-700 mb-4">
              Ai sensi del GDPR, l'interessato ha diritto di:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Accedere ai propri dati personali</li>
              <li>Richiedere la rettifica o l'aggiornamento</li>
              <li>Richiedere la cancellazione</li>
              <li>Limitare il trattamento</li>
              <li>Opporsi al trattamento</li>
              <li>Richiedere la portabilità dei dati</li>
              <li>Revocare il consenso in qualsiasi momento</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Per esercitare questi diritti, contattare il titolare all'indirizzo email: {email || "info@gznutrition.com"}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Sicurezza</h2>
            <p className="text-gray-700 mb-4">
              Adottiamo misure tecniche e organizzative appropriate per proteggere i dati personali contro accessi non autorizzati, alterazioni, divulgazioni o distruzioni.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookie</h2>
            <p className="text-gray-700 mb-4">
              Il nostro sito utilizza cookie per migliorare l'esperienza di navigazione. Per maggiori informazioni, consultare la nostra <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Modifiche</h2>
            <p className="text-gray-700 mb-4">
              Questa Privacy Policy può essere aggiornata periodicamente. Le modifiche saranno pubblicate su questa pagina con la data di ultimo aggiornamento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contatti</h2>
            <p className="text-gray-700 mb-4">
              Per qualsiasi domanda relativa a questa Privacy Policy o al trattamento dei dati personali, contattare:
            </p>
            <p className="text-gray-700 mb-4">
              <strong>{companyName}</strong><br />
              {email && <>Email: {email}<br /></>}
              {address && <>Indirizzo: {address}</>}
            </p>
          </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
