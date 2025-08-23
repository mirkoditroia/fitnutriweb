type QA = { q: string; a: string };

export function FAQ({ items }: { items: QA[] }) {
  return (
    <section id="faq" className="container py-12 border-t border-[color:var(--border)]">
      <h2 className="text-2xl font-bold">FAQ</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((qa, i) => (
          <div key={i} className="card p-6">
            <h3 className="font-semibold">{qa.q}</h3>
            <p className="text-foreground/70 mt-1 text-sm">{qa.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


