// Sistema di stato globale semplice per bypassare problemi di eventi
export interface GlobalState {
  selectedPackageId: string | null;
  isFreeConsultation: boolean;
  packages: any[];
  siteContent: any;
}

// Stato globale
let globalState: GlobalState = {
  selectedPackageId: null,
  isFreeConsultation: false,
  packages: [],
  siteContent: null
};

// Listeners per cambiamenti
const listeners: Array<(state: GlobalState) => void> = [];

// Funzioni per gestire lo stato
export const getGlobalState = (): GlobalState => {
  return { ...globalState };
};

export const setGlobalState = (updates: Partial<GlobalState>): void => {
  console.log("GlobalState: Aggiornamento stato:", updates);
  globalState = { ...globalState, ...updates };
  console.log("GlobalState: Nuovo stato:", globalState);
  
  // Notifica tutti i listener
  listeners.forEach(listener => {
    try {
      listener(globalState);
    } catch (error) {
      console.error("GlobalState: Errore in listener:", error);
    }
  });
};

export const subscribeToGlobalState = (listener: (state: GlobalState) => void): (() => void) => {
  listeners.push(listener);
  
  // Ritorna funzione per unsubscribe
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Funzioni helper
export const setSelectedPackage = (packageId: string | null, isFreeConsultation: boolean = false): void => {
  console.log("GlobalState: setSelectedPackage chiamato:", { packageId, isFreeConsultation });
  setGlobalState({ 
    selectedPackageId: packageId, 
    isFreeConsultation 
  });
};

export const setPackages = (packages: any[]): void => {
  console.log("GlobalState: setPackages chiamato:", packages);
  setGlobalState({ packages });
};

export const setSiteContent = (siteContent: any): void => {
  console.log("GlobalState: setSiteContent chiamato:", siteContent);
  setGlobalState({ siteContent });
};

// Funzione per inizializzare da URL
export const initializeFromUrl = (): void => {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const packageId = urlParams.get('packageId');
  
  console.log("GlobalState: Inizializzazione da URL, packageId:", packageId);
  
  if (packageId) {
    const isFreeConsultation = packageId === 'free-consultation';
    setSelectedPackage(packageId, isFreeConsultation);
  }
};
