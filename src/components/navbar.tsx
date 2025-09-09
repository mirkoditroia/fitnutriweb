"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
// removed client content fetch for mode

const baseNavigationItems = [
  { name: "Chi sono", href: "#chi-sono" },
  { name: "Pacchetti", href: "#pacchetti" },
  { name: "Prenota", href: "#booking" },
  { name: "Contatti", href: "#contatti" },
  { name: "Recensioni", href: "#recensioni" },
];

// Funzione per generare navigationItems dinamici
const getNavigationItems = (siteContent: any) => {
  const items = [...baseNavigationItems];
  
  console.log("🔍 getNavigationItems: siteContent:", siteContent);
  console.log("🔍 getNavigationItems: bmiCalculator enabled:", siteContent?.bmiCalculator?.enabled);
  console.log("🔍 getNavigationItems: googleReviews enabled:", siteContent?.googleReviews?.enabled);
  console.log("🔍 getNavigationItems: sectionVisibility:", siteContent?.sectionVisibility);
  
  // ✅ NUOVA FEATURE: Rimuovi sezioni nascoste dalla navbar
  const sectionVisibility = siteContent?.sectionVisibility;
  
  // Rimuovi "Chi sono" se la sezione about è nascosta
  if (sectionVisibility?.about === false) {
    console.log("❌ Sezione About nascosta - rimuovo dalla navbar");
    const chiSonoIndex = items.findIndex(item => item.href === "#chi-sono");
    if (chiSonoIndex !== -1) {
      items.splice(chiSonoIndex, 1);
    }
  }
  
  // Rimuovi "Pacchetti" se la sezione packages è nascosta
  if (sectionVisibility?.packages === false) {
    console.log("❌ Sezione Pacchetti nascosta - rimuovo dalla navbar");
    const pacchettiIndex = items.findIndex(item => item.href === "#pacchetti");
    if (pacchettiIndex !== -1) {
      items.splice(pacchettiIndex, 1);
    }
  }
  
  // Rimuovi "Prenota" se la sezione bookingForm è nascosta
  if (sectionVisibility?.bookingForm === false) {
    console.log("❌ Sezione Booking Form nascosta - rimuovo dalla navbar");
    const prenotaIndex = items.findIndex(item => item.href === "#booking");
    if (prenotaIndex !== -1) {
      items.splice(prenotaIndex, 1);
    }
  }
  
  // Rimuovi "Contatti" se la sezione contact è nascosta
  if (sectionVisibility?.contact === false) {
    console.log("❌ Sezione Contatti nascosta - rimuovo dalla navbar");
    const contattiIndex = items.findIndex(item => item.href === "#contatti");
    if (contattiIndex !== -1) {
      items.splice(contattiIndex, 1);
    }
  }
  
  // Aggiungi BMI se attivato (solo se la sezione about è visibile)
  if (siteContent?.bmiCalculator?.enabled && sectionVisibility?.about !== false) {
    console.log("✅ BMI attivato - aggiungo alla navbar");
    // Inserisci BMI dopo "Chi sono" e prima di "Pacchetti"
    const chiSonoIndex = items.findIndex(item => item.href === "#chi-sono");
    if (chiSonoIndex !== -1) {
      items.splice(chiSonoIndex + 1, 0, { name: "BMI", href: "#bmi-calculator" });
    }
  } else {
    console.log("❌ BMI non attivato o sezione about nascosta - navbar standard");
  }
  
  // Rimuovi Recensioni se disattivate
  if (!siteContent?.googleReviews?.enabled) {
    console.log("❌ Recensioni disattivate - rimuovo dalla navbar");
    const recensioniIndex = items.findIndex(item => item.href === "#recensioni");
    if (recensioniIndex !== -1) {
      items.splice(recensioniIndex, 1);
    }
  } else {
    console.log("✅ Recensioni attivate - mantengo nella navbar");
  }
  
  console.log("🔍 getNavigationItems: items finali:", items);
  return items;
};

import { getSiteContent } from "@/lib/datasource";
type BrandCfg = { mode: "image"|"text"; imageUrl?: string; height?: number; autoBg?: boolean; text?: string; color?: string; weight?: number; size?: number };
type NavbarProps = { initialBrand?: BrandCfg; initialSiteContent?: any };
export function Navbar({ initialBrand, initialSiteContent }: NavbarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [brand, setBrand] = useState<BrandCfg | null>(initialBrand ?? null);
  const [imageLoaded, setImageLoaded] = useState(
    initialBrand ? (initialBrand.mode === 'image' ? !!initialBrand.imageUrl : true) : false
  );
  const [siteContent, setSiteContent] = useState<any>(initialSiteContent);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load branding info and site content
  useEffect(() => {
    // Handle initial brand from SSR
    if (initialBrand) {
      if (initialBrand.mode === 'image' && initialBrand.imageUrl) {
        setImageLoaded(true); // Should already be preloaded
      } else {
        setImageLoaded(true); // Text mode or no image
      }
    }

    // Function to load site content
    const loadSiteContent = () => {
      getSiteContent().then((c) => {
        console.log("🔍 Navbar: Caricamento contenuto sito completo:", c);
        console.log("🔍 Navbar: bmiCalculator object:", c?.bmiCalculator);
        console.log("🔍 Navbar: bmiCalculator.enabled:", c?.bmiCalculator?.enabled);
        console.log("🔍 Navbar: googleReviews object:", c?.googleReviews);
        console.log("🔍 Navbar: googleReviews.enabled:", c?.googleReviews?.enabled);
        
        // Set brand config if not already set from SSR
        if (!initialBrand) {
          const cfg: BrandCfg = {
            mode: c?.navbarLogoMode === 'image' ? 'image' : 'text',
            imageUrl: c?.navbarLogoImageUrl || undefined,
            height: typeof c?.navbarLogoHeight === 'number' ? c?.navbarLogoHeight : 40,
            autoBg: Boolean(c?.navbarLogoAutoRemoveBg),
            text: c?.navbarLogoText || 'GZnutrition',
            color: undefined, // Use CSS variable
            weight: typeof c?.navbarLogoTextWeight === 'number' ? c?.navbarLogoTextWeight : 700,
            size: typeof c?.navbarLogoTextSize === 'number' ? c?.navbarLogoTextSize : 20,
          };
          
          // Preload image if mode is image
          if (cfg.mode === 'image' && cfg.imageUrl) {
            const img = new Image();
            img.onload = () => {
              setImageLoaded(true);
              setBrand(cfg);
            };
            img.onerror = () => {
              // Fallback to text mode if image fails to load
              setBrand({...cfg, mode: 'text'});
            };
            img.src = cfg.imageUrl;
          } else {
            setBrand(cfg);
          }
        }
        
        // Always set site content for BMI and Reviews check
        setSiteContent(c);
      }).catch((error) => {
        console.error("❌ Navbar: Errore caricamento contenuto sito:", error);
      });
    };

    // Load initially only if we don't have initial content
    if (!initialSiteContent) {
      loadSiteContent();
    } else {
      console.log("✅ Navbar: Usando contenuto iniziale SSR - nessun lag");
    }

    // Listen for content changes (when admin saves)
    const handleContentChange = () => {
      console.log("🔄 Navbar: Rilevato cambiamento contenuto - ricarico");
      loadSiteContent();
    };

    // Add event listener for content changes
    window.addEventListener('contentUpdated', handleContentChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('contentUpdated', handleContentChange);
    };
  }, [initialBrand]);

  // Glass navbar using CSS variables
  const headerClasses = 'backdrop-blur-xl border-b border-white/15 shadow-lg shadow-black/30';

  // ✅ Gestione scroll navbar con approccio più robusto
  useEffect(() => {
    const navbar = document.querySelector('header');
    if (!navbar) return;

    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleMouseEnter = () => {
      // Disabilita scroll del body quando si entra nella navbar
      document.body.style.overflow = 'hidden';
      
      // Aggiungi listeners per bloccare tutti i tipi di scroll
      navbar.addEventListener('wheel', preventScroll, { passive: false });
      navbar.addEventListener('scroll', preventScroll, { passive: false });
      navbar.addEventListener('touchmove', preventScroll, { passive: false });
    };

    const handleMouseLeave = () => {
      // Riabilita scroll del body quando si esce dalla navbar
      document.body.style.overflow = 'unset';
      
      // Rimuovi listeners
      navbar.removeEventListener('wheel', preventScroll);
      navbar.removeEventListener('scroll', preventScroll);
      navbar.removeEventListener('touchmove', preventScroll);
    };

    navbar.addEventListener('mouseenter', handleMouseEnter);
    navbar.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      navbar.removeEventListener('mouseenter', handleMouseEnter);
      navbar.removeEventListener('mouseleave', handleMouseLeave);
      navbar.removeEventListener('wheel', preventScroll);
      navbar.removeEventListener('scroll', preventScroll);
      navbar.removeEventListener('touchmove', preventScroll);
      // Assicurati che lo scroll sia riabilitato alla pulizia
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
        <header 
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerClasses}`} 
          style={{ 
            backgroundColor: 'var(--navbar-bg)', 
            color: 'var(--navbar-text)'
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                {brand?.mode === "image" && brand?.imageUrl ? (
                  <div className="relative flex items-center">
                    {/* Image logo - always render if we have imageUrl */}
                    <img
                      src={brand.imageUrl}
                      alt="Logo"
                      style={{ height: `${brand.height}px` }}
                      className={`${brand.autoBg ? 'mix-blend-multiply' : ''} transition-opacity duration-150 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        // Fallback to text on image error
                        setBrand(prev => prev ? {...prev, mode: 'text'} : null);
                      }}
                    />
                    {/* Text fallback - show while image loads */}
                    {!imageLoaded && (
                      <span
                        className="absolute inset-0 flex items-center tracking-tight"
                        style={{ fontWeight: brand?.weight || 700, fontSize: brand?.size ? `${brand.size}px` : undefined }}
                      >
                        {brand?.text || 'GZnutrition'}
                      </span>
                    )}
                  </div>
                ) : (
                  <span
                    className="tracking-tight"
                    style={{ fontWeight: brand?.weight || 700, fontSize: brand?.size ? `${brand.size}px` : undefined }}
                  >
                    {brand?.text || 'GZnutrition'}
                  </span>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <div 
                  className={`flex items-center gap-1 backdrop-blur-lg rounded-full p-2 border bg-white/10 border-white/20`} 
                  style={{ color: 'var(--navbar-text)' }}
                >
                  {getNavigationItems(siteContent).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full group opacity-85 hover:opacity-100 hover:bg-white/15`}
                      style={{ color: 'inherit' }}
                    >
                      <span className="relative z-10">{item.name}</span>
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    </Link>
                  ))}
                </div>
                <Link
                  href="/admin"
                  className={`ml-4 px-3 py-1 text-xs transition-colors duration-200 rounded-md opacity-80 hover:opacity-100 hover:bg-white/10`}
                  style={{ color: 'var(--navbar-text)' }}
                >
                  Admin
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className={`md:hidden relative p-2 rounded-lg backdrop-blur-lg border transition-all duration-300 bg-black/40 border-white/15 hover:bg-black/50`}
                style={{ color: 'var(--navbar-text)' }}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                <div className="relative w-5 h-5">
                  <Menu className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                  <X className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
                </div>
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 mobile-dropdown ${
              isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div 
                className={`backdrop-blur-xl rounded-2xl mt-2 mb-4 shadow-lg bg-black border border-white/15`}
                style={{ color: 'var(--navbar-text)' }}
              >
                <nav className="p-4 space-y-2">
                  {getNavigationItems(siteContent).map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl group relative overflow-hidden opacity-85 hover:opacity-100 hover:bg-white/10`}
                      style={{ color: 'inherit', animationDelay: `${index * 50}ms` }}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="relative z-10">{item.name}</span>
                      <div className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300`} />
                    </Link>
                  ))}
                  <div className={`pt-2 mt-2 border-t border-white/15`}>
                    <Link
                      href="/admin"
                      className={`block px-4 py-2 text-xs transition-colors duration-200 rounded-lg opacity-80 hover:opacity-100 hover:bg-white/10`}
                      style={{ color: 'inherit' }}
                      onClick={() => setIsOpen(false)}
                    >
                      Admin
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </header>
  );
}


