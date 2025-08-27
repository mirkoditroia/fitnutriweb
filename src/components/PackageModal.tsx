"use client";
import { useEffect, useState } from "react";
import type { Package } from "@/lib/data";

type Props = {
  pkg: Package;
  onClose: () => void;
};

export function PackageModal({ pkg, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Blocca lo scroll del body quando il modal è aperto
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const renderPrice = () => {
    if (pkg.hasDiscount && pkg.basePrice && pkg.discountedPrice) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">€ {pkg.discountedPrice}</div>
              <div className="text-sm text-foreground/60 line-through">€ {pkg.basePrice}</div>
            </div>
            {pkg.discountPercentage && (
              <div className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-bold rounded-full shadow-lg">
                -{pkg.discountPercentage}%
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm text-foreground/60 bg-muted/30 px-3 py-2 rounded-full inline-block">
              {pkg.paymentText || "pagabile mensilmente"}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center">
        <div className="text-3xl font-bold text-foreground">€ {pkg.price}</div>
        <div className="text-sm text-foreground/60 bg-muted/30 px-3 py-2 rounded-full inline-block mt-2">
          {pkg.paymentText || "pagabile mensilmente"}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal */}
        <div className="bg-gradient-to-br from-background to-muted/20 text-foreground rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden">
          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-gradient-to-br from-background to-muted/30 border-b border-border/30 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {pkg.title}
                </h2>
                {pkg.badge && (
                  <span className="inline-block mt-2 px-3 py-1 bg-primary/20 text-primary text-sm font-semibold rounded-full border border-primary/30">
                    {pkg.badge}
                  </span>
                )}
              </div>
              <button 
                className="btn-outline hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                onClick={handleClose} 
                aria-label="Chiudi modal"
              >
                <span className="text-center">✕</span>
              </button>
            </div>
          </div>
          {/* Content scrollable */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">

            {/* Immagine con overlay gradiente */}
            {pkg.imageUrl && (
              <div className="relative mb-6 rounded-xl overflow-hidden">
                <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
            )}
            
            {/* Descrizione principale */}
            <div className="mb-8">
              <p className="text-lg text-foreground/80 leading-relaxed bg-muted/20 p-4 rounded-xl border-l-4 border-primary/50">
                {pkg.description}
              </p>
            </div>
            
            {/* Sezione Dettagli Completa con design migliorato */}
            {pkg.details && (
              <div className="space-y-6 mb-8">
                {/* Informazioni temporali e numeriche con card eleganti */}
                {(pkg.details.duration || pkg.details.sessions) && (
                  <div className="grid grid-cols-2 gap-4">
                    {pkg.details.duration && (
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-xl border border-blue-500/20 text-center">
                        <div className="text-2xl mb-2">⏱️</div>
                        <div className="text-sm text-blue-600/80 font-medium">Durata</div>
                        <div className="text-lg font-bold text-blue-700">{pkg.details.duration}</div>
                      </div>
                    )}
                    {pkg.details.sessions && (
                      <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 rounded-xl border border-green-500/20 text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <div className="text-sm text-green-600/80 font-medium">Sessioni</div>
                        <div className="text-lg font-bold text-green-700">{pkg.details.sessions}</div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Caratteristiche con design a card */}
                {pkg.details.features && pkg.details.features.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="text-2xl">✨</span>
                      Caratteristiche Principali
                    </h4>
                    <div className="grid gap-3">
                      {pkg.details.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-emerald-100">
                          <span className="text-emerald-500 text-lg">✓</span>
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Cosa è incluso con design a card */}
                {pkg.details.includes && pkg.details.includes.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="text-2xl">🎁</span>
                      Cosa è Incluso
                    </h4>
                    <div className="grid gap-3">
                      {pkg.details.includes.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-blue-100">
                          <span className="text-blue-500 text-lg">🎁</span>
                          <span className="text-sm font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Requisiti con design a card */}
                {pkg.details.requirements && pkg.details.requirements.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="text-2xl">ℹ️</span>
                      Requisiti
                    </h4>
                    <div className="grid gap-3">
                      {pkg.details.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-orange-100">
                          <span className="text-orange-500 text-lg">ℹ️</span>
                          <span className="text-sm font-medium">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Note aggiuntive senza etichetta "Note" */}
                {pkg.details.notes && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <div className="text-sm text-purple-800 leading-relaxed">
                      {pkg.details.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Footer con prezzi e pulsante prenota */}
            <div className="border-t border-border/30 pt-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                {renderPrice()}
                <a 
                  href={`?packageId=${pkg.id ?? ""}#booking`} 
                  className="btn-primary px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-center">🚀 Prenota Ora</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


