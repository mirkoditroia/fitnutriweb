"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-white">⚙️ Admin Panel</h1>
            <nav className="hidden md:flex gap-6">
              <Link 
                href="/admin" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/bookings" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Prenotazioni
              </Link>
              <Link 
                href="/admin/clients" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Clienti
              </Link>
              <Link 
                href="/admin/packages" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Pacchetti
              </Link>
              <Link 
                href="/admin/content" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Contenuti
              </Link>
              <Link 
                href="/admin/availability" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Disponibilità
              </Link>
              <Link 
                href="/admin/calendar" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                📅 Calendario
              </Link>
              <Link 
                href="/admin/settings" 
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                ⚙️ Impostazioni
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 text-sm text-white/70">
                <span>👤 {user.email}</span>
              </div>
            )}
            <Link 
              href="/" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              🏠 Homepage
            </Link>
            <Button
              onClick={logout}
              variant="outline"
              className="px-4 py-2 text-sm border-white/20 text-white hover:bg-white/10"
            >
              🚪 Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
