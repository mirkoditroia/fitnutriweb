"use client";
import { useEffect, useState } from "react";
import { listBookings, updateBooking, deleteBooking, getPackages, createBooking, getAvailabilityByDate, createClientFromPendingBooking, type Booking, type Package } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DateCalendar as SharedDateCalendar } from "@/components/DateCalendar";
import { BookingForm as ClientBookingForm } from "@/components/BookingForm";
// Reuse booking form calendar UI
// Minimal inline version inspired by BookingForm's DateCalendar for consistency could be added later

// Helper function to get package name
const getPackageNameHelper = (packageId: string | undefined, packages: Package[]) => {
  if (!packageId) return "Nessun pacchetto";
  const pkg = packages.find(p => p.id === packageId);
  return pkg ? pkg.title : `Pacchetto ${packageId}`;
};

// Helper function to generate iCal content
const generateICalContent = (bookings: Booking[], startDate: Date, endDate: Date, packages: Package[]) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GZNutrition//Admin Calendar//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // Filter bookings within date range
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    return bookingDate >= startDate && bookingDate <= endDate;
  });

  filteredBookings.forEach(booking => {
    const eventDate = new Date(booking.date);
    const startDateTime = booking.slot ? new Date(booking.slot) : new Date(eventDate);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    ical.push(
      'BEGIN:VEVENT',
      `UID:${booking.id || Math.random().toString(36).substr(2, 9)}@gznutrition.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDateTime)}`,
      `DTEND:${formatDate(endDateTime)}`,
      `SUMMARY:${booking.name} - Consulenza Nutrizionale`,
      `DESCRIPTION:Cliente: ${booking.name}\\nEmail: ${booking.email}\\nTelefono: ${booking.phone || 'Non fornito'}\\nPacchetto: ${getPackageNameHelper(booking.packageId, packages)}\\nStatus: ${booking.status === 'confirmed' ? 'Confermata' : booking.status === 'pending' ? 'In attesa' : 'Rifiutata'}`,
      `STATUS:${booking.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      `ORGANIZER;CN=GZNutrition:mailto:admin@gznutrition.com`,
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${booking.name}:mailto:${booking.email}`,
      'END:VEVENT'
    );
  });

  ical.push('END:VCALENDAR');
  return ical.join('\r\n');
};

// Helper function to download file
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

type ViewMode = "requests" | "manual" | "calendar";

export default function AdminBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("requests");
  
  // Manual booking form state
  const [manualForm, setManualForm] = useState({
    name: "",
    email: "",
    phone: "",
    packageId: "",
    date: "",
    slot: "",
    location: "online" as "online" | "studio",
    notes: ""
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [manualAvailableDates, setManualAvailableDates] = useState<string[]>([]);
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  
  // Edit/Reschedule state
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    packageId: "",
    date: "",
    slot: "",
    status: "pending" as "pending" | "confirmed" | "cancelled",
    notes: ""
  });
  const [editAvailableSlots, setEditAvailableSlots] = useState<string[]>([]);
  const [editSelectedDate, setEditSelectedDate] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const [bookings, packagesList] = await Promise.all([
        listBookings(),
        getPackages()
      ]);
      // Assicurati che bookings sia sempre un array
      setItems(Array.isArray(bookings) ? bookings : []);
      setPackages(Array.isArray(packagesList) ? packagesList : []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Errore nel caricamento dei dati");
      // In caso di errore, imposta array vuoti
      setItems([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPackageName = (packageId?: string) => {
    if (!packageId) return "Nessun pacchetto";
    const pkg = packages.find(p => p.id === packageId);
    return pkg ? pkg.title : `Pacchetto ${packageId}`;
  };

  const handleConfirm = async (booking: Booking) => {
    try {
      await updateBooking({ ...booking, status: "confirmed" });
      await loadData(); // Reload to get fresh data
      toast.success("Prenotazione confermata e cliente creato/aggiornato automaticamente!");
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Errore nella conferma della prenotazione");
    }
  };

  const handleReject = async (booking: Booking) => {
    const confirmed = window.confirm(
      `Sei sicuro di voler rifiutare ed eliminare la prenotazione di ${booking.name}?\n\nQuesta azione non può essere annullata.`
    );
    
    if (!confirmed) return;

    try {
      await deleteBooking(booking.id!);
      await loadData(); // Reload to get fresh data
      toast.success("Prenotazione rifiutata ed eliminata. Cliente creato/aggiornato con status inattivo.");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Errore nell'eliminazione della prenotazione");
    }
  };

  const handleCreateClientFromPending = async (booking: Booking) => {
    try {
      await createClientFromPendingBooking(booking);
      toast.success("Cliente creato/aggiornato dalla prenotazione!");
      await loadData();
    } catch (error) {
      console.error("Error creating client from booking:", error);
      toast.error("Errore nella creazione del cliente");
    }
  };

  // Manual booking functions
  const handleManualDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setManualForm(prev => ({ ...prev, date: dateStr }));
      getAvailabilityByDate(dateStr).then(availability => {
        const pool = manualForm.location === "online"
          ? (availability?.onlineSlots ?? availability?.slots ?? [])
          : (availability?.inStudioSlots ?? []);
        setAvailableSlots(pool);
      });
    } else {
      setAvailableSlots([]);
    }
  };

  // Calcolo date disponibili per manuale (stessa logica del form)
  useEffect(() => {
    const generateDates = async () => {
      const nextDays: string[] = Array.from({ length: 365 }, (_, i) => {
        const d = new Date();
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() + i);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      });

      const selectedPkg = packages.find(p => p.id === manualForm.packageId);
      const isPromotional = !!selectedPkg?.isPromotional;

      const checks = await Promise.all(nextDays.map(async (dateStr) => {
        try {
          const availability = await getAvailabilityByDate(dateStr);
          if (!availability) return null;
          if (isPromotional) {
            return (availability.freeConsultationSlots && availability.freeConsultationSlots.length > 0) ? dateStr : null;
          }
          const onlinePool = availability.onlineSlots ?? availability.slots ?? [];
          const studioPool = availability.inStudioSlots ?? [];
          const pool = manualForm.location === "online" ? onlinePool : studioPool;
          return pool.length > 0 ? dateStr : null;
        } catch {
          return null;
        }
      }));

      setManualAvailableDates(checks.filter((x): x is string => !!x));
    };

    generateDates();
  }, [manualForm.packageId, manualForm.location, packages]);

  // Funzioni per la modifica e rischedulazione
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      name: booking.name,
      email: booking.email,
      phone: booking.phone || "",
      packageId: booking.packageId || "",
      date: booking.date,
      slot: booking.slot || "",
      status: booking.status,
      notes: booking.notes || ""
    });
    setEditSelectedDate(new Date(booking.date));
    
    // Carica gli slot disponibili per la data
    const dateStr = format(new Date(booking.date), "yyyy-MM-dd");
    getAvailabilityByDate(dateStr).then(availability => {
      setEditAvailableSlots(availability?.slots || []);
    }).catch(error => {
      console.error("Errore nel caricamento disponibilità:", error);
      setEditAvailableSlots([]);
    });
  };

  const handleEditDateChange = (date: Date | null) => {
    setEditSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setEditForm(prev => ({ ...prev, date: dateStr }));
      getAvailabilityByDate(dateStr).then(availability => {
        const pool = (editingBooking?.location ?? "online") === "online"
          ? (availability?.onlineSlots ?? availability?.slots ?? [])
          : (availability?.inStudioSlots ?? []);
        setEditAvailableSlots(pool);
      });
    } else {
      setEditAvailableSlots([]);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBooking) return;
    
    try {
      const updatedBooking: Booking = {
        ...editingBooking,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || undefined,
        packageId: editForm.packageId || undefined,
        date: editForm.date,
        slot: editForm.slot || "",
        location: editingBooking.location,
        status: editForm.status,
        notes: editForm.notes || undefined
      };
      
      await updateBooking(updatedBooking);
      toast.success("Prenotazione aggiornata con successo!");
      
      // Reset form e ricarica dati
      setEditingBooking(null);
      setEditForm({
        name: "",
        email: "",
        phone: "",
        packageId: "",
        date: "",
        slot: "",
        status: "pending",
        notes: ""
      });
      setEditSelectedDate(null);
      setEditAvailableSlots([]);
      
      await loadData();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Errore nell'aggiornamento della prenotazione");
    }
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
      packageId: "",
      date: "",
      slot: "",
      status: "pending",
      notes: ""
    });
    setEditSelectedDate(null);
    setEditAvailableSlots([]);
  };

  const handleDelete = async (booking: Booking) => {
    if (!confirm(`Sei sicuro di voler eliminare la prenotazione di ${booking.name}?`)) {
      return;
    }
    
    try {
      await deleteBooking(booking.id!);
      toast.success("Prenotazione eliminata con successo!");
      await loadData();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Errore nell'eliminazione della prenotazione");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualForm.name || !manualForm.email || !manualForm.date) {
      toast.error("Compila almeno nome, email e data");
      return;
    }

    // Validazione aggiuntiva: lo slot deve essere obbligatorio per le prenotazioni manuali
    if (!manualForm.slot) {
      toast.error("Seleziona un orario disponibile per la prenotazione");
      return;
    }

    // Controlla che lo slot sia effettivamente disponibile
    if (!availableSlots.includes(manualForm.slot)) {
      toast.error("L'orario selezionato non è più disponibile");
      return;
    }

    try {
      const newBooking = {
        name: manualForm.name,
        email: manualForm.email,
        phone: manualForm.phone,
        packageId: manualForm.packageId || undefined,
        date: manualForm.date,
        slot: manualForm.slot || "",
        location: manualForm.location,
        status: "confirmed" as const,
        notes: manualForm.notes || undefined
      };

      await createBooking(newBooking);
      toast.success("Prenotazione manuale creata con successo e cliente creato/aggiornato automaticamente!");
      
      // Reset form
      setManualForm({
        name: "",
        email: "",
        phone: "",
        packageId: "",
        date: "",
        slot: "",
        location: "online",
        notes: ""
      });
      setSelectedDate(null);
      setAvailableSlots([]);
      
      await loadData();
    } catch (error) {
      console.error("Error creating manual booking:", error);
      toast.error("Errore nella creazione della prenotazione");
    }
  };

  // Calendar functions
  useEffect(() => {
    if (viewMode === "calendar" && items.length > 0) {
      const loadDayBookings = async (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayBookings = items.filter(booking => 
          booking.date.startsWith(dateStr)
        );
        setDayBookings(dayBookings);
      };
      
      loadDayBookings(calendarDate);
    }
  }, [calendarDate, items, viewMode]);

  // Generate time slots for agenda view (9:00 to 18:00 with 1-hour intervals)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const baseDate = new Date(calendarDate);
    
    for (let hour = 9; hour <= 18; hour++) {
      const slotDate = new Date(baseDate);
      slotDate.setHours(hour, 0, 0, 0);
      slots.push(slotDate.toISOString());
    }
    
    return slots;
  };

  // Get default time slot for bookings without specific time
  const getDefaultTimeSlot = () => {
    const baseDate = new Date(calendarDate);
    baseDate.setHours(12, 0, 0, 0); // Default to 12:00
    return baseDate.toISOString();
  };

  // Calendar export functions
  const exportCalendar = (range: 'day' | 'week' | 'month' | 'all') => {
    try {
      let startDate: Date;
      let endDate: Date;
      let filename: string;

      switch (range) {
        case 'day':
          startDate = new Date(calendarDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(calendarDate);
          endDate.setHours(23, 59, 59, 999);
          filename = `calendario_giornaliero_${format(calendarDate, 'yyyy-MM-dd')}.ics`;
          break;
        case 'week':
          startDate = new Date(calendarDate);
          startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6); // Sunday
          endDate.setHours(23, 59, 59, 999);
          filename = `calendario_settimanale_${format(startDate, 'yyyy-MM-dd')}.ics`;
          break;
        case 'month':
          startDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
          endDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          filename = `calendario_mensile_${format(startDate, 'yyyy-MM')}.ics`;
          break;
        case 'all':
          startDate = new Date(2020, 0, 1); // From 2020
          endDate = new Date(2030, 11, 31); // To 2030
          filename = `calendario_completo_${format(new Date(), 'yyyy-MM-dd')}.ics`;
          break;
      }

      const icalContent = generateICalContent(items, startDate, endDate, packages);
      downloadFile(icalContent, filename);
      
      toast.success(`Calendario esportato con successo! (${range === 'day' ? 'Giorno' : range === 'week' ? 'Settimana' : range === 'month' ? 'Mese' : 'Completo'})`);
    } catch (error) {
      console.error("Error exporting calendar:", error);
      toast.error("Errore nell'esportazione del calendario");
    }
  };

  // Filter bookings by status for requests view
  const pendingBookings = Array.isArray(items) ? items.filter(b => b.status === "pending") : [];
  const confirmedBookings = Array.isArray(items) ? items.filter(b => b.status === "confirmed") : [];
  const cancelledBookings = Array.isArray(items) ? items.filter(b => b.status === "cancelled") : [];

  if (loading) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold">Gestione Prenotazioni</h1>
        <p className="mt-4 text-foreground/70">Caricamento...</p>
      </main>
    );
  }

  const renderBookingCard = (b: Booking) => (
    <div key={b.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-semibold text-foreground">{b.name}</div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              b.status === "confirmed" ? "bg-green-100 text-green-800" :
              b.status === "cancelled" ? "bg-red-100 text-red-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {b.status === "pending" ? "In attesa" : 
               b.status === "confirmed" ? "Confermata" : "Rifiutata"}
            </span>
            {b.priority && <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">Priorità</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            📧 {b.email} {b.phone && `• 📱 ${b.phone}`}
          </div>
          <div className="text-sm text-muted-foreground">
            📅 {new Date(b.date).toLocaleDateString("it-IT")} 
            {b.slot && ` • ⏰ ${b.slot}`}
          </div>
          <div className="text-sm text-muted-foreground">
            {b.isFreeConsultation
              ? "📍 Sede: Online (gratuita)"
              : (b.location === "studio"
                  ? `📍 Sede: In studio${b.studioLocation ? ` • ${b.studioLocation}` : ""}`
                  : "📍 Sede: Online")}
          </div>
          <div className="text-sm text-muted-foreground">
            📦 {getPackageName(b.packageId)}
          </div>
          {b.notes && (
            <div className="text-sm text-muted-foreground mt-2">
              <div className="font-medium text-foreground mb-1">📝 Note del cliente:</div>
              <div className="bg-muted/50 p-2 rounded border-l-2 border-primary/30 text-xs">
                {b.notes}
              </div>
            </div>
          )}
          <div className="text-xs text-muted-foreground/70 mt-1">
            Richiesta il: {new Date(b.createdAt ?? b.date).toLocaleString("it-IT")}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Pulsanti per prenotazioni in attesa */}
          {b.status === "pending" && (
            <>
              <Button 
                size="sm" 
                onClick={() => handleConfirm(b)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ✅ Conferma
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCreateClientFromPending(b)}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 button-responsive-sm"
              >
                <span className="flex flex-col items-center justify-center gap-1 text-center">
                  <span className="flex items-center gap-1">
                    <span>👥</span>
                    <span className="hidden sm:inline">Crea Cliente</span>
                    <span className="sm:hidden">Crea</span>
                  </span>
                </span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleReject(b)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                🗑️ Rifiuta
              </Button>
            </>
          )}
          
          {/* Pulsanti per tutte le prenotazioni */}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              handleEditBooking(b);
            }}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            ✏️ Modifica
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleDelete(b)}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            🗑️ Elimina
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Header con navigazione e spazio extra per la navbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestione Prenotazioni</h1>
          <p className="text-sm text-muted-foreground mt-1">Amministrazione sistema prenotazioni</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/', '_blank')}
            className="flex items-center gap-2"
          >
            🏠 Homepage
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/admin', '_blank')}
            className="flex items-center gap-2"
          >
            ⚙️ Admin Panel
          </Button>
        </div>
      </div>
      
             {/* Navigation Tabs */}
       <div className="flex items-center justify-between mt-6 border-b border-foreground/20">
         <div className="flex gap-2">
           <button
             onClick={() => setViewMode("requests")}
             className={`px-4 py-2 font-medium border-b-2 transition-colors ${
               viewMode === "requests" 
                 ? "border-primary text-primary" 
                 : "border-transparent text-foreground/70 hover:text-foreground"
             }`}
           >
             📋 Richieste ({pendingBookings.length})
           </button>
           <button
             onClick={() => setViewMode("manual")}
             className={`px-4 py-2 font-medium border-b-2 transition-colors ${
               viewMode === "manual" 
                 ? "border-primary text-primary" 
                 : "border-transparent text-foreground/70 hover:text-foreground"
             }`}
           >
             ➕ Inserimento Manuale
           </button>
           <button
             onClick={() => setViewMode("calendar")}
             className={`px-4 py-2 font-medium border-b-2 transition-colors ${
               viewMode === "calendar" 
                 ? "border-primary text-primary" 
                 : "border-transparent text-foreground/70 hover:text-foreground"
             }`}
           >
             📅 Calendario
           </button>
         </div>
         
         {/* Global Export Button */}
         <Button
           size="sm"
           variant="outline"
           onClick={() => exportCalendar('all')}
           className="text-xs px-3 py-1"
         >
           📅 Esporta Calendario Completo
         </Button>
       </div>

      {/* Requests View */}
      {viewMode === "requests" && (
        <div className="mt-6">
                     {/* Pending Requests */}
           {pendingBookings.length > 0 && (
             <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-lg font-semibold flex items-center gap-2">
                     ⏳ Richieste in Attesa ({pendingBookings.length})
                   </h2>
                   <div className="flex gap-2">
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => {
                         const pendingOnly = items.filter(b => b.status === "pending");
                         const startDate = new Date(2020, 0, 1);
                         const endDate = new Date(2030, 11, 31);
                         const icalContent = generateICalContent(pendingOnly, startDate, endDate, packages);
                         downloadFile(icalContent, `richieste_in_attesa_${format(new Date(), 'yyyy-MM-dd')}.ics`);
                         toast.success("Calendario richieste in attesa esportato!");
                       }}
                       className="text-xs px-3 py-1"
                     >
                       📅 Esporta In Attesa
                     </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => {
                         // Create clients from all pending bookings
                         Promise.all(pendingBookings.map(handleCreateClientFromPending))
                           .then(() => {
                             toast.success(`${pendingBookings.length} clienti creati/aggiornati dalle prenotazioni in attesa!`);
                           })
                           .catch(() => {
                             toast.error("Errore nella creazione di alcuni clienti");
                           });
                       }}
                       className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 button-responsive-sm"
                     >
                                               <span className="flex flex-col items-center justify-center gap-1 text-center">
                          <span className="flex items-center gap-1">
                            <span>👥</span>
                            <span className="hidden sm:inline">Crea Clienti da In Attesa</span>
                            <span className="sm:hidden">Crea Clienti</span>
                          </span>
                        </span>
                     </Button>
                   </div>
                 </div>
               <div className="space-y-4">
                 {pendingBookings.map(renderBookingCard)}
               </div>
             </div>
           )}

                     {/* Confirmed Bookings */}
           {confirmedBookings.length > 0 && (
             <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold flex items-center gap-2">
                   ✅ Prenotazioni Confermate ({confirmedBookings.length})
                 </h2>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     const confirmedOnly = items.filter(b => b.status === "confirmed");
                     const startDate = new Date(2020, 0, 1);
                     const endDate = new Date(2030, 11, 31);
                     const icalContent = generateICalContent(confirmedOnly, startDate, endDate, packages);
                     downloadFile(icalContent, `prenotazioni_confermate_${format(new Date(), 'yyyy-MM-dd')}.ics`);
                     toast.success("Calendario prenotazioni confermate esportato!");
                   }}
                   className="text-xs px-3 py-1"
                 >
                   📅 Esporta Confermate
                 </Button>
               </div>
               <div className="space-y-4">
                {confirmedBookings.map((b) => (
                  <div key={b.id}>
                    {renderBookingCard(b)}
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateClientFromPending(b)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        👥 Crea Cliente
                      </Button>
                    </div>
                  </div>
                ))}
               </div>
             </div>
           )}

                     {/* Cancelled Bookings */}
           {cancelledBookings.length > 0 && (
             <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold flex items-center gap-2">
                   ❌ Prenotazioni Rifiutate ({cancelledBookings.length})
                 </h2>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     const cancelledOnly = items.filter(b => b.status === "cancelled");
                     const startDate = new Date(2020, 0, 1);
                     const endDate = new Date(2030, 11, 31);
                     const icalContent = generateICalContent(cancelledOnly, startDate, endDate, packages);
                     downloadFile(icalContent, `prenotazioni_rifiutate_${format(new Date(), 'yyyy-MM-dd')}.ics`);
                     toast.success("Calendario prenotazioni rifiutate esportato!");
                   }}
                   className="text-xs px-3 py-1"
                 >
                   📅 Esporta Rifiutate
                 </Button>
               </div>
               <div className="space-y-4">
                 {cancelledBookings.map(renderBookingCard)}
               </div>
             </div>
           )}

          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-foreground/70">Nessuna prenotazione trovata.</p>
              <p className="text-sm text-foreground/50 mt-1">Le nuove richieste appariranno qui.</p>
            </div>
          )}
        </div>
      )}

      {/* Form di modifica/rischedulazione - SEMPRE VISIBILE quando editingBooking è impostato */}
      {editingBooking && (
        <div className="mt-8">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Modifica Prenotazione</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="text-xs px-3 py-1"
              >
                ❌ Annulla
              </Button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Nome e cognome *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Email *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Telefono</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Pacchetto</label>
                  <select
                    value={editForm.packageId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, packageId: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Nessun pacchetto</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Data *</label>
                  <DatePicker
                    selected={editSelectedDate}
                    onChange={handleEditDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    minDate={new Date()}
                    placeholderText="Seleziona una data"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Slot orario *</label>
                  <select
                    value={editForm.slot}
                    onChange={(e) => setEditForm(prev => ({ ...prev, slot: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    disabled={!editSelectedDate || editAvailableSlots.length === 0}
                    required
                  >
                    <option value="">Seleziona un orario disponibile</option>
                    {editAvailableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {new Date(slot).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </option>
                    ))}
                  </select>
                  {editSelectedDate && editAvailableSlots.length === 0 && (
                    <p className="text-xs text-destructive mt-1">Nessun slot disponibile per questa data</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as "pending" | "confirmed" | "cancelled" }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="pending">In attesa</option>
                    <option value="confirmed">Confermata</option>
                    <option value="cancelled">Rifiutata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Note</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  💾 Salva Modifiche
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  ❌ Annulla
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

             {/* Manual Booking Form */}
       {viewMode === "manual" && (
         <div className="mt-6">
           <div className="bg-card border border-border rounded-lg p-6 max-w-2xl shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-foreground">Inserimento Manuale Prenotazione</h2>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() => exportCalendar('all')}
                 className="text-xs px-3 py-1"
               >
                 📅 Esporta Calendario
               </Button>
             </div>
            {/* Usa lo stesso form dei clienti; in admin nascondi il selettore pacchetto */}
            <ClientBookingForm adminMode requirePackage hidePackageSelect />
            {/*
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Nome e cognome *</label>
                  <input
                    type="text"
                    value={manualForm.name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Email *</label>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Telefono</label>
                  <input
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Pacchetto</label>
                  <select
                    value={manualForm.packageId}
                    onChange={(e) => setManualForm(prev => ({ ...prev, packageId: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Nessun pacchetto</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Data *</label>
                  <SharedDateCalendar
                    availableDates={manualAvailableDates}
                    selectedDate={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}` : ""}
                    onDateSelect={(dateStr) => {
                      const [y,m,d] = dateStr.split('-').map(Number);
                      const dObj = new Date(y, m-1, d);
                      handleManualDateChange(dObj);
                    }}
                    showPromotionalBanner={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Slot orario *</label>
                  <select
                    value={manualForm.slot}
                    onChange={(e) => setManualForm(prev => ({ ...prev, slot: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    disabled={!selectedDate || availableSlots.length === 0}
                    required
                  >
                    <option value="">Seleziona un orario disponibile</option>
                    {availableSlots.map(slot => {
                      const label = /T\d{2}:\d{2}/.test(slot)
                        ? (() => { try { const d = new Date(slot); return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); } catch { return slot; } })()
                        : slot;
                      return (
                        <option key={slot} value={slot}>{label}</option>
                      );
                    })}
                  </select>
                  {selectedDate && availableSlots.length === 0 && (
                    <p className="text-xs text-destructive mt-1">Nessun orario disponibile per questa data</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Sede</label>
                  <div className="flex gap-2">
                    <Button type="button" variant={manualForm.location === "online" ? "primary" : "outline"} onClick={() => setManualForm(prev => ({ ...prev, location: "online" }))}>🌐 Online</Button>
                    <Button type="button" variant={manualForm.location === "studio" ? "primary" : "outline"} onClick={() => setManualForm(prev => ({ ...prev, location: "studio" }))}>🏢 In studio</Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Note</label>
                  <textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={!manualForm.slot || availableSlots.length === 0}>
                  ➕ Crea Prenotazione
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setManualForm({
                      name: "",
                      email: "",
                      phone: "",
                      packageId: "",
                      date: "",
                      slot: "",
                      location: "online",
                      notes: ""
                    });
                    setSelectedDate(null);
                    setAvailableSlots([]);
                  }}
                >
                  🗑️ Cancella
                </Button>
              </div>
            </form>
            */}
          </div>
        </div>
      )}

             {/* Calendar View */}
       {viewMode === "calendar" && (
         <div className="mt-6">
           <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-foreground">Vista Calendario</h2>
               <div className="flex gap-2">
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => exportCalendar('day')}
                   className="text-xs px-3 py-1"
                 >
                   📅 Esporta Giorno
                 </Button>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => exportCalendar('week')}
                   className="text-xs px-3 py-1"
                 >
                   📅 Esporta Settimana
                 </Button>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => exportCalendar('month')}
                   className="text-xs px-3 py-1"
                 >
                   📅 Esporta Mese
                 </Button>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => exportCalendar('all')}
                   className="text-xs px-3 py-1"
                 >
                   📅 Esporta Tutto
                 </Button>
               </div>
             </div>
             <div className="flex flex-col lg:flex-row gap-6">
               {/* Calendar Picker */}
               <div className="flex-shrink-0">
                 <h2 className="text-lg font-semibold mb-4 text-foreground">Seleziona Data</h2>
                <DatePicker
                  selected={calendarDate}
                  onChange={(date) => date && setCalendarDate(date)}
                  inline
                  calendarStartDay={1}
                />
              </div>
              
                             {/* Daily Agenda */}
               <div className="flex-1">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-semibold text-foreground">
                     📅 Agenda del {calendarDate.toLocaleDateString("it-IT", { 
                       weekday: "long", 
                       year: "numeric", 
                       month: "long", 
                       day: "numeric" 
                     })}
                   </h2>
                   <div className="text-sm text-foreground/60">
                     {dayBookings.length} appuntamento{dayBookings.length !== 1 ? 'i' : ''}
                   </div>
                 </div>
                
                {dayBookings.length > 0 ? (
                  <div className="space-y-4">
                    {/* Time Slots */}
                    {generateTimeSlots().map(timeSlot => {
                      const bookingsAtTime = dayBookings.filter(booking => {
                        if (!booking.slot) return false;
                        const bookingTime = new Date(booking.slot);
                        const slotTime = new Date(timeSlot);
                        return Math.abs(bookingTime.getTime() - slotTime.getTime()) < 30 * 60 * 1000; // 30 min tolerance
                      });
                      
                      const bookingsWithoutSlot = dayBookings.filter(booking => 
                        !booking.slot && timeSlot === getDefaultTimeSlot()
                      );
                      
                      const allBookings = [...bookingsAtTime, ...bookingsWithoutSlot];
                      
                      if (allBookings.length === 0) return null;
                      
                      return (
                        <div key={timeSlot} className="border-l-4 border-primary/30 pl-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-shrink-0">
                              <div className="bg-primary/10 text-primary font-mono text-sm px-3 py-1 rounded-full">
                                {new Date(timeSlot).toLocaleTimeString("it-IT", { 
                                  hour: "2-digit", 
                                  minute: "2-digit" 
                                })}
                              </div>
                            </div>
                            <div className="flex-1 h-px bg-foreground/10"></div>
                          </div>
                          
                          <div className="space-y-3">
                            {allBookings.map(booking => (
                              <div key={booking.id} className="bg-background/80 rounded-lg p-4 border border-foreground/10 hover:border-primary/30 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-semibold text-lg">{booking.name}</span>
                                      <span className={`chip text-xs ${
                                        booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                                        booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                                        "bg-yellow-100 text-yellow-800"
                                      }`}>
                                        {booking.status === "pending" ? "⏳ In attesa" : 
                                         booking.status === "confirmed" ? "✅ Confermata" : "❌ Rifiutata"}
                                      </span>
                                      {booking.priority && (
                                        <span className="chip bg-orange-100 text-orange-800 text-xs">🔥 Priorità</span>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground/70">
                                      <div className="flex items-center gap-2">
                                        <span className="w-4 h-4">📧</span>
                                        <span>{booking.email}</span>
                                      </div>
                                      {booking.phone && (
                                        <div className="flex items-center gap-2">
                                          <span className="w-4 h-4">📱</span>
                                          <span>{booking.phone}</span>
                                        </div>
                                      )}
                                      {booking.packageId && (
                                        <div className="flex items-center gap-2">
                                          <span className="w-4 h-4">📦</span>
                                          <span>{getPackageName(booking.packageId)}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <span className="w-4 h-4">💬</span>
                                        <span className="capitalize">{booking.channelPreference || 'whatsapp'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                                                     {/* Quick Actions */}
                                   {booking.status === "pending" && (
                                     <div className="flex flex-col gap-2 ml-4">
                                       <Button 
                                         size="sm" 
                                         onClick={() => handleConfirm(booking)}
                                         className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                                       >
                                         ✅ Conferma
                                       </Button>
                                                                               <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleCreateClientFromPending(booking)}
                                          className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-3 py-1 button-responsive-xs"
                                        >
                                          <span className="flex flex-col items-center justify-center gap-1 text-center">
                                            <span className="flex items-center gap-1">
                                              <span>👥</span>
                                              <span className="hidden sm:inline">Crea Cliente</span>
                                              <span className="sm:inline">Crea</span>
                                            </span>
                                          </span>
                                        </Button>
                                       <Button 
                                         size="sm" 
                                         variant="outline"
                                         onClick={() => handleReject(booking)}
                                         className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-3 py-1"
                                       >
                                         ❌ Rifiuta
                                       </Button>
                                     </div>
                                   )}
                                </div>
                                
                                {/* Additional Info */}
                                <div className="text-xs text-foreground/50 pt-2 border-t border-foreground/10">
                                  Richiesta il: {new Date(booking.createdAt ?? booking.date).toLocaleString("it-IT")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-foreground/50">
                    <div className="text-4xl mb-4">📅</div>
                    <p className="text-lg font-medium mb-2">Nessun appuntamento per questa data</p>
                    <p className="text-sm">La giornata è libera per nuove prenotazioni</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


