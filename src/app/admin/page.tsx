import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <Link href="/" className="text-sm underline hover:text-primary">
          Torna al sito
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Contenuti Landing</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">
              Modifica hero (titolo, sottotitolo, CTA), immagini di sezione e microcopy FAQ.
            </p>
            <div className="mt-4 flex gap-3">
              <Button>Modifica contenuti</Button>
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
              <Button>Gestisci pacchetti</Button>
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
              <Button>Configura slot</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Prenotazioni & Clienti</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">
              Visualizza prenotazioni con stato, schede cliente e statistiche rapide.
            </p>
            <div className="mt-4 flex gap-3">
              <Button>Apri dashboard</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Trustpilot Logs</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/70">
              Monitora esito fetch e ultimi log.
            </p>
            <div className="mt-4 flex gap-3">
              <Button>Vedi log</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


