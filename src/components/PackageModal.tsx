"use client";
import { useEffect, useState } from "react";
import type { Package } from "@/lib/data";

type Props = {
  pkg: Package;
  onClose: () => void;
};

export function PackageModal({ pkg, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  useEffect(() => {
    // Blocca lo scroll del body quando il modal è aperto
    document.body.style.overflow = 'hidden';
    
    // Gestione tasto ESC per chiudere il modal
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [handleClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const renderPrice = () => {
    if (pkg.hasDiscount && pkg.basePrice && pkg.discountedPrice) {
      return (
        <div className="space-y-2 md:space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">€ {pkg.discountedPrice}</div>
              <div className="text-xs md:text-sm text-foreground/60 line-through">€ {pkg.basePrice}</div>
            </div>
            {pkg.discountPercentage && (
              <div className="px-3 md:px-4 py-1 md:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm md:text-lg font-bold rounded-full shadow-lg">
                -{pkg.discountPercentage}%
              </div>
            )}
          </div>
          <div className="text-center">
            {pkg.paymentText && (
              <div className="text-xs md:text-sm text-foreground/60 bg-muted/30 px-2 md:px-3 py-1 md:py-2 rounded-full inline-block">
                {pkg.paymentText}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-foreground">€ {pkg.price}</div>
        {pkg.paymentText && (
          <div className="text-xs md:text-sm text-foreground/60 bg-muted/30 px-2 md:px-3 py-1 md:py-2 rounded-full inline-block mt-1 md:mt-2">
            {pkg.paymentText}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal */}
        <div className="bg-gradient-to-br from-background to-muted/20 text-foreground rounded-t-2xl md:rounded-2xl w-full max-w-3xl max-h-[80vh] md:max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden">
          {/* Header - responsive spacing */}
          <div className="bg-gradient-to-br from-background to-muted/30 border-b border-border/30 p-4 md:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary leading-tight">
                  {pkg.title}
                </h2>
                {pkg.badge && (
                  <span className="inline-block mt-2 px-2 py-1 md:px-3 md:py-1 bg-primary/20 text-primary text-xs md:text-sm font-semibold rounded-full border border-primary/30">
                    {pkg.badge}
                  </span>
                )}
              </div>
              <button 
                className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors flex items-center justify-center shadow-md" 
                onClick={handleClose} 
                aria-label="Chiudi modal"
              >
                <span className="text-xl md:text-2xl font-bold">✕</span>
              </button>
            </div>
          </div>
          {/* Content scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 overscroll-contain">

            {/* Immagine con overlay gradiente */}
            {pkg.imageUrl && (
              <div className="relative mb-4 md:mb-6 rounded-xl overflow-hidden">
                <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-40 md:h-56 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
            )}
            
            {/* ✅ NUOVA FEATURE: Descrizione principale con formattazione migliorata */}
            <div className="mb-6 md:mb-8">
              <div className="bg-gradient-to-r from-muted/20 to-muted/30 p-4 md:p-6 rounded-xl border-l-4 border-primary/50">
                <h3 className="text-sm md:text-base font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Descrizione del Pacchetto
                </h3>
                <div className="text-sm md:text-base text-foreground/80 leading-relaxed space-y-3">
                  {pkg.description.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="text-justify">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
            
            {/* Sezione Dettagli Completa con design migliorato */}
            {pkg.details && (
              <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                {/* Informazioni temporali con card eleganti */}
                {pkg.details.duration && (
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-3 md:p-4 rounded-xl border border-blue-500/20 text-center">
                      <div className="text-xl md:text-2xl mb-1 md:mb-2">⏱️</div>
                      <div className="text-xs md:text-sm text-blue-600/80 font-medium">Durata</div>
                      <div className="text-base md:text-lg font-bold text-blue-700">{pkg.details.duration}</div>
                    </div>
                  </div>
                )}
                
                {/* Note aggiuntive senza etichetta "Note" */}
                {pkg.details.notes && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 md:p-6 rounded-xl border border-purple-200">
                    <div className="text-xs md:text-sm text-purple-800 leading-relaxed">
                      {pkg.details.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Footer con prezzi e pulsante prenota */}
            <div className="border-t border-border/30 pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                {renderPrice()}
                <a 
                  href={`?packageId=${pkg.id ?? ""}#booking`} 
                  className="btn-primary w-full md:w-auto px-6 md:px-8 py-3 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-center">🚀 Prenota Ora</span>
                </a>
              </div>
              
              {/* Pulsante chiusura aggiuntivo per mobile */}
              <div className="mt-6 md:hidden flex justify-center">
                <button 
                  onClick={handleClose}
                  className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
                >
                  ✕ Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


