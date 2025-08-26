"use client";
import { useState } from "react";
import { Package } from "@/lib/data";
import { PackageModal } from "@/components/PackageModal";

function parseBenefits(description: string): string[] {
  // Try split by bullet '•', fallback to first 3 lines
  const byDot = description.split("•").map((s) => s.trim()).filter(Boolean);
  if (byDot.length >= 3) return byDot.slice(0, 3);
  const byLines = description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return byLines.slice(0, 3);
}

export function PackagesCarousel({ items }: { items: Package[] }) {
  const [active, setActive] = useState<Package | null>(null);
  // featured first, then by price asc
  const ordered = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.price - b.price);

  const handleBookingClick = (packageId: string) => {
    // Aggiorna l'URL con il packageId
    const url = new URL(window.location.href);
    url.searchParams.set('packageId', packageId);
    window.history.pushState({}, '', url.toString());
    
    // Scroll alla sezione booking
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Trigger un evento per aggiornare il LandingClient
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const renderPrice = (pkg: Package) => {
    if (pkg.hasDiscount && pkg.basePrice && pkg.discountedPrice) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-primary">€ {pkg.discountedPrice}</span>
            <span className="text-lg font-bold text-foreground/60 line-through">€ {pkg.basePrice}</span>
            {pkg.discountPercentage && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                -{pkg.discountPercentage}%
              </span>
            )}
          </div>
          <div className="text-xs text-foreground/60">{pkg.paymentText || "pagabile mensilmente"}</div>
        </div>
      );
    }
    
    return (
      <div>
        <div className="text-2xl font-extrabold">€ {pkg.price}</div>
        <div className="text-xs text-foreground/60">{pkg.paymentText || "pagabile mensilmente"}</div>
      </div>
    );
  };

  return (
    <section id="pacchetti" className="container py-12 border-t border-foreground/10">
      <h2 className="text-2xl font-bold">Pacchetti</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {ordered.map((p) => {
          const badge = p.badge || (p.featured ? "Più scelto" : undefined);
          const benefits = parseBenefits(p.description);
          return (
            <article key={p.id ?? p.title} className="card p-0 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-lg">{p.title}</h3>
                  {badge && <span className="chip">{badge}</span>}
                </div>
                <ul className="mt-3 space-y-2 text-sm list-disc pl-5">
                  {benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <div className="mt-4 flex items-end justify-between">
                  {renderPrice(p)}
                  <div className="flex gap-2">
                    <button className="btn-outline" onClick={() => setActive(p)}>
                      <span className="text-center">Dettagli</span>
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => handleBookingClick(p.id || p.title)}
                    >
                      <span className="text-center">Prenota</span>
                    </button>
                  </div>
                </div>
                {!p.isActive && (
                  <p className="text-xs text-foreground/60 mt-2">Non disponibile al momento</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {active && <PackageModal pkg={active} onClose={() => setActive(null)} />}
    </section>
  );
}


