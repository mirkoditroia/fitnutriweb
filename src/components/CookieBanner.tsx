"use client";

import { useState, useEffect } from "react";
import { getSiteContent } from "@/lib/datasource";
import type { SiteContent } from "@/lib/data";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    getSiteContent().then(setSiteContent);
    
    // Check if user has already made a choice (only on client side)
    if (typeof window !== 'undefined') {
      const cookieConsent = localStorage.getItem('cookieConsent');
      if (!cookieConsent) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  // Show banner if visible and either enabled is true or not explicitly disabled
  if (!isVisible || siteContent?.legalInfo?.cookieBanner?.enabled === false) {
    return null;
  }

  const cookieBanner = siteContent?.legalInfo?.cookieBanner;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="container py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              {cookieBanner?.title || "🍪 Utilizzo dei Cookie"}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {cookieBanner?.message || 
                "Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per fornire funzionalità personalizzate. Continuando a navigare accetti l'utilizzo dei cookie."}
            </p>
            <a 
              href="/cookies"
              className="text-sm text-primary hover:underline"
            >
              {cookieBanner?.learnMoreText || "Scopri di più"}
            </a>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              {cookieBanner?.declineText || "Rifiuta"}
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-primary hover:bg-primary/90"
            >
              {cookieBanner?.acceptText || "Accetta"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
