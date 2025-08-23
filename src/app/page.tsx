import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="container py-16 sm:py-20">
        <div className="max-w-2xl">
          <span className="chip">
            Performance • Estetica • Energia
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
            Trasforma il tuo fisico. Potenzia la tua performance.
          </h1>
          <p className="mt-3 text-base sm:text-lg text-foreground/80">
            Coaching nutrizionale e training su misura per giovani adulti 20–35. Risultati misurabili, approccio scientifico, estetica e performance al centro.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="#pacchetti" className="btn-primary">
              Inizia ora
            </Link>
            <Link href="#faq" className="btn-outline">
              Scopri come funziona
            </Link>
          </div>
        </div>
      </section>
      <section id="pacchetti" className="container py-12 border-t border-foreground/10">
        <h2 className="text-2xl font-bold">Pacchetti</h2>
        <p className="mt-2 text-foreground/70">Configurabili dall’area admin.</p>
      </section>
      <section id="faq" className="container py-12 border-t border-foreground/10">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <p className="mt-2 text-foreground/70">Gestite dall’area admin.</p>
      </section>
    </main>
  );
}
