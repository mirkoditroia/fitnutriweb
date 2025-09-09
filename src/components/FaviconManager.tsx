"use client";
import { useEffect } from "react";
import { debugLogSync } from "@/lib/debugUtils";

interface FaviconManagerProps {
  initialFavicon?: string;
}

export default function FaviconManager({ initialFavicon }: FaviconManagerProps) {
  debugLogSync(`🚀 FaviconManager inizializzato con favicon: ${initialFavicon || 'nessuno'}`);
  
  const updateFavicon = (faviconUrl: string) => {
    if (!faviconUrl) {
      console.warn('updateFavicon chiamato senza URL');
      return;
    }

    try {
      // Aspetta che il DOM sia completamente caricato
      if (document.readyState !== 'loading') {
        doUpdateFavicon(faviconUrl);
      } else {
        document.addEventListener('DOMContentLoaded', () => doUpdateFavicon(faviconUrl));
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del favicon:', error);
    }
  };

  const doUpdateFavicon = (faviconUrl: string) => {
    try {
      // Strategia semplificata: cerca il favicon esistente e aggiorna solo l'href
      let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      
      if (faviconLink) {
        // Aggiorna semplicemente l'href esistente
        faviconLink.href = `${faviconUrl}?v=${Date.now()}`;
        debugLogSync(`🎯 Favicon href aggiornato: ${faviconUrl}`);
      } else {
        // Se non esiste, creane uno nuovo (solo se il documento è pronto)
        if (document.head) {
          faviconLink = document.createElement('link');
          faviconLink.rel = 'icon';
          faviconLink.type = 'image/x-icon';
          faviconLink.href = `${faviconUrl}?v=${Date.now()}`;
          document.head.appendChild(faviconLink);
          debugLogSync(`🎯 Nuovo favicon creato: ${faviconUrl}`);
        } else {
          console.warn('Document head non disponibile');
        }
      }
    } catch (error) {
      console.error('Errore in doUpdateFavicon:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Ascolta SOLO eventi custom per aggiornamenti immediati
    const handleFaviconUpdate = (event: CustomEvent) => {
      if (isMounted && event.detail?.favicon) {
        debugLogSync(`📡 Evento favicon ricevuto: ${event.detail.favicon}`);
        updateFavicon(event.detail.favicon);
      }
    };

    // Aggiungi event listener per eventi custom
    window.addEventListener('faviconUpdated', handleFaviconUpdate as EventListener);

    // Imposta il favicon iniziale dopo un breve delay per evitare race conditions
    if (initialFavicon && isMounted) {
      setTimeout(() => {
        if (isMounted) {
          updateFavicon(initialFavicon);
        }
      }, 50);
    }

    return () => {
      isMounted = false;
      window.removeEventListener('faviconUpdated', handleFaviconUpdate as EventListener);
    };
  }, [initialFavicon]);

  // Questo componente non renderizza nulla visivamente
  return null;
}
