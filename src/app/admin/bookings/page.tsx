"use client";
import { useEffect, useState } from "react";
import { listBookings, updateBooking, deleteBooking, getPackages, createBooking, getAvailabilityByDate, createClientFromPendingBooking, type Booking, type Package } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
    channelPreference: "whatsapp" as "whatsapp" | "email"
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);

  const loadData = async () => {
    try {
      const [bookings, packagesList] = await Promise.all([
        listBookings(),
        getPackages()
      ]);
      setItems(bookings);
      setPackages(packagesList);
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
      toast.success("Cliente creato/aggiornato dalla prenotazione in attesa!");
    } catch (error) {
      console.error("Error creating client from pending booking:", error);
      toast.error("Errore nella creazione del cliente");
    }
  };

  // Manual booking functions
  const handleManualDateChange = async (date: Date | null) => {
    setSelectedDate(date);
    if (!date) return;
    
    const dateStr = format(date, "yyyy-MM-dd");
    setManualForm(prev => ({ ...prev, date: dateStr, slot: "" }));
    
    try {
      const availability = await getAvailabilityByDate(dateStr);
      setAvailableSlots(availability?.slots || []);
    } catch (error) {
      console.error("Error loading availability:", error);
      setAvailableSlots([]);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualForm.name || !manualForm.email || !manualForm.date) {
      toast.error("Compila almeno nome, email e data");
      return;
    }

    try {
      const booking: Booking = {
        name: manualForm.name,
        email: manualForm.email,
        phone: manualForm.phone,
        packageId: manualForm.packageId || undefined,
        date: manualForm.date,
        slot: manualForm.slot || undefined,
        status: "confirmed", // Manual bookings are confirmed by default
        channelPreference: manualForm.channelPreference,
        createdAt: new Date().toISOString()
      };

      await createBooking(booking);
      toast.success("Prenotazione manuale creata con successo e cliente creato/aggiornato automaticamente!");
      
      // Reset form
      setManualForm({
        name: "",
        email: "",
        phone: "",
        packageId: "",
        date: "",
        slot: "",
        channelPreference: "whatsapp"
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
  const loadDayBookings = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayBookings = items.filter(booking => 
      booking.date.startsWith(dateStr)
    );
    setDayBookings(dayBookings);
  };

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

  useEffect(() => {
    if (viewMode === "calendar" && items.length > 0) {
      loadDayBookings(calendarDate);
    }
  }, [calendarDate, items, viewMode, loadDayBookings]);

  // Filter bookings by status for requests view
  const pendingBookings = items.filter(b => b.status === "pending");
  const confirmedBookings = items.filter(b => b.status === "confirmed");
  const cancelledBookings = items.filter(b => b.status === "cancelled");

  if (loading) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold">Gestione Prenotazioni</h1>
        <p className="mt-4 text-foreground/70">Caricamento...</p>
      </main>
    );
  }

  const renderBookingCard = (b: Booking) => (
    <div key={b.id} className="card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-semibold">{b.name}</div>
            <span className={`chip text-xs ${
              b.status === "confirmed" ? "bg-green-100 text-green-800" :
              b.status === "cancelled" ? "bg-red-100 text-red-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {b.status === "pending" ? "In attesa" : 
               b.status === "confirmed" ? "Confermata" : "Rifiutata"}
            </span>
            {b.priority && <span className="chip bg-orange-100 text-orange-800 text-xs">Priorità</span>}
          </div>
          <div className="text-sm text-foreground/70">
            📧 {b.email} {b.phone && `• 📱 ${b.phone}`}
          </div>
          <div className="text-sm text-foreground/70">
            📅 {new Date(b.date).toLocaleDateString("it-IT")} 
            {b.slot && ` • ⏰ ${new Date(b.slot).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`}
          </div>
          <div className="text-sm text-foreground/70">
            📦 {getPackageName(b.packageId)}
          </div>
          <div className="text-xs text-foreground/50 mt-1">
            Richiesta il: {new Date(b.createdAt ?? b.date).toLocaleString("it-IT")}
          </div>
        </div>
        
                 {b.status === "pending" && (
           <div className="flex gap-2">
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
                    <span className="sm:inline">Crea</span>
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
           </div>
         )}
      </div>
    </div>
  );

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold">Gestione Prenotazioni</h1>
      
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
                 {confirmedBookings.map(renderBookingCard)}
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

             {/* Manual Booking Form */}
       {viewMode === "manual" && (
         <div className="mt-6">
           <div className="card p-6 max-w-2xl">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold">Inserimento Manuale Prenotazione</h2>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() => exportCalendar('all')}
                 className="text-xs px-3 py-1"
               >
                 📅 Esporta Calendario
               </Button>
             </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome e cognome *</label>
                  <input
                    type="text"
                    value={manualForm.name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pacchetto</label>
                  <select
                    value={manualForm.packageId}
                    onChange={(e) => setManualForm(prev => ({ ...prev, packageId: e.target.value }))}
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Nessun pacchetto</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data *</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleManualDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
                    minDate={new Date()}
                    placeholderText="Seleziona una data"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slot orario</label>
                  <select
                    value={manualForm.slot}
                    onChange={(e) => setManualForm(prev => ({ ...prev, slot: e.target.value }))}
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
                    disabled={!selectedDate || availableSlots.length === 0}
                  >
                    <option value="">Nessun slot specifico</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {new Date(slot).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </option>
                    ))}
                  </select>
                  {selectedDate && availableSlots.length === 0 && (
                    <p className="text-xs text-foreground/50 mt-1">Nessun slot disponibile per questa data</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contatto preferito</label>
                  <select
                    value={manualForm.channelPreference}
                    onChange={(e) => setManualForm(prev => ({ ...prev, channelPreference: e.target.value as "whatsapp" | "email" }))}
                    className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">
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
                      channelPreference: "whatsapp"
                    });
                    setSelectedDate(null);
                    setAvailableSlots([]);
                  }}
                >
                  🗑️ Cancella
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

             {/* Calendar View */}
       {viewMode === "calendar" && (
         <div className="mt-6">
           <div className="card p-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold">Vista Calendario</h2>
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
                 <h2 className="text-lg font-semibold mb-4">Seleziona Data</h2>
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
                   <h2 className="text-xl font-semibold">
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
    </main>
  );
}


