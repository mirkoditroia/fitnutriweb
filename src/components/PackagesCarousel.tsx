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

  return (
    <section className="container py-12 border-t border-[color:var(--border)]">
      <h2 className="text-2xl font-bold">Pacchetti</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {ordered.map((p) => {
          const badge = p.badge || (p.featured ? "Più scelto" : undefined);
          const benefits = parseBenefits(p.description);
          return (
            <article key={p.id ?? p.title} className="card p-0 overflow-hidden">
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
                  <div>
                    <div className="text-2xl font-extrabold">€ {p.price}</div>
                    <div className="text-xs text-foreground/60">pagabile mensilmente</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-outline" onClick={() => setActive(p)}>Dettagli</button>
                    <a href={`?packageId=${encodeURIComponent(p.id ?? p.title)}#booking`} className="btn-primary">Prenota</a>
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


