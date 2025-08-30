"use client";

import { useState, useEffect } from "react";
import { setDirectState } from "@/lib/directState";

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
    
    // NUOVO SISTEMA DIRETTO: seleziona il pacchetto promozionale
    setDirectState('free-consultation', true);
    
    // Scroll alla sezione prenota
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isEnabled || !isOpen || hasSeen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="relative max-w-lg w-full rounded-2xl p-8 shadow-2xl ring-1 ring-foreground/20 bg-white text-black">
        {/* Pulsante chiudi */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-black/60 hover:text-black transition-colors"
          aria-label="Chiudi popup"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenuto */}
        <div className="text-center space-y-4">
          {/* Icona */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-200">
            <span className="text-3xl">🎯</span>
          </div>

          {/* Titolo */}
          <h2 className="text-2xl font-extrabold tracking-tight">
            {title}
          </h2>

          {/* Sottotitolo */}
          <p className="text-lg font-semibold text-green-700">
            {subtitle}
          </p>

          {/* Descrizione */}
          <p className="text-black/70 leading-relaxed">
            {description}
          </p>

          {/* CTA */}
          <button
            onClick={handleCTAClick}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow focus:outline-none focus:ring-4 focus:ring-[rgba(var(--primary-rgb),0.25)]"
          >
            {ctaText}
          </button>

          {/* Testo informativo */}
          <p className="text-xs text-black/60">
            * Solo per nuovi clienti
          </p>
        </div>
      </div>
    </div>
  );
}
