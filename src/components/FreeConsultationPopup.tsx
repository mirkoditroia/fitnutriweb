"use client";

import { useState, useEffect } from "react";

interface FreeConsultationPopupProps {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  isEnabled: boolean;
}

export function FreeConsultationPopup({ 
  title, 
  subtitle, 
  description, 
  ctaText, 
  isEnabled 
}: FreeConsultationPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;
    
    // Controlla se l'utente ha già visto il popup
    const hasSeenPopup = localStorage.getItem('freeConsultationPopupSeen');
    if (!hasSeenPopup) {
      // Mostra il popup dopo 2 secondi
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isEnabled]);

  const handleClose = () => {
    setIsOpen(false);
    setHasSeen(true);
    localStorage.setItem('freeConsultationPopupSeen', 'true');
  };

  const handleCTAClick = () => {
    setIsOpen(false);
    setHasSeen(true);
    localStorage.setItem('freeConsultationPopupSeen', 'true');
    
    // Aggiorna l'URL per indicare che è una consultazione gratuita
    const url = new URL(window.location.href);
    url.searchParams.set('packageId', 'free-consultation');
    window.history.pushState({}, '', url.toString());
    
    // Scroll alla sezione prenota
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Trigger un evento per aggiornare il LandingClient
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isEnabled || !isOpen || hasSeen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="relative bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Pulsante chiudi */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Chiudi popup"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenuto */}
        <div className="text-center space-y-4">
          {/* Icona */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">🎯</span>
          </div>

          {/* Titolo */}
          <h2 className="text-2xl font-bold text-foreground">
            {title}
          </h2>

          {/* Sottotitolo */}
          <p className="text-lg font-medium text-primary">
            {subtitle}
          </p>

          {/* Descrizione */}
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* CTA */}
          <button
            onClick={handleCTAClick}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
          >
            {ctaText}
          </button>

          {/* Testo informativo */}
          <p className="text-xs text-muted-foreground">
            * Solo per nuovi clienti
          </p>
        </div>
      </div>
    </div>
  );
}
