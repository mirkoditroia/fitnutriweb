"use client";
import { useEffect, useState } from "react";
import { getPackages, upsertPackage, deletePackage, type Package } from "@/lib/datasource";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { UploadButton } from "@/components/UploadButton";

export default function AdminPackagesPage() {
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getPackages().then((p) => { setItems(p); setLoading(false); });
  }, []);
  
  if (loading) return <main className="container py-8">Caricamento...</main>;

  const save = async (idx: number) => {
    const id = await upsertPackage(items[idx]);
    setItems(items.map((p, i) => i === idx ? { ...p, id } : p));
    toast.success("Pacchetto salvato");
  };

  const deletePkg = async (idx: number) => {
    const pkg = items[idx];
    if (!pkg.id) {
      // Se non ha ID, rimuovi solo dallo stato locale
      setItems(items.filter((_, i) => i !== idx));
      toast.success("Pacchetto rimosso");
      return;
    }
    
    if (confirm(`Sei sicuro di voler eliminare il pacchetto "${pkg.title}"? Questa azione non può essere annullata.`)) {
      try {
        await deletePackage(pkg.id);
        setItems(items.filter((_, i) => i !== idx));
        toast.success("Pacchetto eliminato con successo");
      } catch (error) {
        console.error("Errore nell'eliminazione:", error);
        toast.error("Errore nell'eliminazione del pacchetto");
      }
    }
  };

  const add = () => setItems([{
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
    paymentText: "pagabile mensilmente",
    details: {
      duration: "",
      sessions: 0,
      features: [],
      includes: [],
      requirements: [],
      notes: ""
    }
  }, ...items]);

  const updateDetails = (idx: number, field: keyof NonNullable<Package['details']>, value: any) => {
    setItems(upd(items, idx, {
      details: {
        ...items[idx].details,
        [field]: value
      }
    }));
  };

  const addArrayItem = (idx: number, field: keyof NonNullable<Package['details']>, value: string) => {
    const currentArray = (items[idx].details?.[field] as string[]) || [];
    updateDetails(idx, field, [...currentArray, value]);
  };

  const removeArrayItem = (idx: number, field: keyof NonNullable<Package['details']>, itemIndex: number) => {
    const currentArray = (items[idx].details?.[field] as string[]) || [];
    updateDetails(idx, field, currentArray.filter((_, i) => i !== itemIndex));
  };

  // Calcola automaticamente la percentuale di sconto
  const calculateDiscountPercentage = (basePrice: number, discountedPrice: number): number => {
    if (basePrice <= 0 || discountedPrice >= basePrice) return 0;
    return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
  };

  // Aggiorna automaticamente la percentuale quando cambiano i prezzi
  const updatePrices = (idx: number, field: 'basePrice' | 'discountedPrice', value: number) => {
    const pkg = items[idx];
    let newBasePrice = pkg.basePrice || 0;
    let newDiscountedPrice = pkg.discountedPrice || 0;
    
    if (field === 'basePrice') {
      newBasePrice = value;
    } else {
      newDiscountedPrice = value;
    }
    
    const newDiscountPercentage = calculateDiscountPercentage(newBasePrice, newDiscountedPrice);
    
    setItems(upd(items, idx, {
      [field]: value,
      discountPercentage: newDiscountPercentage
    }));
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground pt-4">Gestione Pacchetti</h1>
      <div className="mt-4 flex justify-end"><Button onClick={add}>Aggiungi Nuovo Pacchetto</Button></div>
      <div className="mt-4 grid gap-6">
        {items.map((p, i) => (
          <div key={p.id ?? i} className="bg-card border border-border rounded-lg p-6 shadow-sm">
            {/* Header del pacchetto */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Pacchetto {i + 1}</h3>
              <div className="flex gap-2">
                <Button onClick={() => save(i)} variant="outline">Salva</Button>
                <Button onClick={() => save(i)}>Salva e Pubblica</Button>
                <Button 
                  onClick={() => deletePkg(i)} 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  🗑️ Elimina
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonna sinistra - Informazioni base */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground border-b pb-2">Informazioni Base</h4>
                
                <Input 
                  label="Titolo *" 
                  value={p.title} 
                  onChange={(e) => setItems(upd(items, i, { title: e.target.value }))} 
                />
                
                <div>
                  <label className="block text-sm font-medium mb-1">Descrizione *</label>
                  <textarea 
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" 
                    rows={3} 
                    value={p.description} 
                    onChange={(e) => setItems(upd(items, i, { description: e.target.value }))} 
                  />
                </div>

            <div>
              <Input label="Immagine URL" value={p.imageUrl ?? ""} onChange={(e) => setItems(upd(items, i, { imageUrl: e.target.value }))} />
              <div className="mt-2"><UploadButton folder="packages" onUploaded={(url) => setItems(upd(items, i, { imageUrl: url }))} /></div>
            </div>

                <Input label="Badge" value={p.badge ?? ""} onChange={(e) => setItems(upd(items, i, { badge: e.target.value }))} placeholder="es. POPOLARE, NUOVO" />
              </div>

              {/* Colonna destra - Prezzi e opzioni */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground border-b pb-2">Prezzi e Opzioni</h4>
                
                {/* Sistema di sconti */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={!!p.hasDiscount} 
                      onChange={(e) => setItems(upd(items, i, { hasDiscount: e.target.checked }))} 
                    /> 
                    Attiva sconti
                  </label>
                  
                  {p.hasDiscount ? (
                    <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <Input 
                          label="Prezzo Base (€)" 
                          type="number" 
                          value={p.basePrice ?? 0} 
                          onChange={(e) => updatePrices(i, 'basePrice', Number(e.target.value))} 
                        />
                        <Input 
                          label="Prezzo Scontato (€)" 
                          type="number" 
                          value={p.discountedPrice ?? 0} 
                          onChange={(e) => updatePrices(i, 'discountedPrice', Number(e.target.value))} 
                        />
                      </div>
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
                        <div className="text-sm text-blue-600 font-medium">Percentuale Sconto</div>
                        <div className="text-lg font-bold text-blue-800">
                          {p.discountPercentage ?? 0}%
                        </div>
                        <div className="text-xs text-blue-600">Calcolata automaticamente</div>
                      </div>
                    </div>
                  ) : (
                    <Input 
                      label="Prezzo (€)" 
                      type="number" 
                      value={p.price} 
                      onChange={(e) => setItems(upd(items, i, { price: Number(e.target.value) }))} 
                    />
                  )}
                </div>

                <Input 
                  label="Testo Pagamento" 
                  value={p.paymentText ?? "pagabile mensilmente"} 
                  onChange={(e) => setItems(upd(items, i, { paymentText: e.target.value }))} 
                  placeholder="es. pagabile mensilmente, in un'unica soluzione"
                />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!p.isActive} onChange={(e) => setItems(upd(items, i, { isActive: e.target.checked }))} /> 
                    Attivo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!p.featured} onChange={(e) => setItems(upd(items, i, { featured: e.target.checked }))} /> 
                    Featured (in evidenza - apparirà per primo nella lista)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!p.isPromotional} onChange={(e) => setItems(upd(items, i, { isPromotional: e.target.checked }))} /> 
                    Promozionale
                  </label>
                </div>
              </div>
            </div>

            {/* Sezione Dettagli Completa */}
            <div className="mt-6 border-t pt-6">
              <h4 className="font-medium text-foreground mb-4">Dettagli del Pacchetto</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonna sinistra - Dettagli temporali e numerici */}
                <div className="space-y-4">
                  <Input 
                    label="Durata" 
                    value={p.details?.duration ?? ""} 
                    onChange={(e) => updateDetails(i, "duration", e.target.value)} 
                    placeholder="es. 3 mesi, 6 mesi, 1 anno"
                  />
                  
                  <Input 
                    label="Numero Sessioni" 
                    type="number" 
                    value={p.details?.sessions ?? 0} 
                    onChange={(e) => updateDetails(i, "sessions", Number(e.target.value))} 
                    placeholder="es. 12 sessioni"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Note Aggiuntive</label>
                    <textarea 
                      className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" 
                      rows={3} 
                      value={p.details?.notes ?? ""} 
                      onChange={(e) => updateDetails(i, "notes", e.target.value)} 
                      placeholder="Note aggiuntive sul pacchetto..."
                    />
                  </div>
                </div>

                {/* Colonna destra - Liste dinamiche */}
                <div className="space-y-4">
                  {/* Caratteristiche */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Caratteristiche/Benefici</label>
                    <div className="space-y-2">
                      {(p.details?.features || []).map((feature, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input 
                            value={feature} 
                            onChange={(e) => {
                              const newFeatures = [...(p.details?.features || [])];
                              newFeatures[idx] = e.target.value;
                              updateDetails(i, "features", newFeatures);
                            }}
                            placeholder="Caratteristica..."
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => removeArrayItem(i, "features", idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </div>
                      ))}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addArrayItem(i, "features", "")}
                        className="w-full"
                      >
                        + Aggiungi Caratteristica
                      </Button>
                    </div>
                  </div>

                  {/* Cosa è incluso */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Cosa è Incluso</label>
                    <div className="space-y-2">
                      {(p.details?.includes || []).map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input 
                            value={item} 
                            onChange={(e) => {
                              const newIncludes = [...(p.details?.includes || [])];
                              newIncludes[idx] = e.target.value;
                              updateDetails(i, "includes", newIncludes);
                            }}
                            placeholder="Elemento incluso..."
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => removeArrayItem(i, "includes", idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </div>
                      ))}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addArrayItem(i, "includes", "")}
                        className="w-full"
                      >
                        + Aggiungi Elemento
                      </Button>
                    </div>
                  </div>

                  {/* Requisiti */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Requisiti</label>
                    <div className="space-y-2">
                      {(p.details?.requirements || []).map((req, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input 
                            value={req} 
                            onChange={(e) => {
                              const newRequirements = [...(p.details?.requirements || [])];
                              newRequirements[idx] = e.target.value;
                              updateDetails(i, "requirements", newRequirements);
                            }}
                            placeholder="Requisito..."
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => removeArrayItem(i, "requirements", idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </div>
                      ))}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addArrayItem(i, "requirements", "")}
                        className="w-full"
                      >
                        + Aggiungi Requisito
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function upd(items: Package[], index: number, patch: Partial<Package>): Package[] {
  const next = [...items];
  next[index] = { ...next[index], ...patch } as Package;
  return next;
}


