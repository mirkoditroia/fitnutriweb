"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAvailabilityByDate, getSiteContent } from "@/lib/datasource";
import { debugLog, debugLogSync } from "@/lib/debugUtils";
import { format, addDays, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { type Package } from "@/lib/data";
import { DateCalendar as SharedDateCalendar } from "@/components/DateCalendar";
import { getDirectState } from "@/lib/directState";
import { toast } from "react-hot-toast";
import { getPackages } from "@/lib/datasource";
import ReCAPTCHA from "react-google-recaptcha";
import { getPaletteConfig } from "@/lib/palettes";

// ✅ Funzione per troncare le descrizioni lunghe
function createDescriptionPreview(description: string, maxLength: number = 120): string {
  if (description.length <= maxLength) {
    return description;
  }
  
  const truncated = description.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

// Schema di validazione
const schema = z.object({
  name: z.string().min(2, "Nome troppo corto"),
  email: z.string().email("Email non valida"),
  phone: z
    .string()
    .min(7, "Telefono obbligatorio")
    .regex(/^[+0-9\s-]+$/, "Formato non valido"),
  // rimosso campo preferenza canale
  date: z.string().min(1, "Seleziona una data"),
  slot: z.string().min(1, "Seleziona un orario disponibile"),
  location: z.enum(["online", "studio"]).optional(),
  packageId: z.string().optional(),
  // priority rimossa
  notes: z.string().optional(), // Note del cliente (sezione "Parlami di te")
  // ✅ GDPR Compliance
  gdprConsent: z.boolean().refine(val => val === true, {
    message: "Devi accettare il trattamento dei dati personali per continuare"
  }),
});

type FormValues = z.infer<typeof schema>;

interface BookingFormProps {
  packageId?: string;
  isFreeConsultation?: boolean;
}

// Componente Calendario
function DateCalendar({ 
  availableDates, 
  selectedDate, 
  onDateSelect, 
  showPromotionalBanner 
}: { 
  availableDates: string[]; 
  selectedDate: string; 
  onDateSelect: (date: string) => void; 
  showPromotionalBanner: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  const isDateSelected = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return selectedDate === dateStr;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (isDateAvailable(date)) {
      onDateSelect(dateStr);
      setIsOpen(false);
    }
  };

  const getDayClasses = (date: Date) => {
    let classes = "w-10 h-10 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all duration-200";
    
    if (isToday(date)) {
      classes += " ring-2 ring-primary/50";
    }
    
    if (isDateSelected(date)) {
      classes += " bg-primary text-primary-foreground font-semibold";
    } else if (isDateAvailable(date)) {
      classes += " bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium border border-emerald-200";
    } else {
      classes += " bg-gray-100 text-gray-400 cursor-not-allowed";
    }
    
    return classes;
  };

  return (
    <div className="relative">
      {/* Input trigger */}
      <div 
        className="w-full p-3 border border-border rounded-lg bg-background text-foreground cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? "text-foreground" : "text-foreground/60"}>
            {selectedDate 
              ? format(new Date(selectedDate), "EEEE d MMMM yyyy", { locale: it })
              : "Seleziona una data"
            }
          </span>
          <span className="text-gray-600">📅</span>
        </div>
      </div>

      {/* Calendario dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
          {/* Header calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ←
            </button>
            <h3 className="font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: it })}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              →
            </button>
          </div>

          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(day => (
              <div key={day} className="w-10 h-10 flex items-center justify-center text-xs font-medium text-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Griglia giorni */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => (
              <div
                key={index}
                className={getDayClasses(day)}
                onClick={() => handleDateClick(day)}
              >
                {format(day, "d")}
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border border-green-700"></div>
                <span className="text-muted-foreground">Disponibile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
                <span className="text-muted-foreground">Non disponibile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Selezionato</span>
              </div>
            </div>
          </div>

          {/* Informazioni aggiuntive */}
          {showPromotionalBanner && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-center">
              <p className="text-xs text-green-700">
                🎯 Solo date con slot promozionali disponibili
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay per chiudere il calendario */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function BookingForm({ adminMode = false, requirePackage = false, hidePackageSelect = false }: { adminMode?: boolean; requirePackage?: boolean; hidePackageSelect?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [location, setLocation] = useState<"online" | "studio" | null>(null);
  const [studioLocation, setStudioLocation] = useState<string>("");
  const [addresses, setAddresses] = useState<{ name: string }[]>([]);
  const [siteContent, setSiteContent] = useState<any>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const availableSlotsRef = useRef<string[]>([]);
  const packagesRef = useRef<Package[]>([]);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sc = await getSiteContent();
        if (mounted) {
          setSiteContent(sc);
          const addr = (sc?.contactAddresses as { name: string }[] | undefined) ?? [];
          setAddresses(addr);
          // Se esiste solo una sede, pre-selezionala
          if (addr.length === 1) {
            setStudioLocation(addr[0].name);
          }
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);
  
  // NUOVO SISTEMA DIRETTO - SEMPLICE E AFFIDABILE
  const [directState, setDirectStateLocal] = useState(getDirectState());
  
  // ✅ ASCOLTA CAMBIAMENTI DELLO STATO DIRETTO
  useEffect(() => {
    const handleDirectStateChange = (event: CustomEvent) => {
      debugLogSync("🔄 DirectState cambiato:", event.detail);
      setDirectStateLocal(event.detail);
    };

    window.addEventListener('directStateChange', handleDirectStateChange as EventListener);
    
    return () => {
      window.removeEventListener('directStateChange', handleDirectStateChange as EventListener);
    };
  }, []);
  
  // ✅ LOGICA COMPLETA: isFreeConsultation da directState O da pacchetto promozionale
  const isFreeConsultation = directState.isFreeConsultation || selectedPackage?.isPromotional === true;
  debugLogSync("🎯 BookingForm - isFreeConsultation:", isFreeConsultation);
  debugLogSync("🎯 BookingForm - directState completo:", directState);
  debugLogSync("🎯 BookingForm - selectedPackage promozionale:", selectedPackage?.isPromotional);
  debugLogSync("🎯 BookingForm - fonte consulenza gratuita:", directState.isFreeConsultation ? "popup" : selectedPackage?.isPromotional ? "dropdown pacchetto promozionale" : "nessuna");
  debugLogSync("📅 BookingForm - selectedDate:", selectedDate);

  // Schema di validazione con validazione personalizzata
  const validationSchema = schema.refine((data) => {
    if (!data.date || !data.slot) return true;
    return availableSlotsRef.current.includes(data.slot);
  }, {
    message: "L'orario selezionato non è più disponibile",
    path: ["slot"]
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      slot: "",
      notes: "",
      packageId: directState.selectedPackageId || "",
      gdprConsent: false, // ✅ GDPR Compliance
      // preferenza canale rimossa
    },
  });

  // NUOVO SISTEMA DIRETTO: Carica pacchetti e applica stato
  useEffect(() => {
    debugLogSync("BookingForm: NUOVO SISTEMA - Inizializzazione");
    
        // 1. Carica i pacchetti direttamente
    const loadPackages = async () => {
      try {
        debugLogSync("BookingForm: Caricamento pacchetti...");
        const pkgs = await getPackages();
        debugLogSync("BookingForm: Pacchetti caricati:", pkgs);
        debugLogSync("🎯 PACCHETTI PROMOZIONALI TROVATI:", pkgs.filter(p => p.isPromotional));
        debugLogSync("🎯 TUTTI I PACCHETTI CON FLAG PROMOZIONALE:", pkgs.map(p => ({ title: p.title, isPromotional: p.isPromotional })));
        debugLogSync("🎯 TUTTI GLI ID DEI PACCHETTI:", pkgs.map(p => p.id));
        debugLogSync("🎯 PACCHETTO FREE-CONSULTATION ESISTE?", pkgs.some(p => p.id === 'free-consultation'));
        
        const finalPackages = pkgs || [];
        setPackages(finalPackages);
        packagesRef.current = finalPackages;
        
        // 2. Applica lo stato diretto
        const currentDirectState = getDirectState();
        debugLogSync("BookingForm: Stato diretto attuale:", currentDirectState);
        
        if (currentDirectState.selectedPackageId && finalPackages.length > 0) {
          debugLogSync("BookingForm: Cercando pacchetto con ID:", currentDirectState.selectedPackageId);
          debugLogSync("BookingForm: Pacchetti disponibili:", finalPackages.map(p => ({ id: p.id, title: p.title, isPromotional: p.isPromotional })));
          const selectedPkg = finalPackages.find(p => p.id === currentDirectState.selectedPackageId);
          debugLogSync("BookingForm: Pacchetto trovato:", selectedPkg);
          
          if (selectedPkg) {
            setSelectedPackage(selectedPkg);
            setValue("packageId", selectedPkg.id || "");
            debugLogSync("BookingForm: SUCCESSO - Form precompilato con:", selectedPkg.title);
          } else {
            console.error("BookingForm: ERRORE - Pacchetto non trovato con ID:", currentDirectState.selectedPackageId);
          }
        }
      } catch (error) {
        console.error("BookingForm: Errore caricamento pacchetti:", error);
      }
    };
    
    loadPackages();
    
    // 3. Ascolta i cambiamenti di stato diretto
    const handleDirectStateChange = (event: CustomEvent) => {
      debugLogSync("BookingForm: Cambio stato diretto:", event.detail);
      setDirectStateLocal(event.detail);
      
      if (event.detail.selectedPackageId && packagesRef.current.length > 0) {
        debugLogSync("BookingForm: Evento directStateChange - Cercando pacchetto con ID:", event.detail.selectedPackageId);
        console.log("BookingForm: Pacchetti disponibili per evento:", packagesRef.current.map(p => ({ id: p.id, title: p.title, isPromotional: p.isPromotional })));
        const selectedPkg = packagesRef.current.find(p => p.id === event.detail.selectedPackageId);
        console.log("BookingForm: Pacchetto trovato per evento:", selectedPkg);
        if (selectedPkg) {
          setSelectedPackage(selectedPkg);
          setValue("packageId", selectedPkg.id || "");
          console.log("BookingForm: Form aggiornato via evento:", selectedPkg.title);
        } else {
          console.error("BookingForm: ERRORE - Pacchetto non trovato per evento con ID:", event.detail.selectedPackageId);
        }
      }
    };
    
    window.addEventListener('directStateChange', handleDirectStateChange as EventListener);
    
    return () => {
      window.removeEventListener('directStateChange', handleDirectStateChange as EventListener);
    };
  }, [setValue]);

  // Gestisce il cambio di pacchetto
  const handlePackageChange = (newPackage: Package | null) => {
    console.log("🔄 CAMBIO PACCHETTO:", {
      old: selectedPackage?.title,
      new: newPackage?.title,
      isPromotional: newPackage?.isPromotional,
      shouldUsePromotionalSlots: newPackage?.isPromotional === true
    });
    setSelectedPackage(newPackage);
    setValue("packageId", newPackage?.id || "");
    setValue("date", "");
    setValue("slot", "");
    setSelectedDate("");
    setAvailableSlots([]);
    setAvailableDates([]);
  };

  // Aggiorna il ref quando cambiano gli slot disponibili
  useEffect(() => {
    availableSlotsRef.current = availableSlots;
  }, [availableSlots]);

  // Genera le date disponibili e controlla la disponibilità
  useEffect(() => {
    // Se non c'è un pacchetto selezionato, usa slot normali

    const generateAvailableDates = async () => {
      // ✅ CORREZIONE: Per consulenze gratuite, estendi il range a 60 giorni per permettere prenotazioni future
      const numberOfDays = (isFreeConsultation || selectedPackage?.isPromotional === true) ? 60 : 14;
      console.log(`📅 Generando ${numberOfDays} date per ${isFreeConsultation ? 'consulenza gratuita' : 'consulenza normale'}`);
      
      const allDates = Array.from({ length: numberOfDays }, (_, i) => {
        const date = addDays(startOfDay(new Date()), i);
        return format(date, "yyyy-MM-dd");
      });

      // Filtra solo le date con slot disponibili
      
      // Controlla la disponibilità in parallelo per migliorare le performance
      const availabilityPromises = allDates.map(async (date) => {
        try {
          const availability = await getAvailabilityByDate(date);
          if (availability) {
            // Usa gli slot promozionali se è un flusso di consultazione gratuita
            const shouldUsePromotionalSlotsForDate = isFreeConsultation || selectedPackage?.isPromotional === true;
            console.log(`📅 Date ${date} - shouldUsePromotionalSlots:`, shouldUsePromotionalSlotsForDate, 
                       `isFreeConsultation:`, isFreeConsultation, 
                       `isPromotional:`, selectedPackage?.isPromotional);
                       
            if (shouldUsePromotionalSlotsForDate) {
              if (availability.freeConsultationSlots && availability.freeConsultationSlots.length > 0) {
                console.log(`✅ Date ${date} - Found promotional slots:`, availability.freeConsultationSlots);
                return date;
              } else {
                console.log(`❌ Date ${date} - No promotional slots available`);
              }
            } else {
              // Per consulenze normali, controlla gli slot standard
              const onlinePool = availability.onlineSlots ?? [];
              const studioPool = availability.studioSlots && studioLocation
                ? (availability.studioSlots[studioLocation] ?? [])
                : (availability.inStudioSlots ?? []);
              // Se l'utente non ha ancora scelto la sede, considera entrambe le liste; altrimenti usa solo quella selezionata
              const pool = location === null
                ? [...onlinePool, ...studioPool]
                : (location === "online" ? onlinePool : studioPool);
              if (pool && pool.length > 0) {
                return date;
              }
            }
          }
          return null;
        } catch (error) {
          console.error(`Errore nel controllo disponibilità per ${date}:`, error);
          return null;
        }
      });

      // Attendi tutte le chiamate in parallelo
      const results = await Promise.all(availabilityPromises);
      const validDates = results.filter((date): date is string => date !== null);
      
      setAvailableDates(validDates);
    };

    generateAvailableDates();
  }, [selectedPackage, isFreeConsultation, location, studioLocation]);

  // Carica la disponibilità per la data selezionata
  useEffect(() => {
    if (!selectedDate) return;

    const loadAvailability = async () => {
      try {
        const availability = await getAvailabilityByDate(selectedDate);
        if (availability) {
          const shouldUsePromotionalSlots = isFreeConsultation || selectedPackage?.isPromotional === true;
          console.log("🔍 DEBUG SLOT:", {
            isFreeConsultation,
            selectedPackage: selectedPackage?.title,
            isPromotional: selectedPackage?.isPromotional,
            shouldUsePromotionalSlots,
            directState: directState,
            selectionSource: isFreeConsultation ? "popup consulenze gratuite" : "dropdown form"
          });
          
          if (shouldUsePromotionalSlots) {
            // Per consultazioni gratuite, mostra solo slot promozionali
            console.log("🎯 CONSULENZA GRATUITA/PROMOZIONALE - Caricando slot promozionali:", availability.freeConsultationSlots);
            setAvailableSlots((availability.freeConsultationSlots || []).map(slot => 
              typeof slot === 'string' ? slot : slot.time
            ));
          } else {
            // Per consulenze normali, mostra slot in base alla sede
            console.log("📋 CONSULENZA NORMALE - Caricando slot normali");
            const onlinePool = availability.onlineSlots ?? [];
            const studioPool = availability.studioSlots && studioLocation
              ? (availability.studioSlots[studioLocation] ?? [])
              : (availability.inStudioSlots ?? []);
            const legacyPool = availability.slots ?? [];
            const pool = location === null
              ? ((onlinePool.length || studioPool.length) ? [...onlinePool, ...studioPool] : legacyPool)
              : (location === "online" ? onlinePool : studioPool);
            console.log("📋 Pool slot normali selezionato:", pool);
            setAvailableSlots(pool);
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento disponibilità:", error);
        setAvailableSlots([]);
      }
    };

    loadAvailability();
  }, [selectedDate, selectedPackage, isFreeConsultation, location, studioLocation]);

  // RIMOSSO: Vecchio sistema di eventi sostituito da stato globale

  // ✅ Funzione per rilevare iOS
  const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // ✅ Funzione per rilevare modalità incognito (migliorata)
  const isIncognito = () => {
    if (typeof window === 'undefined') return false;
    
    // Test multipli per maggiore affidabilità
    try {
      // Test 1: localStorage
      const testKey = `incognito-test-${Date.now()}`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch {
      console.log("🕵️ INCOGNITO: Rilevato tramite localStorage test");
      return true;
    }
    
    try {
      // Test 2: sessionStorage
      const testKey = `session-test-${Date.now()}`;
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
    } catch {
      console.log("🕵️ INCOGNITO: Rilevato tramite sessionStorage test");
      return true;
    }
    
    // Test 3: IndexedDB (per Firefox incognito)
    if (!window.indexedDB) {
      console.log("🕵️ INCOGNITO: Rilevato tramite IndexedDB test");
      return true;
    }
    
    console.log("🕵️ INCOGNITO: Non rilevato - modalità normale");
    return false;
  };

  const onSubmit = async (data: FormValues) => {
    // ✅ Prevenzione doppi click
    if (isSubmitting) {
      return;
    }

    // 🕵️ BLOCCO COMPLETO per modalità incognito
    const incognitoDetected = isIncognito();
    console.log("🕵️ Controllo incognito nel submit:", incognitoDetected);
    
    if (incognitoDetected) {
      console.log("🚫 BLOCCO: Form submission bloccato per modalità incognito");
      toast.error("⚠️ La prenotazione non è disponibile in modalità incognito. Per continuare, apri il sito in modalità normale.", {
        duration: 6000,
        position: 'top-center',
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '16px',
          boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)',
          maxWidth: '90vw'
        },
      });
      return; // STOP - Non continuare
    }
    
    // ✅ iOS debugging
    if (isIOS()) {
      console.log("📱 iOS DETECTED - Form submission attempt");
      console.log("📱 Form data:", data);
      console.log("📱 CAPTCHA token:", captchaToken ? "presente" : "assente");
      console.log("📱 User agent:", navigator.userAgent);
    }
    
    // Consenti esplicitamente l'invio anche senza pacchetto in Admin
    if (requirePackage && !selectedPackage && !adminMode) {
      toast.error("Seleziona un pacchetto per continuare", {
        duration: 3000,
        position: 'top-center',
        style: {
          background: colors.warning,
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '16px',
          boxShadow: `0 10px 25px ${colors.warning}30`
        },
      });
      return;
    }

    // Verifica CAPTCHA se abilitato (skip per admin e modalità incognito)
    if (!adminMode && siteContent?.recaptchaEnabled && !captchaToken && !incognitoDetected) {
      // ✅ iOS: Prova a re-renderizzare il reCAPTCHA se fallisce
      if (isIOS() && recaptchaRef.current) {
        console.log("📱 iOS - Tentativo re-render reCAPTCHA");
        try {
          recaptchaRef.current.reset();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error("📱 iOS - Errore re-render reCAPTCHA:", error);
        }
      }
      
      toast.error("Completa la verifica CAPTCHA per continuare", {
        duration: 3000,
        position: 'top-center',
        style: {
          background: colors.warning,
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '16px',
          boxShadow: `0 10px 25px ${colors.warning}30`
        },
      });
      return;
    }

    setIsSubmitting(true);
    setLoadingStep("Preparando prenotazione...");
    
    try {
      // Aggiungi il flag per la consultazione gratuita
      const bookingData = {
        ...data,
        isFreeConsultation: isFreeConsultation,
        status: "pending" as const,
      };

      setLoadingStep("Verificando disponibilità...");
      
      // ✅ DEBUGGING: Verifica modalità data e importa funzioni
      console.log("🚀 Tentativo prenotazione consulenza gratuita:", { isFreeConsultation, selectedPackage });
      
      // ✅ iOS: Aggiungi delay specifico per iOS per gestire problemi di timing
      if (isIOS()) {
        console.log("📱 iOS - Aggiunto delay specifico per stabilità");
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      try {
        setLoadingStep("Inviando prenotazione...");
        const { createBooking, getDataMode } = await import("@/lib/datasource");
        const currentDataMode = getDataMode();
        console.log("🔍 MODALITÀ DATA ATTIVA:", currentDataMode);
        console.log("🌐 NODE_ENV:", process.env.NODE_ENV);
        console.log("🔥 Firebase Config Present:", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
        
        // ✅ iOS debugging aggiuntivo
        if (isIOS()) {
          console.log("📱 iOS - Payload pre-invio:", {
            name: bookingData.name,
            email: bookingData.email,
            captchaPresent: !!captchaToken,
            dataMode: currentDataMode
          });
        }
        const bookingStatus: "pending" | "confirmed" = adminMode ? "confirmed" : "pending";
        
        const bookingPayload = {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone || undefined,
          packageId: selectedPackage?.id,
          date: bookingData.date,
          slot: bookingData.slot,
          location: (isFreeConsultation || selectedPackage?.isPromotional === true) ? "online" : (location as "online" | "studio"),
          studioLocation: location === "studio" ? (studioLocation || undefined) : undefined,
          status: bookingStatus,
          notes: bookingData.notes,
          isFreeConsultation,
        };
        
        console.log("📤 Payload prenotazione:", bookingPayload);
        console.log("🔑 CAPTCHA token:", captchaToken ? "presente" : "assente");
        console.log("🎯 VERIFICA FLAG: isFreeConsultation nel payload =", bookingPayload.isFreeConsultation);
        console.log("🎯 VERIFICA FLAG: variabile locale isFreeConsultation =", isFreeConsultation);
        
        // ✅ iOS: Gestione speciale per problemi di fetch
        let bookingId;
        if (isIOS()) {
          console.log("📱 iOS - Tentativo createBooking con gestione speciale");
          try {
            // Prova prima con headers specifici iOS
            setLoadingStep("Inviando prenotazione (iOS)...");
            bookingId = await createBooking(bookingPayload, captchaToken || undefined);
          } catch (iosError) {
            console.error("📱 iOS - Primo tentativo fallito:", iosError);
            
            // ✅ Secondo tentativo con fetch nativo per iOS
            console.log("📱 iOS - Secondo tentativo con API diretta");
            setLoadingStep("Tentativo alternativo (iOS)...");
            console.log("📱 iOS - Payload da inviare:", JSON.stringify(bookingPayload, null, 2));
            const response = await fetch("/api/localdb/bookings", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Cache-Control": "no-cache"
              },
              body: JSON.stringify(bookingPayload), // ✅ Rimosso captchaToken dal payload
              credentials: 'same-origin'
            });
            
            console.log("📱 iOS - Response status:", response.status);
            console.log("📱 iOS - Response headers:", Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error("📱 iOS - Response error text:", errorText);
              throw new Error(`iOS API fallback failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log("📱 iOS - Response result:", result);
            bookingId = result.id || result.bookingId || "ios-fallback-success";
            console.log("📱 iOS - Fallback API riuscito:", bookingId);
          }
        } else {
          setLoadingStep("Inviando prenotazione...");
          bookingId = await createBooking(bookingPayload, captchaToken || undefined);
        }
        
        setLoadingStep("Finalizzando...");
        console.log("✅ Prenotazione creata con successo! ID:", bookingId);
        console.log("🔍 Modalità data utilizzata per questa prenotazione:", process.env.NODE_ENV === 'production' ? 'Firebase' : 'Local');
        
        // ✅ RIMOSSA simulazione falsa - ora gestiamo la vera risposta
        if (!bookingId) throw new Error("Prenotazione fallita - nessun ID ricevuto");
      } catch (e) {
        console.error("❌ Errore createBooking principale:", e);
        console.error("❌ Dettaglio errore:", (e as Error).message);
        
        // ✅ iOS: Gestione errori specifica
        if (isIOS()) {
          console.error("📱 iOS - Errore specifico:", e);
          console.error("📱 iOS - User agent:", navigator.userAgent);
          console.error("📱 iOS - Network status:", navigator.onLine);
        }
        
        // ✅ Solo usare fallback se siamo in modalità locale, non Firebase
        const currentDataMode = (await import("@/lib/datasource")).getDataMode();
        if (currentDataMode === "local") {
          setLoadingStep("Tentativo sistema di backup locale...");
          console.log("🔄 Usando fallback locale in modalità dev...");
          
          // Fallback locale con headers iOS-friendly
          setLoadingStep("Inviando tramite backup...");
          const response = await fetch("/api/localdb/bookings", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json",
              ...(isIOS() && {"Cache-Control": "no-cache"})
            },
            body: JSON.stringify(bookingData),
            ...(isIOS() && {credentials: 'same-origin'})
          });
          
          setLoadingStep("Verificando backup...");
          if (!response.ok) {
            console.error("❌ Fallback locale fallito anche!");
            throw new Error("Prenotazione fallita completamente");
          }
          
          setLoadingStep("Backup completato!");
          console.log("✅ Fallback locale riuscito");
        } else {
          // In modalità Firebase, rilancia l'errore originale con info iOS
          const errorMessage = isIOS() 
            ? `Prenotazione fallita in modalità ${currentDataMode} su iOS: ${(e as Error).message}`
            : `Prenotazione fallita in modalità ${currentDataMode}: ${(e as Error).message}`;
          throw new Error(errorMessage);
        }
      }
      
      // ✅ Toast elegante invece di alert browser
      toast.success(
          isFreeConsultation 
            ? "Consulenza gratuita prenotata con successo!" 
            : "Prenotazione inviata con successo!",
          {
            duration: 4000,
            position: 'top-center',
            style: {
              background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`,
              color: 'white',
              fontWeight: '600',
              borderRadius: '16px',
              padding: '20px 28px',
              fontSize: '16px',
              boxShadow: `0 20px 40px rgba(${colors.primaryRgb}, 0.4)`,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            },
            icon: '✓',
            iconTheme: {
              primary: '#ffffff',
              secondary: colors.primary,
            },
          }
        );
        
      // Reset del form
      setValue("name", "");
      setValue("email", "");
      setValue("phone", "");
      setValue("date", "");
      setValue("slot", "");
      setValue("notes", "");
      setValue("gdprConsent", false); // ✅ GDPR Compliance
      setSelectedDate("");
      setAvailableSlots([]);
      // Reset del pacchetto selezionato per tornare al selettore
      setSelectedPackage(null);
      setValue("packageId", "");
      // Reset CAPTCHA
      setCaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (error) {
      console.error("Errore:", error);
      
      // ✅ iOS: Log errore dettagliato
      if (isIOS()) {
        console.error("📱 iOS - Errore finale:", {
          error: error,
          message: (error as Error).message,
          userAgent: navigator.userAgent,
          network: navigator.onLine,
          captchaToken: captchaToken ? "presente" : "assente"
        });
      }
      
      // ✅ Toast elegante per errori con messaggio specifico iOS
      const errorMessage = isIOS() 
        ? "Errore su iOS. Prova a ricaricare la pagina e ripetere l'operazione."
        : "Errore nell'invio della prenotazione. Riprova.";
        
      toast.error(errorMessage, {
        duration: isIOS() ? 6000 : 4000,
        position: 'top-center',
        style: {
          background: colors.error,
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '16px',
          boxShadow: `0 10px 25px ${colors.error}30`
        },
      });
    } finally {
      setIsSubmitting(false);
      setLoadingStep("");
      
      // ✅ iOS: Reset CAPTCHA con delay specifico
      if (recaptchaRef.current) {
        if (isIOS()) {
          setTimeout(() => {
            recaptchaRef.current?.reset();
          }, 300);
        } else {
          recaptchaRef.current.reset();
        }
      }
    }
  };

  // Mostra banner informativo per pacchetti promozionali
  const showPromotionalBanner = selectedPackage?.isPromotional;
  console.log("🎯 SHOW PROMOTIONAL BANNER:", {
    selectedPackage: selectedPackage?.title,
    isPromotional: selectedPackage?.isPromotional,
    showPromotionalBanner,
    isFreeConsultation
  });

  // ✅ Ottieni colori dinamici dalla palette selezionata
  const getPaletteColors = () => {
    const paletteId = siteContent?.colorPalette || 'gz-default';
    const palette = getPaletteConfig(paletteId);
    
    return {
      primary: palette.primary,
      accent: palette.accent,
      success: palette.primary, // Usa primary per successo
      error: '#EF4444', // Rosso universale per errori
      warning: '#F59E0B', // Arancione universale per warning
      primaryRgb: hexToRgb(palette.primary),
      accentRgb: hexToRgb(palette.accent)
    };
  };

  // Helper per convertire hex a RGB
  const hexToRgb = (hex: string): string => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };

  const colors = getPaletteColors();

  // DEBUG: Log stato del componente e palette
  console.log("🎨 PALETTE DINAMICA:", {
    paletteId: siteContent?.colorPalette || 'gz-default',
    colors: colors
  });
  console.log("BookingForm: RENDER - selectedPackage:", selectedPackage);
  console.log("BookingForm: RENDER - packages:", packages);
  console.log("BookingForm: RENDER - packages.length:", packages.length);
  // Mantieni struttura invariata anche senza pacchetto selezionato

  return (
    <div className="section-surface p-6 sm:p-8 space-y-6">
      {/* ⚠️ AVVISO MODALITÀ INCOGNITO */}
      {isIncognito() && (
        <div className="rounded-xl p-4 bg-red-50 border border-red-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-lg">🕵️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800">
                ⚠️ Modalità Incognito Rilevata
              </h3>
              <p className="text-sm text-red-700 mt-1">
                La prenotazione non è disponibile in modalità incognito. Per continuare, <strong>apri il sito in modalità normale</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Banner per pacchetto selezionato */}
      {selectedPackage && (
        <div className={`rounded-xl p-4 shadow-md ${showPromotionalBanner ? 'bg-green-50 border border-green-200' : 'border border-foreground/20 bg-background/70 backdrop-blur-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${showPromotionalBanner ? 'bg-green-100' : 'bg-primary/10'}`}>
              <span className="text-lg">{showPromotionalBanner ? '🎯' : '📦'}</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${showPromotionalBanner ? 'text-green-800' : 'text-foreground'}`}>
                {selectedPackage.title}
              </h3>
              <p className={`text-sm ${showPromotionalBanner ? 'text-green-700' : 'text-foreground'}`}>
                {createDescriptionPreview(selectedPackage.description)}
              </p>
              {!showPromotionalBanner && (
                <div className="mt-2">
                  {selectedPackage.hasDiscount && selectedPackage.basePrice && selectedPackage.discountedPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        € {selectedPackage.discountedPrice}
                      </span>
                      <span className="text-sm text-gray-600 line-through">
                        € {selectedPackage.basePrice}
                      </span>
                      {selectedPackage.discountPercentage && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          -{selectedPackage.discountPercentage}%
          </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-primary">
                      € {selectedPackage.price}
                    </p>
                  )}
                  {selectedPackage.paymentText && (
                    <p className="text-xs text-foreground mt-1">
                      {selectedPackage.paymentText}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form di prenotazione */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Selettore Pacchetto */}
      <div className="form-surface p-4">
          <label className="block text-sm font-medium mb-2 text-foreground">
            Pacchetto
          </label>
          <select
            value={selectedPackage?.id || ""}
            onChange={(e) => {
              const val = e.target.value;
              const newPackage = packages.find(p => p.id === val);
              handlePackageChange(newPackage || null);
            }}
            className="w-full rounded-lg border border-foreground/10 bg-background/70 backdrop-blur-sm px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-[rgba(var(--primary-rgb),0.15)]"
          >
            <option value="">Seleziona un pacchetto</option>
            {packages.map((pkg) => {
              // Determina il prezzo da mostrare
              let displayPrice = "";
              if (pkg.isPromotional) {
                displayPrice = "(Gratuito)";
              } else if (pkg.hasDiscount && pkg.basePrice && pkg.discountedPrice) {
                displayPrice = `- €${pkg.discountedPrice} (scontato da €${pkg.basePrice})`;
              } else {
                displayPrice = `- €${pkg.price}`;
              }
              
              return (
                <option key={pkg.id} value={pkg.id || ""}>
                  {pkg.title} {displayPrice}
                </option>
              );
            })}
        </select>
          <p className="text-xs text-black mt-1">
            Puoi cambiare pacchetto in qualsiasi momento
          </p>
        </div>

        {/* Nome */}
        <div className="form-surface p-4">
          <Input
            label="Nome completo *"
            {...register("name")}
            placeholder="Il tuo nome"
          />
          {errors.name && (
            <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="form-surface p-4">
          <Input
            label="Email *"
            type="email"
            {...register("email")}
            placeholder="la-tua-email@esempio.com"
          />
          {errors.email && (
            <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Telefono */}
        <div className="form-surface p-4">
          <Input
            label="Telefono *"
            {...register("phone")}
            placeholder="+39 123 456 7890"
          />
          {errors.phone && (
            <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Sede appuntamento - PRIMA della data */}
        {!(showPromotionalBanner || isFreeConsultation) && (
          <div className="form-surface p-4">
            <label className="block text-sm font-medium mb-2 text-black">Sede appuntamento</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Sede appuntamento">
              <button
                type="button"
                onClick={() => setLocation("online")}
                aria-pressed={location === "online"}
                className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--primary-rgb),0.15)] ${
                  location === "online"
                    ? "border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(11,94,11,0.10)]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="text-xl">🌐</span>
                <div className="text-left">
                  <div className={`text-sm font-semibold ${location === "online" ? "text-primary" : "text-black"}`}>Online</div>
                  <div className="text-[12px] text-foreground/60">Videochiamata</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLocation("studio")}
                aria-pressed={location === "studio"}
                className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(var(--primary-rgb),0.15)] ${
                  location === "studio"
                    ? "border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(11,94,11,0.10)]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="text-xl">🏢</span>
                <div className="text-left">
                  <div className={`text-sm font-semibold ${location === "studio" ? "text-primary" : "text-black"}`}>In studio</div>
                  <div className="text-[12px] text-foreground/60">Presso studio</div>
                </div>
              </button>
            </div>
            <p className="text-xs text-black mt-2">Per consultazioni gratuite la sede è sempre Online.</p>
        </div>
      )}

        {/* Selezione sede specifica quando "In studio" */}
        {location === "studio" && (
          <div className="form-surface p-4">
            <label className="block text-sm font-medium mb-2 text-black">Seleziona sede</label>
            <select
              value={studioLocation}
              onChange={(e) => {
                setStudioLocation(e.target.value);
                setValue("slot", "");
              }}
              className="w-full p-3 border border-border rounded-lg bg-background text-black"
            >
              <option value="">-- Seleziona sede --</option>
              {addresses.map((addr, idx) => (
                <option key={idx} value={addr.name}>{addr.name}</option>
              ))}
            </select>
            {studioLocation === "" && (
              <p className="text-xs text-red-600 mt-1">Seleziona una sede per visualizzare gli slot disponibili.</p>
            )}
          </div>
        )}

        {/* Riepilogo pacchetto rimosso */}

        {/* Selettore Pacchetto (opzionale per admin) */}
        {adminMode && requirePackage && !hidePackageSelect && (
          <div className="form-surface p-4">
            <label className="block text-sm font-medium mb-2 text-foreground">Seleziona pacchetto</label>
            <select
              value={watch("packageId")}
              onChange={(e) => {
                const id = e.target.value;
                setValue("packageId", id);
                const found = packages.find(p => p.id === id) || null;
                setSelectedPackage(found);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Nessun pacchetto</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
        </select>
      </div>
        )}

        {/* Data con calendario interattivo (sempre visibile) */}
        <div className="form-surface p-4">
            <label className="block text-sm font-medium mb-2 text-black">
              Data * {showPromotionalBanner && <span className="text-green-600">(Solo date con disponibilità)</span>}
            </label>
            <DateCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setValue("date", date);
                setValue("slot", ""); // Reset slot quando cambia data
              }}
              showPromotionalBanner={showPromotionalBanner || false}
            />
            {errors.date && (
              <p className="text-destructive text-sm mt-1">{errors.date.message}</p>
            )}
            {availableDates.length === 0 && (
              <p className="text-black text-sm mt-1">
                {showPromotionalBanner 
                  ? "Nessuna data disponibile per consultazioni gratuite" 
                  : "Nessuna data disponibile per consulenze"
                }
              </p>
            )}
        </div>

        {/* preferenza canale rimossa */}

        

        {/* Slot orari */}
        {selectedDate && availableSlots.length > 0 && (
          <div className="form-surface p-4">
            <label className="block text-sm font-medium mb-2 text-black">
              Orario disponibile * {showPromotionalBanner && <span className="text-green-600">(Slot promozionali)</span>}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setValue("slot", slot)}
                  className={`p-3 border rounded-lg text-sm transition-colors ${
                    watch("slot") === slot
                      ? "border-primary bg-[color:var(--secondary-bg)] text-[color:var(--secondary-fg)]"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {(() => {
                    // Renderizza orari in formato HH:mm se slot è formato con data ISO
                    // e mantiene già HH:mm se è semplice
                    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(slot)) {
                      try {
                        const d = new Date(slot);
                        const hh = String(d.getHours()).padStart(2, "0");
                        const mm = String(d.getMinutes()).padStart(2, "0");
                        return `${hh}:${mm}`;
                      } catch {
                        return slot;
                      }
                    }
                    return slot;
                  })()}
                </button>
              ))}
            </div>
            {errors.slot && (
              <p className="text-destructive text-sm mt-1">{errors.slot.message}</p>
        )}
      </div>
        )}

        {/* priorità rimossa */}

        {/* Sezione "Parlami di te" */}
        <div className="form-surface p-4">
          <label className="block text-sm font-medium mb-2 text-black">
            Parlami di te
      </label>
          <textarea
            {...register("notes")}
            placeholder="Raccontaci i tuoi obiettivi, esperienze precedenti, preferenze alimentari, eventuali limitazioni o qualsiasi altra informazione che ritieni importante per la tua consulenza..."
            className="w-full rounded-lg border border-foreground/10 bg-background/70 backdrop-blur-sm px-3.5 py-2.5 text-sm text-black min-h-[120px] resize-y focus:outline-none focus:ring-4 focus:ring-[rgba(var(--primary-rgb),0.15)]"
            rows={5}
          />
          
        </div>

        {/* GDPR Consent - Solo se non in modalità admin */}
        {!adminMode && (
          <div className="form-surface p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="gdprConsent"
                {...register("gdprConsent")}
                className="mt-1 w-4 h-4 text-primary bg-background border-foreground/20 rounded focus:ring-primary focus:ring-2"
              />
              <div className="flex-1">
                <label htmlFor="gdprConsent" className="text-sm text-black cursor-pointer">
                  <span className="font-medium">Accetto il trattamento dei dati personali *</span>
                  <p className="text-xs text-foreground/70 mt-1">
                    {siteContent?.legalInfo?.gdprConsentText || 
                      "Acconsento al trattamento dei miei dati personali per la gestione della prenotazione e per ricevere comunicazioni relative al servizio, ai sensi del GDPR (Regolamento UE 2016/679). I dati saranno utilizzati esclusivamente per le finalità indicate e non saranno comunicati a terzi."}
                  </p>
                  <a 
                    href="/privacy"
                    className="text-primary hover:underline text-xs mt-1 inline-block"
                  >
                    Leggi la Privacy Policy
                  </a>
                </label>
                {errors.gdprConsent && (
                  <p className="text-destructive text-sm mt-1">{errors.gdprConsent.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CAPTCHA - Solo se abilitato e non in modalità admin */}
        {!adminMode && siteContent?.recaptchaEnabled && siteContent?.recaptchaSiteKey && (
          <div className="form-surface p-4">
            <label className="block text-sm font-medium mb-2 text-black">
              Verifica di sicurezza *
            </label>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteContent.recaptchaSiteKey}
              onChange={(token) => {
                console.log("🔑 CAPTCHA onChange:", token ? "token ricevuto" : "token null");
                if (isIOS()) {
                  console.log("📱 iOS - CAPTCHA token ricevuto");
                }
                setCaptchaToken(token);
              }}
              onExpired={() => {
                console.log("⏰ CAPTCHA expired");
                if (isIOS()) {
                  console.log("📱 iOS - CAPTCHA scaduto");
                }
                setCaptchaToken(null);
              }}
              onError={(error) => {
                console.error("❌ CAPTCHA error:", error);
                if (isIOS()) {
                  console.error("📱 iOS - CAPTCHA errore:", error);
                }
                setCaptchaToken(null);
              }}
              onLoad={() => {
                console.log("✅ CAPTCHA loaded");
                if (isIOS()) {
                  console.log("📱 iOS - CAPTCHA caricato");
                }
              }}
            />
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting || (!adminMode && siteContent?.recaptchaEnabled && !captchaToken) || isIncognito()}
          className="w-full relative transition-all duration-300"
          style={{
            background: isSubmitting 
              ? `linear-gradient(to right, rgba(${colors.primaryRgb}, 0.8), rgba(${colors.primaryRgb}, 0.9))`
              : `linear-gradient(to right, ${colors.primary}, rgba(${colors.primaryRgb}, 0.9))`,
            transform: isSubmitting ? "scale(0.98)" : "scale(1)",
            boxShadow: isSubmitting 
              ? `0 10px 20px rgba(${colors.primaryRgb}, 0.3)`
              : `0 4px 12px rgba(${colors.primaryRgb}, 0.2)`,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = `0 15px 30px rgba(${colors.primaryRgb}, 0.4)`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 12px rgba(${colors.primaryRgb}, 0.2)`;
            }
          }}
          onMouseDown={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "scale(0.95)";
            }
          }}
          onMouseUp={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
        >
          {isSubmitting && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <div 
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRightColor: 'rgba(255, 255, 255, 0.6)'
                }}
              ></div>
            </div>
          )}
          <span className={`font-semibold transition-all duration-300 ${isSubmitting ? "ml-8" : ""}`}>
            {isIncognito()
              ? "🕵️ Non disponibile in modalità incognito"
              : isSubmitting 
                ? "Invio in corso..." 
                : !selectedPackage
                  ? "Invia richiesta"
                  : showPromotionalBanner 
                    ? "Prenota Consultazione Gratuita" 
                    : "Prenota Consulenza"
            }
          </span>
        </Button>

        {/* Informazioni aggiuntive per consultazione gratuita */}
        {selectedPackage && showPromotionalBanner && (
          <div className="text-center text-sm text-black">
            
      </div>
        )}
    </form>

    {/* ✅ Overlay di caricamento moderno e elegante */}
    {isSubmitting && (
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
          {/* Spinner moderno elegante */}
          <div className="relative mb-6 flex justify-center">
            <div className="relative w-16 h-16">
              {/* Rotellina principale */}
              <div 
                className="absolute inset-0 border-4 border-gray-200 rounded-full animate-spin"
                style={{
                  borderTopColor: colors.primary,
                  borderRightColor: colors.accent,
                  borderBottomColor: 'transparent',
                  borderLeftColor: 'transparent',
                  animationDuration: '1s'
                }}
              ></div>
              {/* Rotellina interna centrata */}
              <div 
                className="absolute inset-2 border-2 border-gray-100 rounded-full animate-spin"
                style={{
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: colors.primary,
                  borderLeftColor: colors.accent,
                  animationDirection: 'reverse',
                  animationDuration: '1.5s'
                }}
              ></div>
              {/* Punto centrale perfettamente centrato */}
              <div 
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: colors.primary,
                  transform: 'translate(-50%, -50%)'
                }}
              ></div>
            </div>
          </div>
          
          {/* Messaggio di stato */}
          <div className="mb-3">
            <h3 className="text-xl font-bold text-gray-800">
              {isFreeConsultation ? "Consulenza Gratuita" : "Nuova Prenotazione"}
            </h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 animate-pulse">
            {loadingStep || "Elaborazione in corso..."}
          </p>
          
          {/* Barra di progresso elegante */}
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${colors.primary}, rgba(${colors.primaryRgb}, 0.8))`,
                width: loadingStep.includes("Preparando") ? "20%" :
                       loadingStep.includes("Verificando") ? "40%" :
                       loadingStep.includes("Inviando") ? "60%" :
                       loadingStep.includes("Tentativo") ? "80%" :
                       loadingStep.includes("Finalizzando") ? "90%" :
                       loadingStep.includes("Completato") || loadingStep.includes("Backup") ? "100%" :
                       "10%"
              }}
            >
              {/* Effetto shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
          
          {/* Percentuale e stato dettagliato */}
          <div className="mt-2 text-xs text-gray-500 font-medium">
            {loadingStep.includes("Preparando") ? "20%" :
             loadingStep.includes("Verificando") ? "40%" :
             loadingStep.includes("Inviando") ? "60%" :
             loadingStep.includes("Tentativo") ? "80%" :
             loadingStep.includes("Finalizzando") ? "90%" :
             loadingStep.includes("Completato") || loadingStep.includes("Backup") ? "100%" :
             "10%"} completato
          </div>
          
          {/* Indicatore di tempo stimato */}
          <div className="mt-1 text-xs text-gray-400">
            {loadingStep.includes("Preparando") ? "⏱️ Tempo stimato: 2-3 secondi" :
             loadingStep.includes("Verificando") ? "⏱️ Tempo stimato: 1-2 secondi" :
             loadingStep.includes("Inviando") ? "⏱️ Tempo stimato: 1-2 secondi" :
             loadingStep.includes("Tentativo") ? "⏱️ Quasi completato..." :
             loadingStep.includes("Finalizzando") ? "⏱️ Finalizzazione..." :
             loadingStep.includes("Completato") || loadingStep.includes("Backup") ? "✅ Completato!" :
             "⏱️ Inizializzazione..."}
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
