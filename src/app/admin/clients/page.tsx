"use client";
import { useState } from "react";
import { getClientByEmail, upsertClient, type ClientCard } from "@/lib/datasource";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function AdminClientsPage() {
  const [c, setC] = useState<ClientCard>({ name: "", email: "" });

  const lookup = async () => {
    if (!c.email) return;
    const res = await getClientByEmail(c.email);
    if (res) setC(res);
    else toast("Nessun cliente trovato, puoi crearlo");
  };

  const save = async () => {
    const id = await upsertClient(c);
    setC({ ...c, id });
    toast.success("Cliente salvato");
  };

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold">Clienti</h1>
      <div className="card p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
        <div className="flex items-end"><Button onClick={lookup}>Cerca</Button></div>
        <Input label="Nome" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        <Input label="Telefono" value={c.phone ?? ""} onChange={(e) => setC({ ...c, phone: e.target.value })} />
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Note</label>
          <textarea className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" rows={4} value={c.notes ?? ""} onChange={(e) => setC({ ...c, notes: e.target.value })} />
        </div>
        <div className="sm:col-span-2"><Button onClick={save}>Salva</Button></div>
      </div>
    </main>
  );
}


