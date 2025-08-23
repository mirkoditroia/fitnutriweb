export function TrustpilotWall() {
  // Placeholder: integrate Trustpilot API later
  const items = [
    { name: "Luca", text: "Risultati concreti in 6 settimane. Consigliato!" },
    { name: "Sara", text: "Piano sostenibile e supporto costante." },
    { name: "Marco", text: "Allenamenti intelligenti, performance migliorata." },
  ];
  return (
    <section className="container py-12 border-t border-[color:var(--border)]">
      <h2 className="text-2xl font-bold">Recensioni</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <div key={i} className="card p-6">
            <p className="text-sm">“{it.text}”</p>
            <div className="text-xs text-foreground/60 mt-3">— {it.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}


