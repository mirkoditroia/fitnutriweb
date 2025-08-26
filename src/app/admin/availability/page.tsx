"use client";
import { useState, useEffect } from "react";
import { getAvailabilityByDate, upsertAvailabilityForDate } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { type Availability } from "@/lib/data";

// Componente Orologio per selezione orario
function TimePicker({ value, onChange, label }: { value: string; onChange: (time: string) => void; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(":").map(Number);
      setSelectedHour(hour);
      setSelectedMinute(minute);
    }
  }, [value]);

  const handleTimeSelect = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // Solo multipli di 5

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2 text-foreground">{label}</label>
      <div 
        className="w-full p-2 border border-border rounded bg-background text-foreground cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Seleziona orario"}
        </span>
        <span className="text-muted-foreground">🕐</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
          <div className="text-center mb-4">
            <h4 className="font-medium text-foreground">Seleziona Orario</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Selezione ore */}
            <div>
              <label className="block text-sm font-medium mb-2 text-center">Ore</label>
              <div className="max-h-32 overflow-y-auto border border-border rounded p-2">
                <div className="grid grid-cols-3 gap-1">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setSelectedHour(hour)}
                      className={`p-2 text-sm rounded transition-colors ${
                        selectedHour === hour
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {hour.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selezione minuti (solo multipli di 5) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-center">Minuti</label>
              <div className="max-h-32 overflow-y-auto border border-border rounded p-2">
                <div className="grid grid-cols-3 gap-1">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      onClick={() => setSelectedMinute(minute)}
                      className={`p-2 text-sm rounded transition-colors ${
                        selectedMinute === minute
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTimeSelect} 
              className="flex-1"
            >
              Conferma
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annulla
            </Button>
          </div>

          {/* Overlay per chiudere */}
          <div 
            className="fixed inset-0 -z-10" 
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [interval, setInterval] = useState(60);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [promotionalStart, setPromotionalStart] = useState("09:00");
  const [promotionalEnd, setPromotionalEnd] = useState("18:00");
  const [consultationDuration, setConsultationDuration] = useState(10); // Durata in minuti
  const [gapBetweenConsultations, setGapBetweenConsultations] = useState(10); // Gap in minuti
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [showFreeConsultationSlots, setShowFreeConsultationSlots] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [viewMode, setViewMode] = useState("normal"); // "normal" or "promotional"
  
  const date = yyyyMmDd(selectedDate);

  const load = async () => {
    const res = await getAvailabilityByDate(date);
    if (res) {
      setAvailability(res);
    } else {
      setAvailability({ date, slots: [], freeConsultationSlots: [] });
    }
  };

  const generate = () => {
    if (!selectedDate) return;
    
    const slots: string[] = [];
    const freeConsultationSlots: string[] = [];
    
    if (viewMode === "normal") {
      // Genera slot normali con intervallo personalizzabile (deve essere multiplo di 5)
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      
      let currentTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      while (currentTime <= endTime) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
        currentTime += interval;
      }
    } else {
      // Genera slot promozionali con durata e gap personalizzabili (solo multipli di 5)
      const [startHour, startMinute] = promotionalStart.split(":").map(Number);
      const [endHour, endMinute] = promotionalEnd.split(":").map(Number);
      
      // Calcola l'intervallo totale (durata + gap) - deve essere multiplo di 5
      const totalInterval = consultationDuration + gapBetweenConsultations;
      
      for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = 0; minute < 60; minute += totalInterval) {
          // Salta gli slot prima dell'ora di inizio
          if (hour === startHour && minute < startMinute) continue;
          // Salta gli slot dopo l'ora di fine (considerando la durata)
          if (hour === endHour && (minute + consultationDuration) > endMinute) continue;
          
          // Formatta l'orario con padding
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          
          freeConsultationSlots.push(`${formattedHour}:${formattedMinute}`);
        }
      }
    }
    
    setAvailability({
      date: yyyyMmDd(selectedDate),
      slots: viewMode === "normal" ? slots : (availability?.slots || []),
      freeConsultationSlots: viewMode === "promotional" ? freeConsultationSlots : (availability?.freeConsultationSlots || [])
    });
  };

  const save = async () => {
    if (availability) {
      await upsertAvailabilityForDate(date, availability.slots, availability.freeConsultationSlots);
      toast.success("Disponibilità salvata");
    }
  };

  const addTimeSlot = (time: string) => {
    if (!availability) return;
    
    const currentSlots = viewMode === "promotional" 
      ? (availability.freeConsultationSlots || [])
      : (availability.slots || []);
    
    if (!currentSlots.includes(time)) {
      const updatedSlots = [...currentSlots, time].sort();
      
      if (viewMode === "promotional") {
        setAvailability({
          ...availability,
          freeConsultationSlots: updatedSlots
        });
      } else {
        setAvailability({
          ...availability,
          slots: updatedSlots
        });
      }
      toast.success(`Orario ${time} aggiunto`);
    } else {
      toast.error(`L'orario ${time} è già presente`);
    }
  };

  const removeTimeSlot = (slot: string) => {
    if (!availability) return;
    
    const currentSlots = viewMode === "promotional" 
      ? (availability.freeConsultationSlots || [])
      : (availability.slots || []);
    
    const updatedSlots = currentSlots.filter(s => s !== slot);
    
    if (viewMode === "promotional") {
      setAvailability({
        ...availability,
        freeConsultationSlots: updatedSlots
      });
    } else {
      setAvailability({
        ...availability,
        slots: updatedSlots
      });
    }
    toast.success(`Orario ${slot} rimosso`);
  };

  const clearAllSlots = () => {
    if (!availability) return;
    
    if (viewMode === "promotional") {
      setAvailability({
        ...availability,
        freeConsultationSlots: []
      });
    } else {
      setAvailability({
        ...availability,
        slots: []
      });
    }
    toast.success("Tutti gli orari sono stati rimossi");
  };

  // Carica disponibilità quando cambia la data
  useEffect(() => {
    load();
  }, [date]);

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground pt-4">📅 Gestione Disponibilità</h1>
      
      {/* Controlli per generazione slot */}
      <div className="bg-card border border-border rounded-lg p-6 mt-4 space-y-6 shadow-sm">
        {/* Toggle modalità */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={viewMode === "normal" ? "primary" : "outline"}
            onClick={() => setViewMode("normal")}
            className="flex items-center gap-2 px-6 py-3"
          >
            📅 Slot Normali
          </Button>
          <Button
            variant={viewMode === "promotional" ? "primary" : "outline"}
            onClick={() => setViewMode("promotional")}
            className="flex items-center gap-2 px-6 py-3"
          >
            🎯 Slot Consultazioni Gratuite
          </Button>
        </div>
        
        {/* Controlli specifici per modalità */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">📅 Data</label>
            <DatePicker
              selected={selectedDate}
              onChange={(d) => d && setSelectedDate(d)}
              dateFormat="dd/MM/yyyy"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              minDate={new Date()}
            />
          </div>
          
          {viewMode === "normal" && (
            <>
              <TimePicker
                label="🕐 Inizio"
                value={start}
                onChange={setStart}
              />
              <TimePicker
                label="🕐 Fine"
                value={end}
                onChange={setEnd}
              />
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">⏱️ Intervallo (min)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">Solo multipli di 5</p>
              </div>
            </>
          )}
          
          {viewMode === "promotional" && (
            <div className="col-span-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TimePicker
                  label="🕐 Inizio consultazioni gratuite"
                  value={promotionalStart}
                  onChange={setPromotionalStart}
                />
                <TimePicker
                  label="🕐 Fine consultazioni gratuite"
                  value={promotionalEnd}
                  onChange={setPromotionalEnd}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">⏱️ Durata consultazione (minuti)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={consultationDuration}
                    onChange={(e) => setConsultationDuration(Number(e.target.value))}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Solo multipli di 5</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">⏱️ Gap tra consultazioni (minuti)</label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    step="5"
                    value={gapBetweenConsultations}
                    onChange={(e) => setGapBetweenConsultations(Number(e.target.value))}
                    className="w-full p-2 border border-border rounded bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Solo multipli di 5</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Informazioni:</strong> Gli slot promozionali vengono generati automaticamente con durata di {consultationDuration} minuti 
                  e gap di {gapBetweenConsultations} minuti tra le consultazioni, nel range di ore specificato.
                  <br />
                  <span className="text-xs mt-2 block">
                    <strong>Esempio:</strong> con durata {consultationDuration} min e gap {gapBetweenConsultations} min, 
                    ogni slot sarà distanziato di {consultationDuration + gapBetweenConsultations} minuti.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Azioni principali */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button onClick={load} variant="outline" className="flex items-center gap-2">
            🔄 Carica esistenti
          </Button>
          <Button onClick={generate} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            ⚡ {viewMode === "normal" ? "Genera slot normali" : "Genera slot promozionali"}
          </Button>
          <Button onClick={save} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            💾 Salva
          </Button>
        </div>
      </div>

      {/* Gestione slot */}
      {availability && (
        <div className="mt-6 bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            {/* Header con statistiche */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  📅 Disponibilità per {selectedDate.toLocaleDateString("it-IT", { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewMode === "promotional" 
                    ? `🎯 ${availability.freeConsultationSlots?.length || 0} slot consultazioni gratuite configurati`
                    : `📋 ${availability.slots?.length || 0} slot normali configurati`
                  }
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTimeInput(!showTimeInput)}
                  className="flex items-center gap-2"
                >
                  {showTimeInput ? "❌ Chiudi" : "➕ Aggiungi Orario"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllSlots}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  🗑️ Svuota tutti
                </Button>
              </div>
            </div>

            {/* Input per aggiungere orari manualmente */}
            {showTimeInput && (
              <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/20">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <TimePicker
                      label="🕐 Orario specifico"
                      value={newTime}
                      onChange={setNewTime}
                    />
                  </div>
                  <Button 
                    type="button" 
                    size="md"
                    onClick={() => {
                      if (newTime) {
                        addTimeSlot(newTime);
                        setNewTime("");
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    ➕ Aggiungi
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {viewMode === "promotional"
                    ? "🎯 Aggiungi slot dedicati ai 10 minuti consultivi gratuiti" 
                    : "📋 Aggiungi slot per consulenze normali"
                  }
                </p>
              </div>
            )}

            {/* Lista slot configurati */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                {viewMode === "promotional"
                  ? "🎯 Slot Consultazioni Gratuite Configurati:" 
                  : "📋 Slot Normali Configurati:"
                }
              </h4>
              {(() => {
                const currentSlots = viewMode === "promotional" 
                  ? (availability.freeConsultationSlots || [])
                  : (availability.slots || []);
                
                return currentSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {currentSlots.map((slot) => (
                      <div
                        key={slot}
                        className="group relative p-3 border border-border rounded-lg bg-background hover:border-primary/50 transition-all duration-200"
                      >
                        <span className="text-sm font-medium text-foreground">{slot}</span>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(slot)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                          title="Rimuovi orario"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm">
                      {viewMode === "promotional" 
                        ? "Nessuno slot dedicato configurato per questa data" 
                        : "Nessuno slot disponibile per questa data"
                      }
                    </p>
                    <p className="text-xs mt-1">Usa i controlli sopra per generare slot o aggiungi orari manualmente</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function yyyyMmDd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


