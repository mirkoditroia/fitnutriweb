"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAvailabilityByDate } from "@/lib/datasource";
import { format, addDays, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { type Package } from "@/lib/data";
import { DateCalendar as SharedDateCalendar } from "@/components/DateCalendar";
import { getDirectState } from "@/lib/directState";
import { getPackages } from "@/lib/datasource";

// Schema di validazione
const schema = z.object({
  name: z.string().min(2, "Nome troppo corto"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
  // rimosso campo preferenza canale
  date: z.string().min(1, "Seleziona una data"),
  slot: z.string().min(1, "Seleziona un orario disponibile"),
  location: z.enum(["online", "studio"]).optional(),
  packageId: z.string().optional(),
  // priority rimossa
  notes: z.string().optional(), // Note del cliente (sezione "Parlami di te")
});

type FormValues = z.infer<typeof schema>;

interface BookingFormProps {
  packageId?: string;
  isFreeConsultation?: boolean;
}

// Componente Calendario
function DateCalendar({ 
  availableDates, 
  selectedDate, 
  onDateSelect, 
  showPromotionalBanner 
}: { 
  availableDates: string[]; 
  selectedDate: string; 
  onDateSelect: (date: string) => void; 
  showPromotionalBanner: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  const isDateSelected = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return selectedDate === dateStr;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (isDateAvailable(date)) {
      onDateSelect(dateStr);
      setIsOpen(false);
    }
  };

  const getDayClasses = (date: Date) => {
    let classes = "w-10 h-10 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all duration-200";
    
    if (isToday(date)) {
      classes += " ring-2 ring-primary/50";
    }
    
    if (isDateSelected(date)) {
      classes += " bg-primary text-primary-foreground font-semibold";
    } else if (isDateAvailable(date)) {
      classes += " bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium border border-emerald-200";
    } else {
      classes += " bg-gray-100 text-gray-400 cursor-not-allowed";
    }
    
    return classes;
  };

  return (
    <div className="relative">
      {/* Input trigger */}
      <div 
        className="w-full p-3 border border-border rounded-lg bg-background text-foreground cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
            {selectedDate 
              ? format(new Date(selectedDate), "EEEE d MMMM yyyy", { locale: it })
              : "Seleziona una data"
            }
          </span>
          <span className="text-muted-foreground">📅</span>
        </div>
      </div>

      {/* Calendario dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
          {/* Header calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ←
            </button>
            <h3 className="font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: it })}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              →
            </button>
          </div>

          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(day => (
              <div key={day} className="w-10 h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Griglia giorni */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => (
              <div
                key={index}
                className={getDayClasses(day)}
                onClick={() => handleDateClick(day)}
              >
                {format(day, "d")}
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-100 rounded-full border border-emerald-200"></div>
                <span className="text-muted-foreground">Disponibile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
                <span className="text-muted-foreground">Non disponibile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Selezionato</span>
              </div>
            </div>
          </div>

          {/* Informazioni aggiuntive */}
          {showPromotionalBanner && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-center">
              <p className="text-xs text-green-700">
                🎯 Solo date con slot promozionali disponibili
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay per chiudere il calendario */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function BookingForm({ adminMode = false, requirePackage = false, hidePackageSelect = false }: { adminMode?: boolean; requirePackage?: boolean; hidePackageSelect?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [location, setLocation] = useState<"online" | "studio" | null>(null);
  const availableSlotsRef = useRef<string[]>([]);
  const packagesRef = useRef<Package[]>([]);
  
  // NUOVO SISTEMA DIRETTO - SEMPLICE E AFFIDABILE
  const [directState, setDirectStateLocal] = useState(getDirectState());
  
  // Derivato dal directState
  const isFreeConsultation = directState.isFreeConsultation;

  // Schema di validazione con validazione personalizzata
  const validationSchema = schema.refine((data) => {
    if (!data.date || !data.slot) return true;
    return availableSlotsRef.current.includes(data.slot);
  }, {
    message: "L'orario selezionato non è più disponibile",
    path: ["slot"]
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      slot: "",
      notes: "",
      packageId: directState.selectedPackageId || "",
      // preferenza canale rimossa
    },
  });

  // NUOVO SISTEMA DIRETTO: Carica pacchetti e applica stato
  useEffect(() => {
    console.log("BookingForm: NUOVO SISTEMA - Inizializzazione");
    
    // 1. Carica i pacchetti direttamente
    const loadPackages = async () => {
      try {
        console.log("BookingForm: Caricamento pacchetti...");
        const pkgs = await getPackages();
        console.log("BookingForm: Pacchetti caricati:", pkgs);
        const finalPackages = pkgs || [];
        setPackages(finalPackages);
        packagesRef.current = finalPackages;
        
        // 2. Applica lo stato diretto
        const currentDirectState = getDirectState();
        console.log("BookingForm: Stato diretto attuale:", currentDirectState);
        
        if (currentDirectState.selectedPackageId && finalPackages.length > 0) {
          const selectedPkg = finalPackages.find(p => p.id === currentDirectState.selectedPackageId);
          console.log("BookingForm: Pacchetto trovato:", selectedPkg);
          
          if (selectedPkg) {
            setSelectedPackage(selectedPkg);
            setValue("packageId", selectedPkg.id || "");
            console.log("BookingForm: SUCCESSO - Form precompilato con:", selectedPkg.title);
          }
        }
      } catch (error) {
        console.error("BookingForm: Errore caricamento pacchetti:", error);
      }
    };
    
    loadPackages();
    
    // 3. Ascolta i cambiamenti di stato diretto
    const handleDirectStateChange = (event: CustomEvent) => {
      console.log("BookingForm: Cambio stato diretto:", event.detail);
      setDirectStateLocal(event.detail);
      
      if (event.detail.selectedPackageId && packagesRef.current.length > 0) {
        const selectedPkg = packagesRef.current.find(p => p.id === event.detail.selectedPackageId);
        if (selectedPkg) {
          setSelectedPackage(selectedPkg);
          setValue("packageId", selectedPkg.id || "");
          console.log("BookingForm: Form aggiornato via evento:", selectedPkg.title);
        }
      }
    };
    
    window.addEventListener('directStateChange', handleDirectStateChange as EventListener);
    
    return () => {
      window.removeEventListener('directStateChange', handleDirectStateChange as EventListener);
    };
  }, [setValue]);

  // Gestisce il cambio di pacchetto
  const handlePackageChange = (newPackage: Package | null) => {
    setSelectedPackage(newPackage);
    setValue("packageId", newPackage?.id || "");
    setValue("date", "");
    setValue("slot", "");
    setSelectedDate("");
    setAvailableSlots([]);
    setAvailableDates([]);
  };

  // Aggiorna il ref quando cambiano gli slot disponibili
  useEffect(() => {
    availableSlotsRef.current = availableSlots;
  }, [availableSlots]);

  // Genera le date disponibili e controlla la disponibilità
  useEffect(() => {
    // Se non c'è un pacchetto selezionato, usa slot normali

    const generateAvailableDates = async () => {
      // Genera solo le prossime 14 date invece di 30 per migliorare le performance
      const allDates = Array.from({ length: 14 }, (_, i) => {
        const date = addDays(startOfDay(new Date()), i);
        return format(date, "yyyy-MM-dd");
      });

      // Filtra solo le date con slot disponibili
      
      // Controlla la disponibilità in parallelo per migliorare le performance
      const availabilityPromises = allDates.map(async (date) => {
        try {
          const availability = await getAvailabilityByDate(date);
          if (availability) {
            // Usa gli slot promozionali se è un flusso di consultazione gratuita
            if (isFreeConsultation || selectedPackage?.isPromotional === true) {
              if (availability.freeConsultationSlots && availability.freeConsultationSlots.length > 0) {
                return date;
              }
            } else {
              // Per consulenze normali, controlla gli slot standard
              const onlinePool = availability.onlineSlots ?? [];
              const studioPool = availability.inStudioSlots ?? [];
              // Se l'utente non ha ancora scelto la sede, considera entrambe le liste; altrimenti usa solo quella selezionata
              const pool = location === null
                ? [...onlinePool, ...studioPool]
                : (location === "online" ? onlinePool : studioPool);
              if (pool && pool.length > 0) {
                return date;
              }
            }
          }
          return null;
        } catch (error) {
          console.error(`Errore nel controllo disponibilità per ${date}:`, error);
          return null;
        }
      });

      // Attendi tutte le chiamate in parallelo
      const results = await Promise.all(availabilityPromises);
      const validDates = results.filter((date): date is string => date !== null);
      
      setAvailableDates(validDates);
    };

    generateAvailableDates();
  }, [selectedPackage, isFreeConsultation, location]);

  // Carica la disponibilità per la data selezionata
  useEffect(() => {
    if (!selectedDate) return;

    const loadAvailability = async () => {
      try {
        const availability = await getAvailabilityByDate(selectedDate);
        if (availability) {
          if (isFreeConsultation || selectedPackage?.isPromotional === true) {
            // Per consultazioni gratuite, mostra solo slot promozionali
            setAvailableSlots(availability.freeConsultationSlots || []);
          } else {
            // Per consulenze normali, mostra slot in base alla sede
            const onlinePool = availability.onlineSlots ?? [];
            const studioPool = availability.inStudioSlots ?? [];
            const legacyPool = availability.slots ?? [];
            const pool = location === null
              ? ((onlinePool.length || studioPool.length) ? [...onlinePool, ...studioPool] : legacyPool)
              : (location === "online" ? onlinePool : studioPool);
            setAvailableSlots(pool);
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento disponibilità:", error);
        setAvailableSlots([]);
      }
    };

    loadAvailability();
  }, [selectedDate, selectedPackage, isFreeConsultation, location]);

  // RIMOSSO: Vecchio sistema di eventi sostituito da stato globale

  const onSubmit = async (data: FormValues) => {
    // Consenti esplicitamente l'invio anche senza pacchetto in Admin
    if (requirePackage && !selectedPackage && !adminMode) {
      alert("Seleziona un pacchetto oppure prosegui senza selezione.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Aggiungi il flag per la consultazione gratuita
      const bookingData = {
        ...data,
        isFreeConsultation: isFreeConsultation,
        status: "pending" as const,
      };

      // In produzione (Firebase) usa la funzione datasource ufficiale
      try {
        const { createBooking } = await import("@/lib/datasource");
        const bookingStatus: "pending" | "confirmed" = adminMode ? "confirmed" : "pending";
        // Tipi stretti coerenti con `Booking`
        await createBooking({
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone || undefined,
          packageId: selectedPackage?.id,
          date: bookingData.date,
          slot: bookingData.slot,
          location: (isFreeConsultation || selectedPackage?.isPromotional === true) ? "online" : (location as "online" | "studio"),
          status: bookingStatus,
          // preferenza canale rimossa
          notes: bookingData.notes,
          isFreeConsultation,
        });
        // Simula response.ok
        const response = { ok: true } as const;
        if (!response.ok) throw new Error("failed");
      } catch (e) {
        // Fallback locale
        const response = await fetch("/api/localdb/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });
        if (!response.ok) throw new Error("failed");
      }
      {
        alert(isFreeConsultation 
          ? "Prenotazione per i 10 minuti consultivi gratuiti inviata con successo!" 
          : "Prenotazione inviata con successo!"
        );
        // Reset del form
      setValue("name", "");
      setValue("email", "");
      setValue("phone", "");
      setValue("date", "");
      setValue("slot", "");
        setValue("notes", "");
        setSelectedDate("");
        setAvailableSlots([]);
        // Reset del pacchetto selezionato per tornare al selettore
        setSelectedPackage(null);
      setValue("packageId", "");
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore nell'invio della prenotazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostra banner informativo per pacchetti promozionali
  const showPromotionalBanner = selectedPackage?.isPromotional;

  // DEBUG: Log stato del componente
  console.log("BookingForm: RENDER - selectedPackage:", selectedPackage);
  console.log("BookingForm: RENDER - packages:", packages);
  console.log("BookingForm: RENDER - packages.length:", packages.length);
  // Mantieni struttura invariata anche senza pacchetto selezionato

  return (
    <div className="space-y-6">
      {/* Banner per pacchetto selezionato */}
      {selectedPackage && (
        <div className={`border border-border rounded-lg p-4 ${showPromotionalBanner ? 'bg-green-50 border-green-200' : 'bg-card'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${showPromotionalBanner ? 'bg-green-100' : 'bg-primary/10'}`}>
              <span className="text-lg">{showPromotionalBanner ? '🎯' : '📦'}</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${showPromotionalBanner ? 'text-green-800' : 'text-foreground'}`}>
                {selectedPackage.title}
              </h3>
              <p className={`text-sm ${showPromotionalBanner ? 'text-green-700' : 'text-muted-foreground'}`}>
                {selectedPackage.description}
              </p>
              {!showPromotionalBanner && (
                <div className="mt-2">
                  {selectedPackage.hasDiscount && selectedPackage.basePrice && selectedPackage.discountedPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        € {selectedPackage.discountedPrice}
                      </span>
                      <span className="text-sm text-foreground/60 line-through">
                        € {selectedPackage.basePrice}
                      </span>
                      {selectedPackage.discountPercentage && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          -{selectedPackage.discountPercentage}%
          </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-primary">
                      € {selectedPackage.price}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPackage.paymentText || "pagabile mensilmente"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form di prenotazione */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Selettore Pacchetto */}
      <div>
          <label className="block text-sm font-medium mb-2">
            Pacchetto
          </label>
          <select
            value={selectedPackage?.id || ""}
            onChange={(e) => {
              const val = e.target.value;
              const newPackage = packages.find(p => p.id === val);
              handlePackageChange(newPackage || null);
            }}
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">Seleziona un pacchetto</option>
            {packages.map((pkg) => {
              // Determina il prezzo da mostrare
              let displayPrice = "";
              if (pkg.isPromotional) {
                displayPrice = "(Gratuito)";
              } else if (pkg.hasDiscount && pkg.basePrice && pkg.discountedPrice) {
                displayPrice = `- €${pkg.discountedPrice} (scontato da €${pkg.basePrice})`;
              } else {
                displayPrice = `- €${pkg.price}`;
              }
              
              return (
                <option key={pkg.id} value={pkg.id || ""}>
                  {pkg.title} {displayPrice}
                </option>
              );
            })}
        </select>
          <p className="text-xs text-muted-foreground mt-1">
            Puoi cambiare pacchetto in qualsiasi momento
          </p>
        </div>

        {/* Nome */}
        <div>
          <Input
            label="Nome completo *"
            {...register("name")}
            placeholder="Il tuo nome"
          />
          {errors.name && (
            <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Input
            label="Email *"
            type="email"
            {...register("email")}
            placeholder="la-tua-email@esempio.com"
          />
          {errors.email && (
            <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Telefono */}
        <div>
          <Input
            label="Telefono (opzionale)"
            {...register("phone")}
            placeholder="+39 123 456 7890"
          />
        </div>

        {/* Sede appuntamento - PRIMA della data */}
        {!(showPromotionalBanner || isFreeConsultation) && (
          <div>
            <label className="block text-sm font-medium mb-2">Sede appuntamento</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLocation("online")}
                className={`px-4 py-2 border rounded-lg text-sm ${location === "online" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >
                🌐 Online
              </button>
              <button
                type="button"
                onClick={() => setLocation("studio")}
                className={`px-4 py-2 border rounded-lg text-sm ${location === "studio" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >
                🏢 In studio
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per consultazioni gratuite la sede è sempre Online.</p>
        </div>
      )}

        {/* Riepilogo pacchetto rimosso */}

        {/* Selettore Pacchetto (opzionale per admin) */}
        {adminMode && requirePackage && !hidePackageSelect && (
      <div>
            <label className="block text-sm font-medium mb-2">Seleziona pacchetto</label>
            <select
              value={watch("packageId")}
              onChange={(e) => {
                const id = e.target.value;
                setValue("packageId", id);
                const found = packages.find(p => p.id === id) || null;
                setSelectedPackage(found);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Nessun pacchetto</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
        </select>
      </div>
        )}

        {/* Data con calendario interattivo (sempre visibile) */}
        <div>
            <label className="block text-sm font-medium mb-2">
              Data * {showPromotionalBanner && <span className="text-green-600">(Solo date con disponibilità)</span>}
            </label>
            <DateCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setValue("date", date);
                setValue("slot", ""); // Reset slot quando cambia data
              }}
              showPromotionalBanner={showPromotionalBanner || false}
            />
            {errors.date && (
              <p className="text-destructive text-sm mt-1">{errors.date.message}</p>
            )}
            {availableDates.length === 0 && (
              <p className="text-muted-foreground text-sm mt-1">
                {showPromotionalBanner 
                  ? "Nessuna data disponibile per consultazioni gratuite" 
                  : "Nessuna data disponibile per consulenze"
                }
              </p>
            )}
        </div>

        {/* preferenza canale rimossa */}

        

        {/* Slot orari */}
        {selectedDate && availableSlots.length > 0 && (
      <div>
            <label className="block text-sm font-medium mb-2">
              Orario disponibile * {showPromotionalBanner && <span className="text-green-600">(Slot promozionali)</span>}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setValue("slot", slot)}
                  className={`p-3 border rounded-lg text-sm transition-colors ${
                    watch("slot") === slot
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {(() => {
                    // Renderizza orari in formato HH:mm se slot è formato con data ISO
                    // e mantiene già HH:mm se è semplice
                    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(slot)) {
                      try {
                        const d = new Date(slot);
                        const hh = String(d.getHours()).padStart(2, "0");
                        const mm = String(d.getMinutes()).padStart(2, "0");
                        return `${hh}:${mm}`;
                      } catch {
                        return slot;
                      }
                    }
                    return slot;
                  })()}
                </button>
              ))}
            </div>
            {errors.slot && (
              <p className="text-destructive text-sm mt-1">{errors.slot.message}</p>
        )}
      </div>
        )}

        {/* priorità rimossa */}

        {/* Sezione "Parlami di te" */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Parlami di te
      </label>
          <textarea
            {...register("notes")}
            placeholder="Raccontaci i tuoi obiettivi, esperienze precedenti, preferenze alimentari, eventuali limitazioni o qualsiasi altra informazione che ritieni importante per la tua consulenza..."
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground min-h-[120px] resize-y"
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Queste informazioni ci aiuteranno a preparare una consulenza più personalizzata per te
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting 
            ? "Invio in corso..." 
            : !selectedPackage
              ? "Invia richiesta"
              : showPromotionalBanner 
                ? "Prenota Consultazione Gratuita" 
                : "Prenota Consulenza"
          }
        </Button>

        {/* Informazioni aggiuntive per consultazione gratuita */}
        {selectedPackage && showPromotionalBanner && (
          <div className="text-center text-sm text-muted-foreground">
            <p>* La consultazione gratuita dura 10 minuti</p>
            <p>* Solo per nuovi clienti</p>
            <p>* Valutazione obiettivi e piano personalizzato</p>
      </div>
        )}
    </form>
    </div>
  );
}
