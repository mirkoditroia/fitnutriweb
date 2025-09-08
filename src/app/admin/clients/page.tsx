"use client";
import { useEffect, useState } from "react";
import { listClients, upsertClient, deleteClient, getPackages, listBookings, type ClientCard, type Package, type Booking } from "@/lib/datasource";
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [clientProgress, setClientProgress] = useState<{[key: string]: any[]}>({});

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
  const handleSaveProgress = async (clientId: string, progressEntry: any) => {
    try {
      // Simula il salvataggio (in futuro integreremo con Firebase)
      setClientProgress(prev => ({
        ...prev,
        [clientId]: [...(prev[clientId] || []), { ...progressEntry, id: Date.now().toString() }]
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
              <p>Generato il ${currentDate} - GZ Nutrition</p>
            </div>
            <div class="client-info">
              <h2>👤 ${client.name}</h2>
              <p><strong>Email:</strong> ${client.email}</p>
              <p><strong>Telefono:</strong> ${client.phone}</p>
              <p><strong>Status:</strong> ${client.status}</p>
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
                      <td>${entry.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Nessun progresso registrato ancora.</p>'}
            <div class="footer">
              <p>Report generato automaticamente da GZ Nutrition</p>
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
      status: "prospect",
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

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    return matchesSearch && matchesStatus;
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
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutti gli stati</option>
            <option value="prospect">Prospect</option>
            <option value="active">Attivo</option>
            <option value="inactive">Inattivo</option>
            <option value="completed">Completato</option>
          </select>
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
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                client.status === 'active' ? 'bg-green-100 text-green-800' :
                client.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                client.status === 'prospect' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {client.status === 'active' ? 'Attivo' :
                 client.status === 'inactive' ? 'Inattivo' :
                 client.status === 'prospect' ? 'Prospect' : 'Completato'}
              </span>
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
            {searchTerm || filterStatus !== "all" 
              ? "Prova a modificare i filtri di ricerca" 
              : "Inizia aggiungendo il tuo primo cliente"}
          </p>
          {(!searchTerm && filterStatus === "all") && (
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                setViewMode("list");
                setSelectedClient(null);
              }}
              variant="outline"
              size="sm"
            >
              ← Torna alla Lista
            </Button>
            <h1 className="text-2xl font-bold">
              {isNew ? "Nuovo Cliente" : `Dettaglio Cliente`}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSaveClient(client)}
              className="bg-green-600 hover:bg-green-700"
            >
              💾 Salva Modifiche
            </Button>
            {!isNew && (
              <Button
                onClick={() => handleDeleteClient(client.id!)}
                className="bg-red-600 hover:bg-red-700"
              >
                🗑️ Elimina Cliente
              </Button>
            )}
          </div>
        </div>

        {/* Nuova Scheda Cliente Migliorata */}
        <ClientProgressCard
          client={{
            id: client.id || '',
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            status: client.status || 'prospect',
            notes: client.notes || '',
            createdAt: client.createdAt || new Date().toISOString()
          }}
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={client.status}
                      onChange={(e) => setSelectedClient({ ...client, status: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="prospect">Prospect</option>
                      <option value="active">Attivo</option>
                      <option value="inactive">Inattivo</option>
                      <option value="completed">Completato</option>
                    </select>
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