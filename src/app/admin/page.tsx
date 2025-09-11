import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

export default function AdminPage() {
  return (
    <>
      {/* Header migliorato con spazio extra per la navbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">⚙️ Admin Panel</h1>
          <p className="text-lg text-muted-foreground mt-2">Gestione completa del sistema GZnutrition</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            🏠 Homepage
          </Link>
          <Link 
            href="/admin/bookings" 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            📋 Prenotazioni
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Prenotazioni & Clienti</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">
              Visualizza prenotazioni con stato, schede cliente e statistiche rapide.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/admin/bookings" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium">
                📋 Prenotazioni
              </Link>
              <Link href="/admin/clients" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium">
                👥 Clienti
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Disponibilità</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">Configura gli slot agenda.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/admin/availability" className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium">
                ⏰ Configura Slot
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Pacchetti</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">
              Gestisci titolo, descrizione, prezzo, immagine, featured e badge.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/admin/packages" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium">
                📦 Gestisci Pacchetti
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Contenuti Landing</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">
              Modifica hero (titolo, sottotitolo, CTA), immagini di sezione e microcopy FAQ.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/admin/content" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
                ✏️ Editor Contenuti
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Google Calendar</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">
              Accedi direttamente al calendario Google e gestisci l'integrazione per sincronizzare le prenotazioni.
            </p>
            <div className="mt-4 flex gap-3">
              <Link 
                href="https://calendar.google.com/calendar/u/0/r?cid=dc16aa394525fb01f5906273e6a3f1e47cf616ee466cedd511698e3f285288d6@group.calendar.google.com" 
                target="_blank"
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-base font-semibold"
              >
                📅 Apri Google Calendar
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
}


