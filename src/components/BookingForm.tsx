"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { createBooking, getAvailabilityByDate, getPackages, type Booking, type Package } from "@/lib/datasource";
import { format, addDays } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function BookingForm({ preselectedPackageId }: { preselectedPackageId?: string }) {
  const params = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  
  // Ref per accedere agli slot disponibili nella validazione
  const availableSlotsRef = useRef<string[]>([]);
  
  // Aggiorna il ref quando cambiano gli slot disponibili
  useEffect(() => {
    availableSlotsRef.current = availableSlots;
  }, [availableSlots]);

  // Schema di validazione dinamico che usa il ref per controllare la disponibilità
  const schema = z.object({
    name: z.string().min(2, "Nome troppo corto"),
    email: z.string().email("Email non valida"),
    phone: z.string().optional(),
    channelPreference: z.enum(["whatsapp", "email"]).default("whatsapp"),
    date: z.string().min(1, "Seleziona una data"),
    slot: z.string().min(1, "Seleziona un orario disponibile"),
    packageId: z.string().optional(),
    priority: z.boolean().optional(),
  }).refine((data) => {
    // Validazione aggiuntiva: lo slot deve essere effettivamente disponibile
    if (!data.date || !data.slot) return true; // Skip se mancano date o slot
    
    // Controlla che lo slot sia negli slot disponibili
    return availableSlotsRef.current.includes(data.slot);
  }, {
    message: "L'orario selezionato non è più disponibile",
    path: ["slot"]
  });

  type FormValues = z.input<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageId: preselectedPackageId,
      channelPreference: "whatsapp",
      priority: false,
    },
  });

  // Load packages
  useEffect(() => {
    getPackages().then(setPackages);
  }, []);

  // Handle package preselection from URL or prop
  useEffect(() => {
    const packageId = params.get("packageId") || preselectedPackageId;
    if (packageId && packages.length > 0) {
      const pkg = packages.find(p => p.id === packageId || p.title === packageId);
      if (pkg) {
        setValue("packageId", pkg.id || "");
        setSelectedPackage(pkg);
      }
    }
  }, [params, preselectedPackageId, setValue, packages]);

  // Load available slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setValue("date", dateStr);
    getAvailabilityByDate(dateStr).then(availability => {
      setAvailableSlots(availability?.slots || []);
    });
  }, [selectedDate, setValue]);

  const minDate = addDays(new Date(), 1); // Tomorrow

  const onSubmit = async (values: FormValues) => {
    try {
      const booking: Booking = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        packageId: values.packageId,
        date: values.date, // Already in YYYY-MM-DD format
        slot: values.slot,
        status: "pending",
        priority: !!values.priority,
        channelPreference: values.channelPreference ?? "whatsapp",
      };
      await createBooking(booking);
      toast.success("✅ Prenotazione inviata con successo! Ti contatteremo a breve.");
      // Reset form completely
      setSelectedDate(null);
      setSelectedPackage(null);
      setAvailableSlots([]);
      // Clear all form fields
      setValue("name", "");
      setValue("email", "");
      setValue("phone", "");
      setValue("date", "");
      setValue("slot", "");
      setValue("packageId", "");
      setValue("priority", false);
    } catch (e) {
      console.error(e);
      toast.error("Impossibile inviare la prenotazione. Riprova.");
    }
  };

  return (
    <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)}>
      {selectedPackage && (
        <div className="sm:col-span-2">
          <span className="chip bg-primary/15 text-primary">
            📦 Pacchetto selezionato: {selectedPackage.title}
          </span>
        </div>
      )}
      <Input label="Nome e cognome" {...register("name")} error={errors.name?.message} />
      <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
      <Input label="Telefono" {...register("phone")} />
      <div>
        <label className="block text-sm font-medium mb-1">Contatto preferito</label>
        <select className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" {...register("channelPreference")}>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Data</label>
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          dateFormat="dd/MM/yyyy"
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
          minDate={minDate}
          placeholderText="Seleziona una data"
        />
        {errors.date?.message && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Orario</label>
        <select className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" {...register("slot")}>
          <option value="">Seleziona orario</option>
          {availableSlots.map((slot) => (
            <option key={slot} value={slot}>
              {new Date(slot).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
            </option>
          ))}
        </select>
        {errors.slot?.message && <p className="mt-1 text-xs text-destructive">{errors.slot.message}</p>}
        {selectedDate && availableSlots.length === 0 && (
          <p className="mt-1 text-xs text-destructive">Nessun orario disponibile per questa data</p>
        )}
      </div>
      <input type="hidden" {...register("packageId")} />
      <label className="flex items-center gap-2 text-sm mt-2">
        <input type="checkbox" {...register("priority")} />
        Voglio iniziare da subito
      </label>
      <div className="sm:col-span-2 mt-2">
        <Button type="submit" disabled={isSubmitting || !selectedDate || availableSlots.length === 0}>
          {isSubmitting ? "Invio..." : "Prenota"}
        </Button>
      </div>
    </form>
  );
}


