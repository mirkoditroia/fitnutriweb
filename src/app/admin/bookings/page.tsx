"use client";
import { useEffect, useState } from "react";
import { listBookings, updateBooking, deleteBooking, getPackages, type Booking, type Package } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function AdminBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.success("Prenotazione confermata!");
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
      toast.success("Prenotazione rifiutata ed eliminata");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Errore nell'eliminazione della prenotazione");
    }
  };

  if (loading) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold">Prenotazioni</h1>
        <p className="mt-4 text-foreground/70">Caricamento...</p>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold">Prenotazioni</h1>
      <div className="mt-6 space-y-4">
        {items.map((b) => (
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
                    onClick={() => handleReject(b)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    🗑️ Rifiuta ed elimina
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-foreground/70">Nessuna prenotazione trovata.</p>
            <p className="text-sm text-foreground/50 mt-1">Le nuove richieste appariranno qui.</p>
          </div>
        )}
      </div>
    </main>
  );
}


