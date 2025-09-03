"use client";
import { useEffect, useState } from "react";
import { listClients, upsertClient, deleteClient, getPackages, createClientFromPendingBooking, listBookings, type ClientCard, type Package, type Booking } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { UploadButton } from "@/components/UploadButton";
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

  const handleCreateNew = () => {
    setSelectedClient({
      name: "",
      email: "",
      phone: "",
      notes: "",
      status: "prospect",
      source: "website",
      goals: [],
      medicalConditions: [],
      allergies: [],
      medications: [],
      documents: []
    });
    setViewMode("create");
  };

  const handleEditClient = (client: ClientCard) => {
    setSelectedClient(client);
    setViewMode("detail");
  };

  const handleSaveClient = async (client: ClientCard) => {
    try {
      await upsertClient(client);
      toast.success("Cliente salvato con successo!");
      await loadData();
      if (viewMode === "create") {
        setViewMode("list");
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Errore nel salvataggio del cliente");
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

  const handleCreateClientsFromPendingBookings = async () => {
    const pendingBookings = bookings.filter(b => b.status === "pending");
    
    if (pendingBookings.length === 0) {
      toast("Nessuna prenotazione in attesa trovata");
      return;
    }

    try {
      await Promise.all(pendingBookings.map(createClientFromPendingBooking));
      toast.success(`${pendingBookings.length} clienti creati/aggiornati dalle prenotazioni in attesa!`);
      await loadData();
    } catch (error) {
      console.error("Error creating clients from pending bookings:", error);
      toast.error("Errore nella creazione di alcuni clienti");
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
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-foreground/20 rounded-md bg-background"
        >
          <option value="all">Tutti gli stati</option>
          <option value="prospect">Prospetto</option>
          <option value="active">Attivo</option>
          <option value="inactive">Inattivo</option>
        </select>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleCreateClientsFromPendingBookings}
            className="bg-blue-600 hover:bg-blue-700 text-white button-responsive"
            disabled={bookings.filter(b => b.status === "pending").length === 0}
          >
            <span className="flex flex-col items-center justify-center gap-1 text-center">
              <span className="flex items-center gap-2">
                <span>👥</span>
                <span className="hidden sm:inline">Crea da Prenotazioni</span>
                <span className="sm:hidden">Crea da Prenotazioni</span>
              </span>
              <span className="font-medium text-center">({bookings.filter(b => b.status === "pending").length})</span>
            </span>
          </Button>
          <Button onClick={handleCreateNew} className="button-responsive">
            <span className="flex items-center justify-center gap-2 text-center">
              <span>➕</span>
              <span>Nuovo Cliente</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <span className={`chip text-xs ${
                    client.status === "active" ? "bg-green-100 text-green-800" :
                    client.status === "inactive" ? "bg-gray-100 text-gray-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {client.status === "active" ? "Attivo" : 
                     client.status === "inactive" ? "Inattivo" : "Prospetto"}
                  </span>
                  {client.assignedPackage && (
                    <span className="chip bg-primary/10 text-primary text-xs">
                      📦 Pacchetto
                    </span>
                  )}
                </div>
                <div className="text-sm text-foreground/70 space-y-1">
                  <div>📧 {client.email}</div>
                  {client.phone && <div>📱 {client.phone}</div>}
                  {client.city && <div>🏠 {client.city}</div>}
                  {client.fitnessLevel && (
                    <div>💪 Livello: {client.fitnessLevel === "beginner" ? "Principiante" : 
                                       client.fitnessLevel === "intermediate" ? "Intermedio" : "Avanzato"}</div>
                  )}
                  {client.documents && client.documents.length > 0 && (
                    <div>📄 {client.documents.length} documento{client.documents.length !== 1 ? 'i' : ''}</div>
                  )}
                </div>
                {client.notes && (
                  <div className="text-sm text-foreground/60 mt-2 italic">
                    &ldquo;{client.notes.substring(0, 100)}{client.notes.length > 100 ? '...' : ''}&rdquo;
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditClient(client)}
                >
                  ✏️ Modifica
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteClient(client.id!)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  🗑️ Elimina
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-foreground/50">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-lg font-medium mb-2">Nessun cliente trovato</p>
            <p className="text-sm">
              {searchTerm || filterStatus !== "all" 
                ? "Prova a modificare i filtri di ricerca" 
                : "Crea il tuo primo cliente cliccando su 'Nuovo Cliente'"}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderClientForm = (client: ClientCard, isNew: boolean = false) => (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {isNew ? "Nuovo Cliente" : `Modifica Cliente: ${client.name}`}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setViewMode("list");
              setSelectedClient(null);
            }}
          >
            ← Torna alla lista
          </Button>
          <Button onClick={() => handleSaveClient(client)}>
            💾 Salva Cliente
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-sm">
        <form className="space-y-6">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-medium mb-4">📋 Informazioni Base</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome completo *</label>
                <Input
                  value={client.name}
                  onChange={(e) => setSelectedClient({ ...client, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={client.email}
                  onChange={(e) => setSelectedClient({ ...client, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefono</label>
                <Input
                  type="tel"
                  value={client.phone || ""}
                  onChange={(e) => setSelectedClient({ ...client, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data di nascita</label>
                <Input
                  type="date"
                  value={client.birthDate || ""}
                  onChange={(e) => setSelectedClient({ ...client, birthDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Genere</label>
                <select
                  value={client.gender || ""}
                  onChange={(e) => setSelectedClient({ ...client, gender: e.target.value as "male" | "female" | "other" | "prefer_not_to_say" })}
                  className="w-full px-3 py-2 border border-foreground/20 rounded-md bg-white text-black placeholder:text-black/70"
                >
                  <option value="">Seleziona...</option>
                  <option value="male">Maschio</option>
                  <option value="female">Femmina</option>
                  <option value="other">Altro</option>
                  <option value="prefer_not_to_say">Preferisco non dire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stato</label>
                <select
                  value={client.status || "prospect"}
                  onChange={(e) => setSelectedClient({ ...client, status: e.target.value as "active" | "inactive" | "prospect" })}
                  className="w-full px-3 py-2 border border-foreground/20 rounded-md bg-white text-black placeholder:text-black/70"
                >
                  <option value="prospect">Prospetto</option>
                  <option value="active">Attivo</option>
                  <option value="inactive">Inattivo</option>
                </select>
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-lg font-medium mb-4">🏠 Indirizzo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Indirizzo</label>
                <Input
                  value={client.address || ""}
                  onChange={(e) => setSelectedClient({ ...client, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Città</label>
                <Input
                  value={client.city || ""}
                  onChange={(e) => setSelectedClient({ ...client, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CAP</label>
                <Input
                  value={client.postalCode || ""}
                  onChange={(e) => setSelectedClient({ ...client, postalCode: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Health Information */}
          <section>
            <h3 className="text-lg font-medium mb-4">💪 Informazioni Salute e Fitness</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Altezza (cm)</label>
                <Input
                  type="number"
                  value={client.height || ""}
                  onChange={(e) => setSelectedClient({ ...client, height: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Peso (kg)</label>
                <Input
                  type="number"
                  value={client.weight || ""}
                  onChange={(e) => setSelectedClient({ ...client, weight: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Livello fitness</label>
                <select
                  value={client.fitnessLevel || ""}
                  onChange={(e) => setSelectedClient({ ...client, fitnessLevel: e.target.value as "beginner" | "intermediate" | "advanced" })}
                  className="w-full px-3 py-2 border border-foreground/20 rounded-md bg-background"
                >
                  <option value="">Seleziona...</option>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pacchetto assegnato</label>
                <select
                  value={client.assignedPackage || ""}
                  onChange={(e) => setSelectedClient({ ...client, assignedPackage: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/20 rounded-md bg-background"
                >
                  <option value="">Nessun pacchetto</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Arrays */}
          <section>
            <h3 className="text-lg font-medium mb-4">🎯 Obiettivi e Condizioni</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Obiettivi (separati da virgola)</label>
                <Input
                  value={client.goals?.join(", ") || ""}
                  onChange={(e) => setSelectedClient({ 
                    ...client, 
                    goals: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  placeholder="es. Perdere peso, Aumentare massa muscolare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condizioni mediche (separate da virgola)</label>
                <Input
                  value={client.medicalConditions?.join(", ") || ""}
                  onChange={(e) => setSelectedClient({ 
                    ...client, 
                    medicalConditions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  placeholder="es. Diabete, Ipertensione"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Allergie (separate da virgola)</label>
                <Input
                  value={client.allergies?.join(", ") || ""}
                  onChange={(e) => setSelectedClient({ 
                    ...client, 
                    allergies: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  placeholder="es. Glutine, Lattosio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Farmaci (separati da virgola)</label>
                <Input
                  value={client.medications?.join(", ") || ""}
                  onChange={(e) => setSelectedClient({ 
                    ...client, 
                    medications: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  placeholder="es. Metformina, Enalapril"
                />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section>
            <h3 className="text-lg font-medium mb-4">🚨 Contatto di Emergenza</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input
                  value={client.emergencyContact?.name || ""}
                  onChange={(e) => setSelectedClient({ 
                    ...client, 
                    emergencyContact: { 
                      ...client.emergencyContact, 
                      name: e.target.value 
                    } as { name: string; phone: string; relationship: string }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefono</label>
                <Input
                  type="tel"
                  value={client.emergencyContact?.phone || ""}
                  onChange={(e) => setSelectedClient({ 
                    ...client, 
                    emergencyContact: { 
                      ...client.emergencyContact, 
                      phone: e.target.value 
                    } as { name: string; phone: string; relationship: string }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relazione</label>
                <Input
                  value={client.emergencyContact?.relationship || ""}
                  onChange={(e) => setSelectedClient({ 
                    ...client, 
                    emergencyContact: { 
                      ...client.emergencyContact, 
                      relationship: e.target.value 
                    } as { name: string; phone: string; relationship: string }
                  })}
                  placeholder="es. Coniuge, Genitore"
                />
              </div>
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
                    folder="clients/id"
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
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {doc.type === "medical_certificate" ? "🏥" :
                             doc.type === "id_document" ? "🆔" :
                             doc.type === "consent_form" ? "📝" : "📄"}
                          </span>
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-sm text-foreground/60">
                              Caricato il {format(new Date(doc.uploadedAt), 'dd/MM/yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline text-xs"
                          >
                            👁️ Visualizza
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveDocument(client.id!, doc.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                          >
                            🗑️ Rimuovi
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-lg font-medium mb-4">📝 Note</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Note personali</label>
              <textarea
                rows={6}
                value={client.notes || ""}
                onChange={(e) => setSelectedClient({ ...client, notes: e.target.value })}
                className="w-full px-3 py-2 border border-foreground/20 rounded-md bg-background"
                placeholder="Inserisci note personali, obiettivi specifici, preferenze alimentari..."
              />
            </div>
          </section>
        </form>
        </div>
      </div>
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground pt-4">Clienti</h1>
      
      {viewMode === "list" && renderClientList()}
      {viewMode === "detail" && selectedClient && renderClientForm(selectedClient)}
      {viewMode === "create" && selectedClient && renderClientForm(selectedClient, true)}
    </>
  );
}


