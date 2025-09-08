"use client";
import { useEffect, useState } from "react";
import { getPackages, upsertPackage, deletePackage, type Package } from "@/lib/datasource";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { UploadButton } from "@/components/UploadButton";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  useEffect(() => {
    loadPackages();
  }, []);
  
  const loadPackages = async () => {
    try {
      const packagesList = await getPackages();
      setPackages(packagesList);
    } catch (error) {
      console.error("Error loading packages:", error);
      toast.error("Errore nel caricamento dei pacchetti");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Caricamento pacchetti...</div>
        </div>
      </main>
    );
  }

  const filteredPackages = packages.filter(pkg =>
    pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const savePackage = async (idx: number) => {
    try {
      const id = await upsertPackage(packages[idx]);
      setPackages(packages.map((p, i) => i === idx ? { ...p, id } : p));
      toast.success("Pacchetto salvato con successo!");
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Errore nel salvare il pacchetto");
    }
  };

  const deletePackageHandler = async (idx: number) => {
    const pkg = packages[idx];
    if (!pkg.id) {
      setPackages(packages.filter((_, i) => i !== idx));
      toast.success("Pacchetto rimosso");
      return;
    }
    
    if (confirm(`Sei sicuro di voler eliminare il pacchetto "${pkg.title}"? Questa azione non può essere annullata.`)) {
      try {
        await deletePackage(pkg.id);
        setPackages(packages.filter((_, i) => i !== idx));
        toast.success("Pacchetto eliminato con successo");
      } catch (error) {
        console.error("Errore nell'eliminazione:", error);
        toast.error("Errore nell'eliminazione del pacchetto");
      }
    }
  };

  const addNewPackage = () => {
    const newPackage: Package = {
      title: "",
      description: "",
      price: 0,
      imageUrl: "",
      isActive: true,
      featured: false,
      badge: "",
      isPromotional: false,
      hasDiscount: false,
      basePrice: 0,
      discountedPrice: 0,
      discountPercentage: 0,
      paymentText: "",
      details: {
        duration: "",
        sessions: 0,
        features: [],
        includes: [],
        requirements: [],
        notes: ""
      }
    };
    setPackages([newPackage, ...packages]);
  };

  const updatePackage = (idx: number, field: keyof Package, value: any) => {
    setPackages(packages.map((pkg, i) => 
      i === idx ? { ...pkg, [field]: value } : pkg
    ));
  };

  const updateDetails = (idx: number, field: keyof NonNullable<Package['details']>, value: string | number | string[]) => {
    setPackages(packages.map((pkg, i) => 
      i === idx ? {
        ...pkg,
        details: {
          ...pkg.details,
          [field]: value
        }
      } : pkg
    ));
  };


  const calculateDiscountPercentage = (basePrice: number, discountedPrice: number): number => {
    if (basePrice <= 0 || discountedPrice >= basePrice) return 0;
    return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
  };

  const updatePrices = (idx: number, field: 'basePrice' | 'discountedPrice', value: number) => {
    const pkg = packages[idx];
    let newBasePrice = pkg.basePrice || 0;
    let newDiscountedPrice = pkg.discountedPrice || 0;
    
    if (field === 'basePrice') {
      newBasePrice = value;
    } else {
      newDiscountedPrice = value;
    }
    
    const newDiscountPercentage = calculateDiscountPercentage(newBasePrice, newDiscountedPrice);
    
    setPackages(packages.map((p, i) => 
      i === idx ? {
        ...p,
        [field]: value,
        discountPercentage: newDiscountPercentage
      } : p
    ));
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Pacchetti</h1>
          <p className="text-gray-600 mt-1">Gestisci i pacchetti e le offerte del tuo servizio</p>
        </div>
        <Button onClick={addNewPackage} className="bg-green-600 hover:bg-green-700">
          + Nuovo Pacchetto
        </Button>
      </div>

      {/* Filtri e controlli */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Cerca per titolo o descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "primary" : "outline"}
            onClick={() => setViewMode("list")}
            size="sm"
          >
            Lista
          </Button>
          <Button
            variant={viewMode === "grid" ? "primary" : "outline"}
            onClick={() => setViewMode("grid")}
            size="sm"
          >
            Griglia
          </Button>
        </div>
      </div>

      {/* Lista pacchetti */}
      <div className="space-y-6">
        {filteredPackages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Nessun pacchetto trovato</div>
            <p className="text-gray-400">Prova a modificare i filtri di ricerca o aggiungi un nuovo pacchetto</p>
          </div>
        ) : (
          filteredPackages.map((pkg, idx) => (
            <div key={pkg.id ?? idx} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              {/* Header del pacchetto */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {pkg.title.charAt(0).toUpperCase() || "P"}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {pkg.title || "Nuovo Pacchetto"}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pkg.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pkg.isActive ? 'Attivo' : 'Inattivo'}
                        </span>
                        {pkg.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            In Evidenza
                          </span>
                        )}
                        {pkg.isPromotional && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Promozionale
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => savePackage(idx)} variant="outline" size="sm">
                      Salva
                    </Button>
                    <Button onClick={() => savePackage(idx)} size="sm">
                      Salva e Pubblica
                    </Button>
                    <Button 
                      onClick={() => deletePackageHandler(idx)} 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contenuto del pacchetto */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Colonna sinistra - Informazioni base */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Informazioni Base</h4>
                      <div className="space-y-4">
                        <Input 
                          label="Titolo *" 
                          value={pkg.title} 
                          onChange={(e) => updatePackage(idx, "title", e.target.value)}
                          placeholder="Nome del pacchetto"
                        />
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione *</label>
                          <textarea 
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            rows={4} 
                            value={pkg.description} 
                            onChange={(e) => updatePackage(idx, "description", e.target.value)}
                            placeholder="Descrizione dettagliata del pacchetto..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Immagine</label>
                          <Input 
                            value={pkg.imageUrl ?? ""} 
                            onChange={(e) => updatePackage(idx, "imageUrl", e.target.value)}
                            placeholder="URL dell'immagine"
                          />
                          <div className="mt-2">
                            <UploadButton 
                              folder="packages" 
                              onUploaded={(url) => updatePackage(idx, "imageUrl", url)} 
                            />
                          </div>
                        </div>

                        <Input 
                          label="Badge" 
                          value={pkg.badge ?? ""} 
                          onChange={(e) => updatePackage(idx, "badge", e.target.value)}
                          placeholder="es. POPOLARE, NUOVO"
                        />
                      </div>
                    </div>

                    {/* Prezzi */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Prezzi</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id={`discount-${idx}`}
                            checked={!!pkg.hasDiscount} 
                            onChange={(e) => updatePackage(idx, "hasDiscount", e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`discount-${idx}`} className="text-sm font-medium text-gray-700">
                            Attiva sconti
                          </label>
                        </div>
                        
                        {pkg.hasDiscount ? (
                          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-2 gap-4">
                              <Input 
                                label="Prezzo Base (€)" 
                                type="number" 
                                value={pkg.basePrice ?? 0} 
                                onChange={(e) => updatePrices(idx, 'basePrice', Number(e.target.value))}
                              />
                              <Input 
                                label="Prezzo Scontato (€)" 
                                type="number" 
                                value={pkg.discountedPrice ?? 0} 
                                onChange={(e) => updatePrices(idx, 'discountedPrice', Number(e.target.value))}
                              />
                            </div>
                            <div className="p-3 bg-white border border-blue-300 rounded-lg text-center">
                              <div className="text-sm text-blue-600 font-medium">Sconto</div>
                              <div className="text-2xl font-bold text-blue-800">
                                {pkg.discountPercentage ?? 0}%
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Input 
                            label="Prezzo (€)" 
                            type="number" 
                            value={pkg.price} 
                            onChange={(e) => updatePackage(idx, "price", Number(e.target.value))}
                          />
                        )}

                        <Input 
                          label="Testo Pagamento" 
                          value={pkg.paymentText || ""} 
                          onChange={(e) => updatePackage(idx, "paymentText", e.target.value)}
                          placeholder="es. pagabile mensilmente, in un'unica soluzione"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Colonna destra - Opzioni e dettagli */}
                  <div className="space-y-6">
                    {/* Opzioni */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Opzioni</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={!!pkg.isActive} 
                            onChange={(e) => updatePackage(idx, "isActive", e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Attivo</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={!!pkg.featured} 
                            onChange={(e) => updatePackage(idx, "featured", e.target.checked)}
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="text-sm font-medium text-gray-700">In evidenza</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={!!pkg.isPromotional} 
                            onChange={(e) => updatePackage(idx, "isPromotional", e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Promozionale</span>
                        </label>
                      </div>
                    </div>

                    {/* Dettagli */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Dettagli</h4>
                      <div className="space-y-4">
                        <Input 
                          label="Durata" 
                          value={pkg.details?.duration ?? ""} 
                          onChange={(e) => updateDetails(idx, "duration", e.target.value)}
                          placeholder="es. 3 mesi, 6 mesi, 1 anno"
                        />
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                          <textarea 
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            rows={3} 
                            value={pkg.details?.notes ?? ""} 
                            onChange={(e) => updateDetails(idx, "notes", e.target.value)}
                            placeholder="Note aggiuntive..."
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}