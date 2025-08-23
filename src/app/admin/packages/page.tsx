"use client";
import { useEffect, useState } from "react";
import { getPackages, upsertPackage, type Package } from "@/lib/datasource";
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

  const add = () => setItems([...items, { title: "", description: "", price: 0, isActive: true }]);

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold">Pacchetti</h1>
      <div className="mt-4 flex justify-end"><Button onClick={add}>Aggiungi</Button></div>
      <div className="mt-4 grid gap-4">
        {items.map((p, i) => (
          <div key={p.id ?? i} className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Titolo" value={p.title} onChange={(e) => setItems(upd(items, i, { title: e.target.value }))} />
            <Input label="Prezzo" type="number" value={p.price} onChange={(e) => setItems(upd(items, i, { price: Number(e.target.value) }))} />
            <div>
              <Input label="Immagine URL" value={p.imageUrl ?? ""} onChange={(e) => setItems(upd(items, i, { imageUrl: e.target.value }))} />
              <div className="mt-2"><UploadButton folder="packages" onUploaded={(url) => setItems(upd(items, i, { imageUrl: url }))} /></div>
            </div>
            <Input label="Badge" value={p.badge ?? ""} onChange={(e) => setItems(upd(items, i, { badge: e.target.value }))} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrizione</label>
              <textarea className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" rows={4} value={p.description} onChange={(e) => setItems(upd(items, i, { description: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.isActive} onChange={(e) => setItems(upd(items, i, { isActive: e.target.checked }))} /> Attivo</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.featured} onChange={(e) => setItems(upd(items, i, { featured: e.target.checked }))} /> Featured</label>
            <div className="sm:col-span-2"><Button onClick={() => save(i)}>Salva</Button></div>
          </div>
        ))}
      </div>
    </main>
  );
}

function upd(items: Package[], index: number, patch: Partial<Package>): Package[] {
  const next = [...items];
  next[index] = { ...next[index], ...patch } as Package;
  return next;
}


