type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  backgroundImage?: string;
  badgeText?: string;
  badgeColor?: string;
};

export function Hero({ title, subtitle, ctaLabel, backgroundImage, badgeText = "Performance • Estetica • Energia", badgeColor = "bg-primary text-primary-foreground" }: Props) {
  const bg = backgroundImage && String(backgroundImage).trim() !== "" ? backgroundImage : "/hero-demo.svg";
  return (
    <section className={`relative py-16 sm:py-20 ${bg ? 'min-h-[80vh] flex items-center' : ''}`}>
      {/* Background Image */}
      {bg && (
        <div className="absolute inset-0 z-0">
          <img 
            src={bg} 
            alt="Hero background" 
            className="w-full h-full object-cover hero-bg-enter"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40 hero-overlay-enter"></div>
        </div>
      )}
      
      {/* Content */}
      <div className={`relative z-10 ${backgroundImage ? 'container' : 'container'}`}>
        <div className={`${backgroundImage ? 'max-w-2xl text-white' : 'max-w-2xl'}`}>
          <span className={`chip ${backgroundImage ? 'bg-white/20 text-white border-white/30' : badgeColor}`}>
            {badgeText}
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
            {title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-foreground/80">
            {subtitle}
          </p>
          <div className="mt-6 flex gap-3">
            <a href="#booking" className="btn-primary">
              <span className="text-center">
                {ctaLabel}
              </span>
            </a>
            <a href="#pacchetti" className="btn-outline">
              <span className="text-center">
                Scopri i pacchetti
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


