import Link from "next/link";

export const metadata = {
  title: "Admin | GZnutrition",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header di navigazione admin - fisso in alto */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-foreground">⚙️ Admin Panel</h1>
              <nav className="hidden md:flex gap-6">
                <Link 
                  href="/admin" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/bookings" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Prenotazioni
                </Link>
                <Link 
                  href="/admin/clients" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clienti
                </Link>
                <Link 
                  href="/admin/packages" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pacchetti
                </Link>
                <Link 
                  href="/admin/availability" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Disponibilità
                </Link>
                <Link 
                  href="/admin/calendar" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  📅 Calendario
                </Link>
              </nav>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/" 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                🏠 Homepage
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenuto principale con padding-top per compensare l'header fisso */}
      <main className="container mx-auto px-4 py-8 pt-12">
        {children}
      </main>
    </div>
  );
}


