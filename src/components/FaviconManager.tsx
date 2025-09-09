"use client";
import { useEffect } from "react";
import { getSiteContent } from "@/lib/datasource";

interface FaviconManagerProps {
  initialFavicon?: string;
}

export default function FaviconManager({ initialFavicon }: FaviconManagerProps) {
  const updateFavicon = (faviconUrl: string) => {
    // Rimuovi tutti i favicon esistenti
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());
    
    // Aggiungi il nuovo favicon con cache busting
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = `${faviconUrl}?v=${Date.now()}`;
    document.head.appendChild(link);
    
    // Aggiungi anche shortcut icon per compatibilità
    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.href = `${faviconUrl}?v=${Date.now()}`;
    document.head.appendChild(shortcutLink);
    
    console.log(`🎯 Favicon aggiornato: ${faviconUrl}`);
  };

  const checkForFaviconUpdates = async () => {
    try {
      const siteContent = await getSiteContent();
      if (siteContent?.favicon) {
        // Controlla se il favicon è diverso da quello attuale
        const currentFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        const currentUrl = currentFavicon?.href?.split('?')[0]; // Rimuovi query parameters
        const newUrl = siteContent.favicon;
        
        if (!currentFavicon || currentUrl !== newUrl) {
          updateFavicon(siteContent.favicon);
        }
      }
    } catch (error) {
      console.error("Errore nel controllare il favicon:", error);
    }
  };

  useEffect(() => {
    // Imposta il favicon iniziale se disponibile
    if (initialFavicon) {
      updateFavicon(initialFavicon);
    }

    // Controlla aggiornamenti ogni 5 secondi quando la pagina è attiva
    let intervalId: NodeJS.Timeout;
    
    const startPolling = () => {
      intervalId = setInterval(checkForFaviconUpdates, 5000);
    };
    
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    // Avvia il polling quando la pagina diventa visibile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForFaviconUpdates(); // Check immediato
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Controlla subito al mount
    checkForFaviconUpdates();
    
    // Avvia il polling se la pagina è visibile
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    // Ascolta i cambi di visibilità
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Ascolta eventi custom per aggiornamenti immediati
    const handleFaviconUpdate = (event: CustomEvent) => {
      if (event.detail?.favicon) {
        updateFavicon(event.detail.favicon);
      }
    };

    window.addEventListener('faviconUpdated', handleFaviconUpdate as EventListener);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('faviconUpdated', handleFaviconUpdate as EventListener);
    };
  }, [initialFavicon]);

  // Questo componente non renderizza nulla visivamente
  return null;
}
