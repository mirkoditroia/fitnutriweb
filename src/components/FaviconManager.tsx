"use client";
import { useEffect } from "react";
import { getSiteContent } from "@/lib/datasource";

interface FaviconManagerProps {
  initialFavicon?: string;
}

export default function FaviconManager({ initialFavicon }: FaviconManagerProps) {
  console.log(`🚀 FaviconManager inizializzato con favicon: ${initialFavicon || 'nessuno'}`);
  const updateFavicon = (faviconUrl: string) => {
    if (!faviconUrl) {
      console.warn('updateFavicon chiamato senza URL');
      return;
    }

    try {
      // Rimuovi tutti i favicon esistenti in modo sicuro
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => {
        try {
          if (link && link.parentNode) {
            link.parentNode.removeChild(link);
          }
        } catch (error) {
          console.warn('Errore nella rimozione del favicon esistente:', error);
        }
      });
      
      // Aggiungi il nuovo favicon con cache busting
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = `${faviconUrl}?v=${Date.now()}`;
      
      // Verifica che head esista prima di aggiungere
      if (document.head) {
        document.head.appendChild(link);
        console.log(`🎯 Favicon aggiornato: ${faviconUrl}`);
      } else {
        console.warn('Document head non disponibile per aggiungere il favicon');
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del favicon:', error);
    }
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
          console.log(`🔄 Favicon change detected: ${currentUrl} -> ${newUrl}`);
          updateFavicon(siteContent.favicon);
        }
      }
    } catch (error) {
      console.error("Errore nel controllare il favicon:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    // Imposta il favicon iniziale se disponibile
    if (initialFavicon && isMounted) {
      updateFavicon(initialFavicon);
    }

    // Ascolta eventi custom per aggiornamenti immediati
    const handleFaviconUpdate = (event: CustomEvent) => {
      if (isMounted && event.detail?.favicon) {
        console.log(`📡 Evento favicon ricevuto: ${event.detail.favicon}`);
        updateFavicon(event.detail.favicon);
      }
    };

    // Controlla aggiornamenti periodicamente (solo per backup)
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (isMounted) {
          checkForFaviconUpdates();
        }
      }, 10000); // Ridotto a 10 secondi per essere meno aggressivo
    };

    // Setup iniziale
    const setupFavicon = async () => {
      if (isMounted) {
        console.log('🔧 Setup FaviconManager: controllo aggiornamenti...');
        await checkForFaviconUpdates();
        console.log('🔧 Setup FaviconManager: avvio polling...');
        startPolling();
      }
    };

    // Aggiungi event listener
    window.addEventListener('faviconUpdated', handleFaviconUpdate as EventListener);
    
    // Setup iniziale ritardato per evitare race conditions
    setTimeout(() => {
      if (isMounted) {
        setupFavicon();
      }
    }, 100);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('faviconUpdated', handleFaviconUpdate as EventListener);
    };
  }, [initialFavicon]);

  // Questo componente non renderizza nulla visivamente
  return null;
}
