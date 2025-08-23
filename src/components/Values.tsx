export function Values() {
  const items = [
    { title: "Piani personalizzati", desc: "Nutrizione e training cuciti su obiettivi e stile di vita." },
    { title: "Allenamenti intelligenti", desc: "Progressioni efficienti, focus su performance e forma." },
    { title: "Follow-up costante", desc: "Check-in e aggiustamenti settimanali per risultati reali." },
  ];
  return (
    <section id="valori" className="container py-12 border-t border-[color:var(--border)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it) => (
          <div className="card p-6" key={it.title}>
            <div className="chip mb-3">Valore</div>
            <h3 className="font-semibold text-lg">{it.title}</h3>
            <p className="text-foreground/70 mt-1 text-sm">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


