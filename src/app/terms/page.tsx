"use client";

import { useEffect, useState } from "react";
import { getSiteContent } from "@/lib/datasource";
import type { SiteContent } from "@/lib/data";

export default function TermsOfServicePage() {
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    getSiteContent().then(setSiteContent);
  }, []);

  const legalInfo = siteContent?.legalInfo;
  const companyName = legalInfo?.companyName || siteContent?.businessName || "GZnutrition";
  const vatNumber = legalInfo?.vatNumber;
  const email = legalInfo?.email || siteContent?.contactEmail;
  const address = legalInfo?.registeredAddress;

  const termsContent = siteContent?.legalInfo?.legalPages?.termsOfService;
  const hasCustomContent = termsContent?.content && termsContent.content.trim() !== "";

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-16 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {termsContent?.title || "Termini di Servizio"}
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Ultimo aggiornamento:</strong> {termsContent?.lastUpdated || new Date().toLocaleDateString('it-IT')}
          </p>

          {hasCustomContent ? (
            <div 
              dangerouslySetInnerHTML={{ __html: termsContent.content || "" }}
              className="text-gray-700"
            />
          ) : (
            <>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Informazioni Generali</h2>
            <p className="text-gray-700 mb-4">
              I presenti Termini di Servizio regolano l'utilizzo del sito web e dei servizi offerti da <strong>{companyName}</strong>.
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Servizi Offerti</h2>
            <p className="text-gray-700 mb-4">
              {companyName} offre i seguenti servizi:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Consulenze nutrizionali personalizzate</li>
              <li>Piani alimentari su misura</li>
              <li>Supporto e follow-up nutrizionale</li>
              <li>Educazione alimentare</li>
              <li>Servizi di coaching nutrizionale</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Prenotazioni e Appuntamenti</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Modalità di Prenotazione</h3>
              <p className="text-gray-700 mb-4">
                Le prenotazioni possono essere effettuate:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Tramite il form online presente sul sito</li>
                <li>Via email o telefono</li>
                <li>Direttamente presso la sede</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Conferma Appuntamenti</h3>
              <p className="text-gray-700 mb-4">
                Tutti gli appuntamenti devono essere confermati. La mancata conferma può comportare la cancellazione automatica.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Disdette e Modifiche</h3>
              <p className="text-gray-700 mb-4">
                Le disdette devono essere comunicate con almeno 24 ore di anticipo. 
                Le modifiche agli appuntamenti sono soggette a disponibilità.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Pagamenti e Fatturazione</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Modalità di Pagamento</h3>
              <p className="text-gray-700 mb-4">
                I pagamenti possono essere effettuati:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Contanti</li>
                <li>Bonifico bancario</li>
                <li>Pagamento elettronico</li>
                <li>Rate mensili (per pacchetti)</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Fatturazione</h3>
              <p className="text-gray-700 mb-4">
                Le fatture vengono emesse secondo la normativa fiscale italiana. 
                Per l'emissione della fattura è necessario fornire i dati fiscali completi.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Responsabilità e Limitazioni</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Responsabilità del Cliente</h3>
              <p className="text-gray-700 mb-4">
                Il cliente si impegna a:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Fornire informazioni veritiere e complete</li>
                <li>Seguire le indicazioni nutrizionali fornite</li>
                <li>Comunicare eventuali variazioni di salute</li>
                <li>Rispettare gli orari degli appuntamenti</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Limitazioni di Responsabilità</h3>
              <p className="text-gray-700 mb-4">
                {companyName} non si assume responsabilità per:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Risultati non ottenuti per mancato rispetto delle indicazioni</li>
                <li>Reazioni allergiche non comunicate</li>
                <li>Problemi di salute preesistenti non dichiarati</li>
                <li>Interruzioni del servizio per cause di forza maggiore</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy e Trattamento Dati</h2>
            <p className="text-gray-700 mb-4">
              Il trattamento dei dati personali è regolato dalla nostra <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, 
              conforme al Regolamento UE 2016/679 (GDPR).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Proprietà Intellettuale</h2>
            <p className="text-gray-700 mb-4">
              Tutti i contenuti del sito, inclusi testi, immagini, loghi e materiali formativi, sono di proprietà di {companyName} 
              e sono protetti dalle leggi sul diritto d'autore.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Modifiche ai Termini</h2>
            <p className="text-gray-700 mb-4">
              {companyName} si riserva il diritto di modificare questi Termini di Servizio in qualsiasi momento. 
              Le modifiche saranno pubblicate su questa pagina e diventeranno effettive dalla data di pubblicazione.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Legge Applicabile</h2>
            <p className="text-gray-700 mb-4">
              I presenti Termini di Servizio sono regolati dalla legge italiana. 
              Per qualsiasi controversia sarà competente il Foro di [Città della sede legale].
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contatti</h2>
            <p className="text-gray-700 mb-4">
              Per qualsiasi domanda relativa a questi Termini di Servizio, contattare:
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
