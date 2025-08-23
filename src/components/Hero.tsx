type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export function Hero({ title, subtitle, ctaLabel }: Props) {
  return (
    <section className="container py-16 sm:py-20">
      <div className="max-w-2xl">
        <span className="chip">Performance • Estetica • Energia</span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
          {title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-foreground/80">
          {subtitle}
        </p>
        <div className="mt-6 flex gap-3">
          <a href="#booking" className="btn-primary">
            {ctaLabel}
          </a>
          <a href="#faq" className="btn-outline">Domande frequenti</a>
        </div>
      </div>
    </section>
  );
}


