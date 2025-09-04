"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface ResultPhoto {
  id: string;
  url: string;
  description?: string;
  beforeAfter?: 'before' | 'after' | 'single';
}

interface ResultsCarouselProps {
  title?: string;
  subtitle?: string;
  photos: ResultPhoto[];
}

export function ResultsCarousel({ 
  title = "🎯 Risultati dei Nostri Clienti", 
  subtitle = "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
  photos 
}: ResultsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-scroll carousel
  useEffect(() => {
    if (!isAutoPlaying || photos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, photos.length]);

  // Don't render if no photos
  if (!photos || photos.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  return (
    <section className="py-20 bg-gradient-to-b from-secondary-bg/30 to-background">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Carousel */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-card">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {photos.map((photo, index) => (
                <div key={photo.id} className="min-w-full">
                  <div className="relative aspect-[16/10] md:aspect-[20/9]">
                    <Image
                      src={photo.url}
                      alt={photo.description || `Risultato cliente ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0} // Load first image with priority
                    />
                    
                    {/* Overlay with description */}
                    {photo.description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                        <p className="text-white text-lg font-medium">
                          {photo.description}
                        </p>
                        {photo.beforeAfter && photo.beforeAfter !== 'single' && (
                          <span className="inline-block mt-2 px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                            {photo.beforeAfter === 'before' ? 'Prima' : 'Dopo'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white text-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="Foto precedente"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white text-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="Foto successiva"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {photos.length > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-primary scale-125'
                      : 'bg-foreground/30 hover:bg-foreground/50'
                  }`}
                  aria-label={`Vai alla foto ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Auto-play indicator */}
          {photos.length > 1 && (
            <div className="text-center mt-4">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="text-sm text-foreground/60 hover:text-foreground/80 transition-colors"
              >
                {isAutoPlaying ? '⏸️ Pausa' : '▶️ Riproduci'} slideshow automatico
              </button>
            </div>
          )}
        </div>

        {/* Statistics or Call to Action */}
        <div className="text-center mt-12">
          <p className="text-foreground/70 mb-6">
            Vuoi essere il prossimo successo? Inizia il tuo percorso di trasformazione oggi stesso.
          </p>
          <a 
            href="#booking"
            className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            Inizia la Tua Trasformazione
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
