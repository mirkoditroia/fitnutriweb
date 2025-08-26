"use client";
import { useState } from "react";
import { getAvailabilityByDate, upsertAvailabilityForDate } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [interval, setInterval] = useState(60);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [slots, setSlots] = useState<string[]>([]);
  
  const date = yyyyMmDd(selectedDate);

  const load = async () => {
    const res = await getAvailabilityByDate(date);
    setSlots(res?.slots ?? []);
  };

  const generate = () => {
    const list: string[] = [];
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const d = new Date(date + "T00:00:00");
    let cur = new Date(d);
    cur.setHours(sh, sm, 0, 0);
    const endDt = new Date(d);
    endDt.setHours(eh, em, 0, 0);
    while (cur <= endDt) {
      list.push(cur.toISOString());
      cur = new Date(cur.getTime() + interval * 60000);
    }
    setSlots(list);
  };

  const save = async () => {
    await upsertAvailabilityForDate(date, slots);
    toast.success("Disponibilità salvata");
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground pt-4">Disponibilità</h1>
      <div className="bg-card border border-border rounded-lg p-6 mt-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <DatePicker
              selected={selectedDate}
              onChange={(d) => d && setSelectedDate(d)}
              dateFormat="dd/MM/yyyy"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              minDate={new Date()}
            />
          </div>
          <Input label="Inizio" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input label="Fine" value={end} onChange={(e) => setEnd(e.target.value)} />
          <Input label="Intervallo (min)" type="number" value={interval} onChange={(e) => setInterval(Number(e.target.value))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={load}>Carica esistenti</Button>
          <Button onClick={generate}>Genera slot</Button>
          <Button onClick={save}>Salva</Button>
        </div>
      </div>
      <div className="mt-4 bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold text-foreground">Slot ({slots.length})</h2>
        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {slots.map((s, i) => (
            <li key={i} className="rounded-md border border-border px-3 py-2 bg-background">{new Date(s).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

function yyyyMmDd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


