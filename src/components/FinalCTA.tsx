export function FinalCTA() {
  return (
    <section className="container py-16 border-t border-[color:var(--border)]">
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-bold">Pronto a iniziare?</h2>
        <p className="text-foreground/70 mt-2">Prenota ora il tuo percorso e fai il primo passo.</p>
        <a href="#booking" className="btn-primary mt-6 inline-flex">
          <span className="text-center">Prenota ora</span>
        </a>
      </div>
      <div className="text-xs text-foreground/60 mt-6">
        © {new Date().getFullYear()} Demo • P.IVA 00000000000 • <a className="underline" href="#">Privacy</a>
      </div>
    </section>
  );
}


