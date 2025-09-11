"use client";
import { useEffect, useState } from "react";
import { listClients, upsertClient, deleteClient, getPackages, listBookings, getSiteContent, saveClientProgress, getClientProgress, type ClientCard, type Package, type Booking, type ClientProgress } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { UploadButton } from "@/components/UploadButton";
import { ClientProgressCard } from "@/components/ClientProgressCard";
import { ProgressChart } from "@/components/ProgressChart";
import { format } from "date-fns";

type ViewMode = "list" | "detail" | "create";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientCard[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedClient, setSelectedClient] = useState<ClientCard | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientProgress, setClientProgress] = useState<{[key: string]: ClientProgress[]}>({});

  const loadData = async () => {
    try {
      const [clientsList, packagesList, bookingsList] = await Promise.all([
        listClients(),
        getPackages(),
        listBookings()
      ]);
      setClients(clientsList);
      setPackages(packagesList);
      setBookings(bookingsList);
      
      // Carica i progressi per tutti i clienti
      const progressPromises = clientsList.map(async (client) => {
        if (client.id) {
          const progress = await getClientProgress(client.id);
          return { clientId: client.id, progress };
        }
        return null;
      });
      
      const progressResults = await Promise.all(progressPromises);
      const progressMap: {[key: string]: ClientProgress[]} = {};
      progressResults.forEach(result => {
        if (result) {
          progressMap[result.clientId] = result.progress;
        }
      });
      setClientProgress(progressMap);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Funzioni per gestire i progressi dei clienti
  const handleSaveProgress = async (clientId: string, progressEntry: Omit<ClientProgress, 'id' | 'clientId' | 'createdAt'>) => {
    try {
      // Salva nel database
      const progressId = await saveClientProgress({
        clientId,
        ...progressEntry
      });
      
      // Aggiorna lo state locale
      const newProgress: ClientProgress = {
        id: progressId,
        clientId,
        ...progressEntry,
        createdAt: new Date().toISOString()
      };
      
      setClientProgress(prev => ({
        ...prev,
        [clientId]: [newProgress, ...(prev[clientId] || [])]
      }));
      
      toast.success("Progresso salvato con successo!");
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Errore nel salvare il progresso");
    }
  };

  const handleExportPDF = async (clientId: string) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;
      
      const progressData = clientProgress[clientId] || [];
      
      // Ottieni il nome del sito dal contenuto
      const siteContent = await getSiteContent();
      const siteName = siteContent?.siteName || "GZnutrition";
      
      // Crea una nuova finestra per il PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const currentDate = new Date().toLocaleDateString('it-IT');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Report Progressi - ${client.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
              .client-info { background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
              .progress-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .progress-table th, .progress-table td { border: 1px solid #D1D5DB; padding: 12px; text-align: left; }
              .progress-table th { background: #F3F4F6; font-weight: bold; }
              .footer { margin-top: 40px; text-align: center; color: #6B7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Report Progressi Cliente</h1>
              <p>Generato il ${currentDate} - ${siteName}</p>
            </div>
            <div class="client-info">
              <h2>👤 ${client.name}</h2>
              <p><strong>Email:</strong> ${client.email}</p>
              <p><strong>Telefono:</strong> ${client.phone}</p>
            </div>
            ${progressData.length > 0 ? `
              <h2>📈 Storico Progressi</h2>
              <table class="progress-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Peso (kg)</th>
                    <th>Massa Grassa (%)</th>
                    <th>Massa Muscolare (kg)</th>
                    <th>Vita (cm)</th>
                    <th>Petto (cm)</th>
                    <th>Fianchi (cm)</th>
                    <th>Bicipite (cm)</th>
                    <th>Coscia (cm)</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${progressData.map(entry => `
                    <tr>
                      <td>${new Date(entry.date).toLocaleDateString('it-IT')}</td>
                      <td>${entry.weight || '-'}</td>
                      <td>${entry.bodyFat || '-'}</td>
                      <td>${entry.muscleMass || '-'}</td>
                      <td>${entry.measurements?.waist || '-'}</td>
                      <td>${entry.measurements?.chest || '-'}</td>
                      <td>${entry.measurements?.hipCircumference || '-'}</td>
                      <td>${entry.measurements?.bicepCircumference || '-'}</td>
                      <td>${entry.measurements?.thighCircumference || '-'}</td>
                      <td>${entry.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Nessun progresso registrato ancora.</p>'}
            <div class="footer">
              <p>Report generato automaticamente da ${siteName}</p>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Errore nell'export del PDF");
    }
  };

  const handleCreateNew = () => {
    setSelectedClient({
      name: "",
      email: "",
      phone: "",
      notes: "",
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID()
    });
    setViewMode("create");
  };

  const handleSaveClient = async (client: ClientCard) => {
    try {
      await upsertClient(client);
      toast.success("Cliente salvato con successo!");
      await loadData();
      setViewMode("list");
      setSelectedClient(null);
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Errore nel salvare il cliente");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const confirmed = window.confirm(
      "Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata."
    );
    
    if (!confirmed) return;

    try {
      await deleteClient(clientId);
      toast.success("Cliente eliminato con successo!");
      await loadData();
      if (viewMode === "detail") {
        setViewMode("list");
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Errore nell'eliminazione del cliente");
    }
  };

  const handleDocumentUpload = (clientId: string, documentType: string, url: string) => {
    if (!selectedClient) return;
    
    const newDocument = {
      id: crypto.randomUUID(),
      name: `${documentType}_${format(new Date(), 'yyyy-MM-dd')}`,
      url,
      type: documentType as "medical_certificate" | "id_document" | "consent_form" | "other",
      uploadedAt: new Date().toISOString()
    };

    const updatedClient = {
      ...selectedClient,
      documents: [...(selectedClient.documents || []), newDocument]
    };

    setSelectedClient(updatedClient);
    handleSaveClient(updatedClient);
  };

  const handleRemoveDocument = (clientId: string, documentId: string) => {
    if (!selectedClient) return;
    
    const updatedClient = {
      ...selectedClient,
      documents: selectedClient.documents?.filter(d => d.id !== documentId) || []
    };

    setSelectedClient(updatedClient);
    handleSaveClient(updatedClient);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold">Gestione Clienti</h1>
        <p className="mt-4 text-foreground/70">Caricamento...</p>
      </main>
    );
  }

  const renderClientList = () => (
    <div className="mt-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Cerca per nome o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            + Nuovo Cliente
          </Button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                <p className="text-sm text-gray-600">{client.email}</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">
                Cliente dal {format(new Date(client.createdAt || new Date()), 'dd/MM/yyyy')}
              </span>
            </div>

            {client.notes && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{client.notes}</p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedClient(client);
                  setViewMode("detail");
                }}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                👁️ Visualizza
              </Button>
              <Button
                onClick={() => handleDeleteClient(client.id!)}
                className="bg-red-600 hover:bg-red-700"
                size="sm"
              >
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun cliente trovato</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? "Prova a modificare i filtri di ricerca" 
              : "Inizia aggiungendo il tuo primo cliente"}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
              + Aggiungi Primo Cliente
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const renderClientForm = (client: ClientCard, isNew: boolean = false) => {
    const progressData = clientProgress[client.id!] || [];

    return (
      <div className="space-y-6">
        {/* ✅ HEADER MIGLIORATO CON INDICATORI VISIVI */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setViewMode("list");
                  setSelectedClient(null);
                }}
                variant="outline"
                size="sm"
                className="hover:bg-white"
              >
                ← Torna alla Lista
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNew ? "➕ Nuovo Cliente" : `👤 Dettaglio Cliente`}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isNew 
                    ? "Compila i campi obbligatori per aggiungere un nuovo cliente" 
                    : "Gestisci le informazioni e i progressi del cliente"
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSaveClient(client)}
                className="bg-green-600 hover:bg-green-700 shadow-lg"
              >
                💾 Salva {isNew ? 'Cliente' : 'Modifiche'}
              </Button>
              {!isNew && (
                <Button
                  onClick={() => handleDeleteClient(client.id!)}
                  className="bg-red-600 hover:bg-red-700 shadow-lg"
                >
                  🗑️ Elimina
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ✅ FORM PRINCIPALE MIGLIORATO */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              📋 Informazioni Base
            </h2>
            <p className="text-sm text-gray-600">
              I campi contrassegnati con * sono obbligatori
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Completo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nome Completo *
              </label>
              <Input
                value={client.name}
                onChange={(e) => setSelectedClient({ ...client, name: e.target.value })}
                placeholder="es. Mario Rossi"
                className="w-full"
                required
              />
              {!client.name && isNew && (
                <p className="text-xs text-red-600">⚠️ Il nome è obbligatorio</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <Input
                type="email"
                value={client.email}
                onChange={(e) => setSelectedClient({ ...client, email: e.target.value })}
                placeholder="es. mario.rossi@email.com"
                className="w-full"
                required
              />
              {!client.email && isNew && (
                <p className="text-xs text-red-600">⚠️ L'email è obbligatoria</p>
              )}
            </div>

            {/* Telefono */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Telefono *
              </label>
              <Input
                type="tel"
                value={client.phone}
                onChange={(e) => setSelectedClient({ ...client, phone: e.target.value })}
                placeholder="es. +39 123 456 7890"
                className="w-full"
                required
              />
              {!client.phone && isNew && (
                <p className="text-xs text-red-600">⚠️ Il telefono è obbligatorio</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Stato Cliente
              </label>
              <select
                value={client.status || 'active'}
                onChange={(e) => setSelectedClient({ ...client, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">🟢 Attivo</option>
                <option value="inactive">🔴 Inattivo</option>
                <option value="pending">🟡 In Attesa</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Note Aggiuntive
            </label>
            <textarea
              value={client.notes || ''}
              onChange={(e) => setSelectedClient({ ...client, notes: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Note aggiuntive sul cliente, obiettivi, preferenze..."
            />
          </div>

          {/* ✅ INDICATORE COMPLETAMENTO FORM */}
          {isNew && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-900">Completamento Form:</span>
                <span className="text-sm text-blue-700">
                  {[client.name, client.email, client.phone].filter(Boolean).length}/3 campi obbligatori
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${([client.name, client.email, client.phone].filter(Boolean).length / 3) * 100}%` 
                  }}
                ></div>
              </div>
              {[client.name, client.email, client.phone].filter(Boolean).length === 3 && (
                <p className="text-xs text-green-700 mt-2">✅ Form completo! Puoi salvare il cliente.</p>
              )}
            </div>
          )}
        </div>

        {/* Nuova Scheda Cliente Migliorata */}
        <ClientProgressCard
          client={{
            id: client.id || '',
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            status: 'active',
            notes: client.notes || '',
            createdAt: client.createdAt || new Date().toISOString()
          }}
          progressData={progressData}
          onSave={handleSaveProgress}
          onExportPDF={handleExportPDF}
        />

        {/* Grafici Progressi */}
        {progressData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgressChart
              data={progressData}
              type="weight"
              onExportPDF={() => handleExportPDF(client.id!)}
            />
            <ProgressChart
              data={progressData}
              type="bodyFat"
              onExportPDF={() => handleExportPDF(client.id!)}
            />
            <ProgressChart
              data={progressData}
              type="muscleMass"
              onExportPDF={() => handleExportPDF(client.id!)}
            />
            <ProgressChart
              data={progressData}
              type="measurements"
              onExportPDF={() => handleExportPDF(client.id!)}
            />
          </div>
        )}

        {/* Informazioni Dettagliate (Collassabile) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <details className="group">
            <summary className="cursor-pointer text-lg font-semibold text-gray-900 mb-4 list-none">
              <span className="group-open:hidden">📋 Mostra Informazioni Dettagliate</span>
              <span className="hidden group-open:inline">📋 Nascondi Informazioni Dettagliate</span>
            </summary>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <section>
                <h3 className="text-lg font-medium mb-4">👤 Informazioni Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                    <Input
                      value={client.name}
                      onChange={(e) => setSelectedClient({ ...client, name: e.target.value })}
                      placeholder="es. Mario Rossi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <Input
                      type="email"
                      value={client.email}
                      onChange={(e) => setSelectedClient({ ...client, email: e.target.value })}
                      placeholder="es. mario.rossi@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefono *</label>
                    <Input
                      type="tel"
                      value={client.phone}
                      onChange={(e) => setSelectedClient({ ...client, phone: e.target.value })}
                      placeholder="es. +39 123 456 7890"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Note</label>
                  <textarea
                    value={client.notes}
                    onChange={(e) => setSelectedClient({ ...client, notes: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Note aggiuntive sul cliente..."
                  />
                </div>
              </section>

              {/* Documents */}
              <section>
                <h3 className="text-lg font-medium mb-4">📄 Documenti</h3>
                <div className="space-y-4">
                  {/* Upload Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Carica Certificato Medico</label>
                      <UploadButton
                        folder="clients/medical"
                        onUploaded={(url) => handleDocumentUpload(client.id!, "medical_certificate", url)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Carica Documento d&apos;Identità</label>
                      <UploadButton
                        folder="clients/documents"
                        onUploaded={(url) => handleDocumentUpload(client.id!, "id_document", url)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Carica Modulo Consenso</label>
                      <UploadButton
                        folder="clients/consent"
                        onUploaded={(url) => handleDocumentUpload(client.id!, "consent_form", url)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Carica Altro Documento</label>
                      <UploadButton
                        folder="clients/other"
                        onUploaded={(url) => handleDocumentUpload(client.id!, "other", url)}
                      />
                    </div>
                  </div>

                  {/* Documents List */}
                  {client.documents && client.documents.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Documenti caricati:</h4>
                      <div className="space-y-2">
                        {client.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {doc.type === "medical_certificate" ? "🏥" :
                                 doc.type === "id_document" ? "🆔" :
                                 doc.type === "consent_form" ? "📝" : "📄"}
                              </span>
                              <div>
                                <div className="font-medium">{doc.name}</div>
                                <div className="text-sm text-gray-600">
                                  Caricato il {format(new Date(doc.uploadedAt), 'dd/MM/yyyy')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                              >
                                Visualizza
                              </a>
                              <Button
                                onClick={() => handleRemoveDocument(client.id!, doc.id)}
                                className="bg-red-600 hover:bg-red-700"
                                size="sm"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </details>
        </div>
      </div>
    );
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground pt-4">Clienti</h1>
      
      {viewMode === "list" && renderClientList()}
      {viewMode === "detail" && selectedClient && renderClientForm(selectedClient)}
      {viewMode === "create" && selectedClient && renderClientForm(selectedClient, true)}
    </>
  );
}