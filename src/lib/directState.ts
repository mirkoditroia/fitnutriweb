"use client";

// Sistema di stato diretto e semplice
export interface DirectState {
  selectedPackageId: string | null;
  isFreeConsultation: boolean;
}

// Chiave per localStorage
const STORAGE_KEY = 'gznutrition_state';

// Funzioni dirette per gestire lo stato
export const getDirectState = (): DirectState => {
  if (typeof window === 'undefined') {
    return { selectedPackageId: null, isFreeConsultation: false };
  }
  
  // Prima prova dall'URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlPackageId = urlParams.get('packageId');
  
  if (urlPackageId) {
    const state = {
      selectedPackageId: urlPackageId,
      isFreeConsultation: urlPackageId === 'free-consultation'
    };
    // Salva anche in localStorage per persistenza
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
  
  // Fallback a localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('DirectState: Errore lettura localStorage:', error);
  }
  
  return { selectedPackageId: null, isFreeConsultation: false };
};

export const setDirectState = (packageId: string | null, isFreeConsultation: boolean = false): void => {
  const state = { selectedPackageId: packageId, isFreeConsultation };
  
  console.log('DirectState: Impostazione stato:', state);
  
  if (typeof window !== 'undefined') {
    // Salva in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Aggiorna URL se necessario
    if (packageId) {
      const url = new URL(window.location.href);
      url.searchParams.set('packageId', packageId);
      window.history.replaceState({}, '', url.toString());
    }
    
    // Dispatch evento personalizzato per notificare i componenti
    window.dispatchEvent(new CustomEvent('directStateChange', { 
      detail: state 
    }));
  }
};

export const clearDirectState = (): void => {
  console.log('DirectState: Pulizia stato');
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    
    const url = new URL(window.location.href);
    url.searchParams.delete('packageId');
    window.history.replaceState({}, '', url.toString());
    
    window.dispatchEvent(new CustomEvent('directStateChange', { 
      detail: { selectedPackageId: null, isFreeConsultation: false } 
    }));
  }
};
