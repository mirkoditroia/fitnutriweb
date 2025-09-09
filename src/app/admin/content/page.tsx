"use client";
import { useEffect, useState } from "react";
import { getSiteContent, upsertSiteContent, type SiteContent } from "@/lib/datasource";
import { debugLog } from "@/lib/debugUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { UploadButton } from "@/components/UploadButton";
import { PALETTES, getPaletteConfig } from "@/lib/palettes";

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const fieldCls = "bg-white text-black placeholder:text-black/70 border-foreground/30";

  useEffect(() => {
          getSiteContent().then((c) => {
            debugLog("🔄 CARICAMENTO INIZIALE contenuti:", c);
            debugLog("📊 BMI config caricato:", c?.bmiCalculator);
            debugLog("⭐ Reviews config caricato:", c?.googleReviews);
            
            // ✅ FALLBACK MIGLIORATO: se contenuto esiste ma mancano le nuove feature, le aggiungiamo
            const finalContent = c ? {
              ...c,
              // Aggiungi BMI se non esiste
              bmiCalculator: c.bmiCalculator ?? {
                enabled: false,
                title: "📊 Calcola il tuo BMI",
                subtitle: "Scopri il tuo Indice di Massa Corporea"
              },
              // Aggiungi Reviews se non esiste  
              googleReviews: c.googleReviews ?? {
                enabled: true,
                title: "⭐ Recensioni Google",
                subtitle: "Cosa dicono i nostri clienti",
                businessName: "GZ Nutrition",
                reviews: []
              },
              // ✅ Aggiungi Meta Tags se non esistono
              metaTags: c.metaTags ?? {
                title: "",
                description: "",
                siteUrl: "",
                image: "",
                siteName: "GZnutrition",
                twitterCard: "summary_large_image" as "summary" | "summary_large_image",
                ogType: "website",
                locale: "it_IT"
              },
              // ✅ Aggiungi Legal Info se non esiste
              legalInfo: c.legalInfo ?? {
                companyName: "GZnutrition",
                vatNumber: "",
                taxCode: "",
                email: "",
                registeredAddress: "",
                footerText: "",
                showLegalLinks: true,
                gdprConsentText: "",
                cookieBanner: {
                  enabled: true,
                  title: "🍪 Utilizzo dei Cookie",
                  message: "Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per fornire funzionalità personalizzate. Continuando a navigare accetti l'utilizzo dei cookie.",
                  acceptText: "Accetta",
                  declineText: "Rifiuta",
                  learnMoreText: "Scopri di più"
                },
                legalPages: {
                  privacyPolicy: {
                    title: "Privacy Policy",
                    lastUpdated: new Date().toLocaleDateString('it-IT'),
                    content: ""
                  },
                  cookiePolicy: {
                    title: "Cookie Policy", 
                    lastUpdated: new Date().toLocaleDateString('it-IT'),
                    content: ""
                  },
                  termsOfService: {
                    title: "Termini di Servizio",
                    lastUpdated: new Date().toLocaleDateString('it-IT'),
                    content: ""
                  }
                }
              },
              // ✅ Aggiungi Section Visibility se non esiste
              sectionVisibility: c.sectionVisibility ?? {
                hero: true,
                about: true,
                images: true,
                packages: true,
                bookingForm: true,
                contact: true
              }
            } : { 
              heroTitle: "", 
              heroSubtitle: "", 
              heroCta: "Prenota ora", 
              heroBackgroundImage: "", 
              images: [],
              colorPalette: "gz-default" as const,
              sectionVisibility: {
                hero: true,
                about: true,
                images: true,
                packages: true,
                bookingForm: true,
                contact: true
              },
              bmiCalculator: {
                enabled: false,
                title: "📊 Calcola il tuo BMI",
                subtitle: "Scopri il tuo Indice di Massa Corporea"
              },
              googleReviews: {
                enabled: true,
                title: "⭐ Recensioni Google",
                subtitle: "Cosa dicono i nostri clienti",
                businessName: "GZ Nutrition",
                reviews: []
              },
              // ✅ Meta Tags di default
              metaTags: {
                title: "",
                description: "",
                siteUrl: "",
                image: "",
                siteName: "GZnutrition",
                twitterCard: "summary_large_image" as "summary" | "summary_large_image",
                ogType: "website",
                locale: "it_IT"
              },
              // ✅ Legal Info di default
              legalInfo: {
                companyName: "GZnutrition",
                showLegalLinks: true,
                cookieBanner: {
                  enabled: true,
                  title: "🍪 Utilizzo dei Cookie",
                  message: "Utilizziamo i cookie per migliorare la tua esperienza di navigazione e per fornire funzionalità personalizzate. Continuando a navigare accetti l'utilizzo dei cookie.",
                  acceptText: "Accetta",
                  declineText: "Rifiuta",
                  learnMoreText: "Scopri di più"
                }
              }
            };
            
            debugLog("✅ CONTENUTO FINALE nello stato:", finalContent);
            debugLog("📊 BMI finale:", finalContent.bmiCalculator);
            debugLog("⭐ Reviews finale:", finalContent.googleReviews);
            
            setContent(finalContent);
            setLoading(false);
          });
  }, []);

  if (loading || !content) return <main className="container py-8">Caricamento...</main>;

  const save = async () => {
    // ✅ DEBUG: Log completo del contenuto prima del salvataggio
    await debugLog("🔍 SALVATAGGIO CONTENUTI - Oggetto completo:", content);
    await debugLog("📊 BMI Calculator config:", content.bmiCalculator);
    await debugLog("⭐ Google Reviews config:", content.googleReviews);
    await debugLog("⚖️ LegalInfo config:", content.legalInfo);
    await debugLog("🔗 Meta tags config:", content.metaTags);
    
    try {
      await upsertSiteContent(content);
      
      // ✅ CONFERMA SALVATAGGIO con dettagli
      toast.success(`✅ Contenuti salvati con successo!${content.bmiCalculator?.enabled ? " (BMI: ✅)" : ""}${content.googleReviews?.enabled !== false ? " (Reviews: ⭐)" : ""}`, {
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
        }
      });
      
      await debugLog("✅ SALVATAGGIO COMPLETATO con successo");
      
      // ✅ NOTIFICA: Invia evento per aggiornare navbar e altri componenti
      window.dispatchEvent(new CustomEvent('contentUpdated'));
      await debugLog("📡 Evento 'contentUpdated' inviato per aggiornare navbar");
      
      // ✅ VERIFICA: Ricarica i contenuti dal database per confermare il salvataggio
      setTimeout(async () => {
        try {
          const reloadedContent = await getSiteContent();
          await debugLog("🔄 CONTENUTI RICARICATI dal database:", reloadedContent);
          await debugLog("🔍 BMI dopo ricaricamento:", reloadedContent?.bmiCalculator);
          await debugLog("🔍 Reviews dopo ricaricamento:", reloadedContent?.googleReviews);
          
          if (reloadedContent?.bmiCalculator?.enabled !== content.bmiCalculator?.enabled) {
            console.warn("⚠️ MISMATCH BMI: salvato =", content.bmiCalculator?.enabled, "ricaricato =", reloadedContent?.bmiCalculator?.enabled);
            toast.error("⚠️ Problema rilevato: configurazione BMI non sincronizzata!");
          }
        } catch (error) {
          console.error("❌ Errore durante la verifica ricaricamento:", error);
        }
      }, 2000);
      
    } catch (error) {
      console.error("❌ ERRORE durante il salvataggio:", error);
      toast.error("❌ Errore durante il salvataggio. Controlla la console per dettagli.", {
        duration: 6000
      });
      return; // Esce se c'è errore
    }
     2
     
    // ✅ FORZARE REFRESH PAGINA per caricare la palette dal server
    // Eliminiamo localStorage che causava problemi di sincronizzazione
    if (content.colorPalette) {
      // Apply complete palette immediately  
      const paletteConfig = getPaletteConfig(content.colorPalette);
      const root = document.documentElement;
      
      // Helper function for RGB conversion
      const hexToRgb = (hex: string): string => {
        const h = hex.replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
        return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      };
      
      // Apply complete palette
      root.style.setProperty('--primary', paletteConfig.primary, 'important');
      root.style.setProperty('--primary-rgb', hexToRgb(paletteConfig.primary), 'important');
      root.style.setProperty('--accent', paletteConfig.accent, 'important');
      root.style.setProperty('--accent-rgb', hexToRgb(paletteConfig.accent), 'important');
      root.style.setProperty('--background', paletteConfig.background, 'important');
      root.style.setProperty('--foreground', paletteConfig.foreground, 'important');
      root.style.setProperty('--border', paletteConfig.border, 'important');
      root.style.setProperty('--card', paletteConfig.card, 'important');
      root.style.setProperty('--muted-bg', paletteConfig.muted, 'important');
      root.style.setProperty('--navbar-bg', paletteConfig.navbarBg, 'important');
      root.style.setProperty('--navbar-text', paletteConfig.navbarText, 'important');
      root.style.setProperty('--secondary-bg', paletteConfig.secondaryBg, 'important');
      root.style.setProperty('--secondary-fg', paletteConfig.secondaryText, 'important');
    }
    
    toast.success("🎉 Contenuti salvati! Per sincronizzare su tutti i dispositivi, ricarica la pagina.", {
      duration: 6000
    });
  };

  const addImg = () => setContent({ ...content, images: [...(content.images ?? []), { key: "", url: "" }] });
  const removeImg = (i: number) => setContent({ ...content, images: (content.images ?? []).filter((_, idx) => idx !== i) });
  const updateImg = (i: number, key: "key" | "url", value: string) => {
    const next = [...(content.images ?? [])];
    const cur = next[i] ?? { key: "", url: "" };
    next[i] = { ...cur, [key]: value } as { key: string; url: string };
    setContent({ ...content, images: next });
  };
  const addImgFromUpload = (url: string) => {
    setContent({ ...content, images: [...(content.images ?? []), { key: "", url }] });
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground pt-4 tracking-tight">Contenuti Landing Page</h1>
      <p className="text-sm text-foreground/70 mt-2">Gestisci tutti i contenuti e la personalizzazione della landing page</p>
      
      <div className="admin-surface mt-6 rounded-xl p-8 space-y-12 border border-foreground/10 bg-background/70 backdrop-blur-sm shadow-md">
        {/* ========== STILE E ASPETTO ========== */}
        <div className="border-b border-foreground/10 pb-8">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            🎨 Stile e Aspetto
          </h3>
          
          {/* Palette Colori */}
          <section className="space-y-4">
            <h2 className="font-semibold text-black">Palette Colori</h2>
          <p className="text-sm text-black/70">Scegli una palette predefinita moderna e professionale per tutto il sito</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PALETTES).map(([paletteId, palette]) => (
              <div 
                key={paletteId}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  content.colorPalette === paletteId 
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => {
                  setContent({...content, colorPalette: paletteId as typeof content.colorPalette});
                  
                  // Apply immediately for preview
                  const paletteConfig = getPaletteConfig(paletteId);
                  const root = document.documentElement;
                  
                  // Helper function for RGB conversion
                  const hexToRgb = (hex: string): string => {
                    const h = hex.replace('#', '');
                    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
                    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
                  };
                  
                  // Apply palette immediately
                  root.style.setProperty('--primary', paletteConfig.primary, 'important');
                  root.style.setProperty('--primary-rgb', hexToRgb(paletteConfig.primary), 'important');
                  root.style.setProperty('--accent', paletteConfig.accent, 'important');
                  root.style.setProperty('--accent-rgb', hexToRgb(paletteConfig.accent), 'important');
                  root.style.setProperty('--background', paletteConfig.background, 'important');
                  root.style.setProperty('--foreground', paletteConfig.foreground, 'important');
                  root.style.setProperty('--border', paletteConfig.border, 'important');
                  root.style.setProperty('--card', paletteConfig.card, 'important');
                  root.style.setProperty('--muted-bg', paletteConfig.muted, 'important');
                  root.style.setProperty('--navbar-bg', paletteConfig.navbarBg, 'important');
                  root.style.setProperty('--navbar-text', paletteConfig.navbarText, 'important');
                  root.style.setProperty('--secondary-bg', paletteConfig.secondaryBg, 'important');
                  root.style.setProperty('--secondary-fg', paletteConfig.secondaryText, 'important');
                  
                  // ✅ RIMOSSO localStorage - solo anteprima temporanea in admin
                  // Toast per anteprima palette con colore dinamico
                  toast(`🎨 Anteprima palette "${palette.name}" applicata! Clicca "Salva contenuti" per rendere permanente su tutti i dispositivi.`, {
                    icon: '🎨',
                    style: {
                      background: paletteConfig.primary,
                      color: 'white',
                      border: `2px solid ${paletteConfig.accent}`,
                    },
                  });
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-black">{palette.name}</h3>
                    {content.colorPalette === paletteId && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-black/60">{palette.description}</p>
                  
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: palette.primary }}
                      title="Primario"
                    ></div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: palette.accent }}
                      title="Accent"
                    ></div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: palette.navbarBg }}
                      title="Navbar"
                    ></div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: palette.secondaryBg }}
                      title="Secondario"
                    ></div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div 
                      className="px-2 py-1 rounded text-white text-center font-medium"
                      style={{ backgroundColor: palette.primary }}
                    >
                      Bottone Primario
                    </div>
                    <div 
                      className="px-2 py-1 rounded text-center border"
                      style={{ 
                        backgroundColor: palette.secondaryBg,
                        color: palette.secondaryText,
                        borderColor: palette.border
                      }}
                    >
                      Bottone Secondario
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-black mb-2">Cosa viene personalizzato:</div>
            <div className="text-xs text-black/70 space-y-1">
              <div>• <strong>Bottoni principali</strong>: "Prenota ora", "Salva", bottoni CTA</div>
              <div>• <strong>Bottoni secondari</strong>: "Dettagli", "Scopri", bottoni outline</div>
              <div>• <strong>Navbar</strong>: Sfondo e colore testo della navigazione</div>
              <div>• <strong>Card e contenuti</strong>: Sfondi delle sezioni e testi</div>
              <div>• <strong>Colori accent</strong>: Link, hover e elementi decorativi</div>
            </div>
          </div>
          
          <div>
            <Button onClick={save}>Salva Palette</Button>
          </div>
        </section>

        {/* Logo Navbar */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">Logo Navbar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Modalità logo</label>
              <select
                className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                value={content.navbarLogoMode ?? "text"}
                onChange={(e) => setContent({ ...content, navbarLogoMode: (e.target.value as 'image' | 'text') })}
              >
                <option value="image">Immagine (upload)</option>
                <option value="text">Testo</option>
              </select>
            </div>
            <div className="sm:text-right flex items-end justify-start sm:justify-end">
              <Button onClick={save}>Salva logo</Button>
            </div>
          </div>

          {/* Logo immagine */}
          { (content.navbarLogoMode ?? "text") === "image" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Logo image URL</label>
                <div className="flex gap-2">
                  <input
                    className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                    value={content.navbarLogoImageUrl ?? ""}
                    onChange={(e) => setContent({ ...content, navbarLogoImageUrl: e.target.value })}
                  />
                  <UploadButton folder="brand" onUploaded={(url) => setContent({ ...content, navbarLogoImageUrl: url })} />
                </div>
                <p className="text-xs text-foreground/60 mt-1">PNG con trasparenza consigliato. Se lo sfondo è bianco prova l&apos;opzione “Rimuovi BG”.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Altezza (px)</label>
                <input
                  type="number"
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                  value={content.navbarLogoHeight ?? 40}
                  onChange={(e) => setContent({ ...content, navbarLogoHeight: Number(e.target.value || 0) })}
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="autoRemoveBg"
                    type="checkbox"
                    checked={content.navbarLogoAutoRemoveBg ?? false}
                    onChange={(e) => setContent({ ...content, navbarLogoAutoRemoveBg: e.target.checked })}
                  />
                  <label htmlFor="autoRemoveBg" className="text-sm">Rimuovi BG bianco (blend)</label>
                </div>
              </div>
            </div>
          )}

          {/* Logo testo */}
          { (content.navbarLogoMode ?? "text") === "text" && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Input label="Testo logo" value={content.navbarLogoText ?? "GZnutrition"} onChange={(e) => setContent({ ...content, navbarLogoText: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Colore (hex)</label>
                <input className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`} value={content.navbarLogoTextColor ?? "#0B5E0B"} onChange={(e) => setContent({ ...content, navbarLogoTextColor: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Peso (400–800)</label>
                <input type="number" className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`} value={content.navbarLogoTextWeight ?? 700} onChange={(e) => setContent({ ...content, navbarLogoTextWeight: Number(e.target.value || 700) })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dimensione (px)</label>
                <input type="number" className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`} value={content.navbarLogoTextSize ?? 18} onChange={(e) => setContent({ ...content, navbarLogoTextSize: Number(e.target.value || 18) })} />
              </div>
            </div>
          )}
        </section>
        </div>

        {/* ========== VISIBILITÀ SEZIONI ========== */}
        <div className="border-b border-foreground/10 pb-8">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            👁️ Visibilità Sezioni
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm text-black/70">
              Controlla quali sezioni del sito sono visibili. Se una sezione è nascosta, 
              anche il collegamento dalla navbar scompare automaticamente.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hero Section */}
              <div className="flex items-center justify-between p-4 border border-foreground/20 rounded-lg bg-white">
                <div>
                  <h4 className="font-medium text-black">🏠 Sezione Hero</h4>
                  <p className="text-sm text-black/60">Sezione principale con titolo e CTA</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.sectionVisibility?.hero !== false}
                    onChange={(e) => setContent({
                      ...content,
                      sectionVisibility: {
                        ...content.sectionVisibility,
                        hero: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Visibile</span>
                </label>
              </div>

              {/* About Section */}
              <div className="flex items-center justify-between p-4 border border-foreground/20 rounded-lg bg-white">
                <div>
                  <h4 className="font-medium text-black">👤 Sezione "Chi sono"</h4>
                  <p className="text-sm text-black/60">Presentazione del nutrizionista</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.sectionVisibility?.about !== false}
                    onChange={(e) => setContent({
                      ...content,
                      sectionVisibility: {
                        ...content.sectionVisibility,
                        about: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Visibile</span>
                </label>
              </div>

              {/* Images Section */}
              <div className="flex items-center justify-between p-4 border border-foreground/20 rounded-lg bg-white">
                <div>
                  <h4 className="font-medium text-black">🖼️ Sezione Immagini</h4>
                  <p className="text-sm text-black/60">Galleria immagini personalizzate</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.sectionVisibility?.images !== false}
                    onChange={(e) => setContent({
                      ...content,
                      sectionVisibility: {
                        ...content.sectionVisibility,
                        images: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Visibile</span>
                </label>
              </div>

              {/* Packages Section */}
              <div className="flex items-center justify-between p-4 border border-foreground/20 rounded-lg bg-white">
                <div>
                  <h4 className="font-medium text-black">📦 Sezione Pacchetti</h4>
                  <p className="text-sm text-black/60">Carosello dei pacchetti disponibili</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.sectionVisibility?.packages !== false}
                    onChange={(e) => setContent({
                      ...content,
                      sectionVisibility: {
                        ...content.sectionVisibility,
                        packages: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Visibile</span>
                </label>
              </div>

              {/* Booking Form Section */}
              <div className="flex items-center justify-between p-4 border border-foreground/20 rounded-lg bg-white">
                <div>
                  <h4 className="font-medium text-black">📅 Form di Prenotazione</h4>
                  <p className="text-sm text-black/60">Form per prenotare appuntamenti</p>
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Se nascosto, i CTA "Prenota ora" reindirizzano ai contatti
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.sectionVisibility?.bookingForm !== false}
                    onChange={(e) => setContent({
                      ...content,
                      sectionVisibility: {
                        ...content.sectionVisibility,
                        bookingForm: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Visibile</span>
                </label>
              </div>

              {/* Contact Section */}
              <div className="flex items-center justify-between p-4 border border-foreground/20 rounded-lg bg-white">
                <div>
                  <h4 className="font-medium text-black">📞 Sezione Contatti</h4>
                  <p className="text-sm text-black/60">Informazioni di contatto e studi</p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.sectionVisibility?.contact !== false}
                    onChange={(e) => setContent({
                      ...content,
                      sectionVisibility: {
                        ...content.sectionVisibility,
                        contact: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Visibile</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-black mb-2">💡 Come funziona:</div>
              <div className="text-xs text-black/70 space-y-1">
                <div>• <strong>Sezioni nascoste</strong>: Non vengono mostrate nella landing page</div>
                <div>• <strong>Navbar automatica</strong>: I link delle sezioni nascoste scompaiono dalla navigazione</div>
                <div>• <strong>CTA intelligenti</strong>: Se il form è nascosto, i pulsanti "Prenota ora" reindirizzano ai contatti</div>
                <div>• <strong>Salvataggio</strong>: Le modifiche si applicano immediatamente dopo il salvataggio</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== CONTENUTI PRINCIPALI ========== */}
        <div className="border-b border-foreground/10 pb-8">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            📝 Contenuti Principali
          </h3>
          
          {/* Hero Section */}
          <section className="space-y-4">
            <h2 className="font-semibold text-black">Hero</h2>
          <Input label="Nome del sito" value={content.siteName || "GZnutrition"} onChange={(e) => setContent({ ...content, siteName: e.target.value })} placeholder="GZnutrition" />
          
          {/* Favicon Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">Favicon</label>
            <div className="flex items-center gap-3">
              {content.favicon && (
                <div className="flex items-center gap-2">
                  <img 
                    src={content.favicon} 
                    alt="Favicon" 
                    className="w-8 h-8"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-sm text-gray-600">Favicon attuale</span>
                </div>
              )}
              <UploadButton
                folder="favicon"
                accept=".ico,.png,.jpg,.jpeg,.svg"
                maxSize={1}
                onUploaded={async (url) => {
                  const updatedContent = { ...content, favicon: url };
                  setContent(updatedContent);
                  
                  await debugLog("🔍 [ADMIN] Favicon URL ricevuto:", url);
                  await debugLog("🔍 [ADMIN] Content aggiornato con favicon:", updatedContent.favicon);
                  
                  // Auto-salva dopo l'upload del favicon
                  try {
                    await upsertSiteContent(updatedContent);
                    toast.success("🎉 Favicon caricato e salvato con successo! Aggiornamento automatico in corso...");
                    
                    // Emetti evento custom per aggiornamento immediato del favicon
                    const faviconUpdateEvent = new CustomEvent('faviconUpdated', {
                      detail: { favicon: url }
                    });
                    window.dispatchEvent(faviconUpdateEvent);
                    
                    await debugLog("🎯 Evento faviconUpdated emesso per:", url);
                  } catch (error) {
                    console.error("Errore nel salvare il favicon:", error);
                    toast.error("❌ Favicon caricato ma errore nel salvataggio. Clicca 'Salva Contenuti' manualmente.");
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Carica un'immagine per il favicon del sito. Formato consigliato: 32x32px o 16x16px. Supportati: .ico, .png, .jpg, .svg
              <br />
              <span className="text-green-600 font-medium">✅ Il favicon verrà salvato e applicato automaticamente dopo l'upload.</span>
            </p>
          </div>
          
          <Input label="Hero title" value={content.heroTitle} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} />
          <Input label="Hero subtitle" value={content.heroSubtitle} onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })} />
          <Input label="Hero CTA" value={content.heroCta} onChange={(e) => setContent({ ...content, heroCta: e.target.value })} />
          
          {/* Controlli per il badge personalizzabile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              label="Testo badge hero" 
              value={content.heroBadgeText ?? "Performance • Estetica • Energia"} 
              onChange={(e) => setContent({ ...content, heroBadgeText: e.target.value })} 
              placeholder="Performance • Estetica • Energia"
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/90">Colore badge hero</label>
              <select 
                className={`w-full rounded-md border px-3 py-2 text-sm ${fieldCls}`}
                value={content.heroBadgeColor ?? "bg-primary text-primary-foreground"}
                onChange={(e) => setContent({ ...content, heroBadgeColor: e.target.value })}
              >
                <option value="bg-primary text-primary-foreground">Primario (verde)</option>
                <option value="bg-blue-500 text-white">Blu</option>
                <option value="bg-red-500 text-white">Rosso</option>
                <option value="bg-yellow-500 text-black">Giallo</option>
                <option value="bg-purple-500 text-white">Viola</option>
                <option value="bg-gray-800 text-white">Grigio scuro</option>
                <option value="bg-white text-gray-900 border border-gray-300">Bianco con bordo</option>
                <option value="bg-gradient-to-r from-blue-500 to-purple-600 text-white">Gradiente blu-viola</option>
                <option value="bg-gradient-to-r from-green-400 to-blue-500 text-white">Gradiente verde-blu</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground/90">Hero background image URL</label>
            <div className="flex gap-2">
              <input className={`w-full rounded-md border px-3 py-2 text-sm ${fieldCls}`} value={content.heroBackgroundImage ?? ""} onChange={(e) => setContent({ ...content, heroBackgroundImage: e.target.value })} />
              <UploadButton folder="content" onUploaded={(url) => setContent({ ...content, heroBackgroundImage: url })} />
            </div>
          </div>
        </section>

        {/* Presentazione nutrizionista */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">Presentazione nutrizionista</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input className={`rounded-md px-3 py-2 ${fieldCls}`} label="About title" value={content.aboutTitle ?? ""} onChange={(e) => setContent({ ...content, aboutTitle: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground/90">About image URL</label>
              <div className="flex gap-2">
                <input className={`w-full rounded-md border px-3 py-2 text-sm ${fieldCls}`} value={content.aboutImageUrl ?? ""} onChange={(e) => setContent({ ...content, aboutImageUrl: e.target.value })} />
                <UploadButton folder="content" onUploaded={(url) => setContent({ ...content, aboutImageUrl: url })} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground/90">About body</label>
            <textarea className={`w-full rounded-md border px-3 py-2 text-sm ${fieldCls}`} rows={5} value={content.aboutBody ?? ""} onChange={(e) => setContent({ ...content, aboutBody: e.target.value })} />
          </div>
        </section>
        </div>

        {/* ========== SEZIONI AGGIUNTIVE ========== */}
        <div className="border-b border-foreground/10 pb-8">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            🖼️ Sezioni Aggiuntive
          </h3>
          
          {/* Immagini sezione */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-black">Immagini sezione</h2>
            <div className="flex gap-2">
              <UploadButton folder="content" onUploaded={addImgFromUpload} />
              <Button type="button" onClick={addImg}>Aggiungi immagine</Button>
            </div>
          </div>
          <div className="space-y-3">
            {(content.images ?? []).map((im, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <Input label="Key" value={im.key} onChange={(e) => updateImg(i, "key", e.target.value)} />
                <div>
                  <label className="block text-sm font-medium mb-1">URL immagine</label>
                  <input className="w-full rounded-md border border-foreground/20 bg-white px-3 py-2 text-sm text-black placeholder:text-black/70" value={im.url} onChange={(e) => updateImg(i, "url", e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <UploadButton folder="content" onUploaded={(url) => updateImg(i, "url", url)} />
                  <button className="btn-outline" onClick={() => removeImg(i)}>Rimuovi</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sezione Contatti */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">Contatti</h2>
          
          {/* Titoli personalizzabili delle sezioni */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              label="Titolo sezione contatti" 
              value={content.contactSectionTitle ?? "💬 Contatti Diretti"} 
              onChange={(e) => setContent({ ...content, contactSectionTitle: e.target.value })} 
              placeholder="💬 Contatti Diretti"
            />
            <Input 
              label="Titolo sezione studi" 
              value={content.studiosSectionTitle ?? "🏢 I Nostri Studi"} 
              onChange={(e) => setContent({ ...content, studiosSectionTitle: e.target.value })} 
              placeholder="🏢 I Nostri Studi"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              label="Sottotitolo sezione contatti" 
              value={content.contactSectionSubtitle ?? ""} 
              onChange={(e) => setContent({ ...content, contactSectionSubtitle: e.target.value })} 
              placeholder="Come contattarci"
            />
            <Input 
              label="Sottotitolo sezione studi" 
              value={content.studiosSectionSubtitle ?? ""} 
              onChange={(e) => setContent({ ...content, studiosSectionSubtitle: e.target.value })} 
              placeholder="Dove trovarci"
            />
          </div>
          
          <Input label="Titolo sezione contatti" value={content.contactTitle ?? ""} onChange={(e) => setContent({ ...content, contactTitle: e.target.value })} />
          <Input label="Sottotitolo sezione contatti" value={content.contactSubtitle ?? ""} onChange={(e) => setContent({ ...content, contactSubtitle: e.target.value })} />
          <Input label="Telefono" value={content.contactPhone ?? ""} onChange={(e) => setContent({ ...content, contactPhone: e.target.value })} />
          <Input label="Email" value={content.contactEmail ?? ""} onChange={(e) => setContent({ ...content, contactEmail: e.target.value })} />
          
          {/* Canali Social */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">📱 Canali Social</h3>
              <Button type="button" onClick={() => setContent({ ...content, socialChannels: [...(content.socialChannels ?? []), { platform: "", url: "", icon: "", logoUrl: "" }] })}>+ Aggiungi Social</Button>
            </div>
            {(content.socialChannels ?? []).map((social, i) => (
              <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Input 
                    label="Piattaforma" 
                    value={social.platform} 
                    onChange={(e) => {
                      const newSocials = [...(content.socialChannels ?? [])];
                      newSocials[i].platform = e.target.value;
                      setContent({ ...content, socialChannels: newSocials });
                    }} 
                    placeholder="Instagram, LinkedIn, Facebook..."
                  />
                  <Input 
                    label="URL" 
                    value={social.url} 
                    onChange={(e) => {
                      const newSocials = [...(content.socialChannels ?? [])];
                      newSocials[i].url = e.target.value;
                      setContent({ ...content, socialChannels: newSocials });
                    }} 
                    placeholder="https://instagram.com/username"
                  />
                  <Input 
                    label="Icona (emoji)" 
                    value={social.icon} 
                    onChange={(e) => {
                      const newSocials = [...(content.socialChannels ?? [])];
                      newSocials[i].icon = e.target.value;
                      setContent({ ...content, socialChannels: newSocials });
                    }} 
                    placeholder="📱, 💼, 🎯..."
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Logo (upload)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const src = String(reader.result || "");
                          const img = new Image();
                          img.crossOrigin = "anonymous";
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width || 64;
                            canvas.height = img.height || 64;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              // Fondo bianco per rimuovere la trasparenza
                              ctx.fillStyle = '#ffffff';
                              ctx.fillRect(0, 0, canvas.width, canvas.height);
                              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                              const dataUrl = canvas.toDataURL('image/png');
                              const newSocials = [...(content.socialChannels ?? [])];
                              newSocials[i].logoUrl = dataUrl;
                              setContent({ ...content, socialChannels: newSocials });
                            }
                          };
                          img.src = src;
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-sm"
                    />
                    {social.logoUrl && (
                      <img src={social.logoUrl} alt="logo preview" className="mt-2 h-10 object-contain bg-white rounded" />
                    )}
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    const newSocials = [...(content.socialChannels ?? [])];
                    newSocials.splice(i, 1);
                    setContent({ ...content, socialChannels: newSocials });
                  }}
                >
                  Rimuovi
                </Button>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">🏢 Indirizzi Studi</h3>
              <Button type="button" onClick={() => setContent({ ...content, contactAddresses: [...(content.contactAddresses ?? []), { name: "", address: "", city: "", postalCode: "" }] })}>+ Aggiungi Studio</Button>
            </div>
            
            {(content.contactAddresses ?? []).map((address, i) => (
              <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Studio {i + 1}</h4>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setContent({ 
                      ...content, 
                      contactAddresses: content.contactAddresses?.filter((_, idx) => idx !== i) ?? [] 
                    })}
                  >
                    🗑️ Rimuovi
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input 
                    label="Nome Studio" 
                    value={address.name} 
                    onChange={(e) => {
                      const newAddresses = [...(content.contactAddresses ?? [])];
                      newAddresses[i] = { ...newAddresses[i], name: e.target.value };
                      setContent({ ...content, contactAddresses: newAddresses });
                    }} 
                    placeholder="Studio Principale"
                  />
                  <Input 
                    label="Indirizzo" 
                    value={address.address} 
                    onChange={(e) => {
                      const newAddresses = [...(content.contactAddresses ?? [])];
                      newAddresses[i] = { ...newAddresses[i], address: e.target.value };
                      setContent({ ...content, contactAddresses: newAddresses });
                    }} 
                    placeholder="Via Roma 123"
                  />
                  <Input 
                    label="Città" 
                    value={address.city} 
                    onChange={(e) => {
                      const newAddresses = [...(content.contactAddresses ?? [])];
                      newAddresses[i] = { ...newAddresses[i], city: e.target.value };
                      setContent({ ...content, contactAddresses: newAddresses });
                    }} 
                    placeholder="Milano"
                  />
                  <Input 
                    label="CAP" 
                    value={address.postalCode} 
                    onChange={(e) => {
                      const newAddresses = [...(content.contactAddresses ?? [])];
                      newAddresses[i] = { ...newAddresses[i], postalCode: e.target.value };
                      setContent({ ...content, contactAddresses: newAddresses });
                    }} 
                    placeholder="20100"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input 
                    label="Latitudine (opzionale)" 
                    type="number"
                    step="any"
                    value={address.coordinates?.lat ?? ""} 
                    onChange={(e) => {
                      const newAddresses = [...(content.contactAddresses ?? [])];
                      const coords = newAddresses[i].coordinates ?? { lat: 0, lng: 0 };
                      newAddresses[i] = { 
                        ...newAddresses[i], 
                        coordinates: { 
                          ...coords, 
                          lat: e.target.value ? parseFloat(e.target.value) : 0 
                        } 
                      };
                      setContent({ ...content, contactAddresses: newAddresses });
                    }} 
                    placeholder="45.4642"
                  />
                  <Input 
                    label="Longitudine (opzionale)" 
                    type="number"
                    step="any"
                    value={address.coordinates?.lng ?? ""} 
                    onChange={(e) => {
                      const newAddresses = [...(content.contactAddresses ?? [])];
                      const coords = newAddresses[i].coordinates ?? { lat: 0, lng: 0 };
                      newAddresses[i] = { 
                        ...newAddresses[i], 
                        coordinates: { 
                          ...coords, 
                          lng: e.target.value ? parseFloat(e.target.value) : 0 
                        } 
                      };
                      setContent({ ...content, contactAddresses: newAddresses });
                    }} 
                    placeholder="9.1900"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Sezione Risultati Clienti */}
        <section className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-black">📸 Risultati Clienti</h2>
              <p className="text-sm text-black/70">Carosello di foto dei risultati ottenuti dai clienti</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={content.resultsSection?.isEnabled ?? false}
                  onChange={(e) => setContent({
                    ...content,
                    resultsSection: {
                      ...content.resultsSection,
                      isEnabled: e.target.checked,
                      title: content.resultsSection?.title ?? "🎯 Risultati dei Nostri Clienti",
                      subtitle: content.resultsSection?.subtitle ?? "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
                      photos: content.resultsSection?.photos ?? []
                    }
                  })}
                  className="rounded"
                />
                <span className="text-black">Abilita sezione</span>
              </label>
            </div>
          </div>

          {content.resultsSection?.isEnabled && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              {/* Titoli sezione */}
              <div className="grid grid-cols-1 gap-3">
                <Input
                  label="Titolo sezione"
                  value={content.resultsSection?.title ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    resultsSection: {
                      ...content.resultsSection,
                      title: e.target.value
                    }
                  })}
                  placeholder="🎯 Risultati dei Nostri Clienti"
                  className={fieldCls}
                />
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Sottotitolo sezione</label>
                  <textarea
                    value={content.resultsSection?.subtitle ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      resultsSection: {
                        ...content.resultsSection,
                        subtitle: e.target.value
                      }
                    })}
                    placeholder="Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme."
                    className={`w-full rounded-md border px-3 py-2 text-sm ${fieldCls}`}
                    rows={2}
                  />
                </div>
              </div>

              {/* Gestione foto */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-black">Foto risultati</h3>
                  <div className="space-y-3">
                    <UploadButton
                      folder="results"
                      accept=".jpg,.jpeg,.png,.webp"
                      maxSize={5}
                      onUploaded={(url) => {
                        const newPhoto = {
                          id: Date.now().toString(),
                          url,
                          description: ""
                        };
                        setContent({
                          ...content,
                          resultsSection: {
                            ...content.resultsSection,
                            photos: [...(content.resultsSection?.photos ?? []), newPhoto]
                          }
                        });
                      }}
                    />
                    
                    <div className="text-sm text-gray-600 border-t pt-3">
                      <p className="font-medium mb-2">💡 Alternativa: Usa URL immagine esterna</p>
                      <input
                        type="url"
                        placeholder="https://esempio.com/immagine.jpg"
                        className={`${fieldCls} w-full`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const url = (e.target as HTMLInputElement).value.trim();
                            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                              const newPhoto = {
                                id: Date.now().toString(),
                                url,
                                description: ""
                              };
                              setContent({
                                ...content,
                                resultsSection: {
                                  ...content.resultsSection,
                                  photos: [...(content.resultsSection?.photos ?? []), newPhoto]
                                }
                              });
                              (e.target as HTMLInputElement).value = '';
                            } else {
                              alert('Inserisci un URL valido che inizia con http:// o https://');
                            }
                          }
                        }}
                      />
                      <p className="text-xs mt-1 text-gray-500">
                        Incolla l'URL di un'immagine online e premi Enter. 
                        <br />Utile se l'upload non funziona o per immagini da Google Drive, Imgur, etc.
                      </p>
                    </div>
                  </div>
                </div>

                {content.resultsSection?.photos && content.resultsSection.photos.length > 0 && (
                  <div className="space-y-3">
                    {content.resultsSection.photos.map((photo, index) => (
                      <div key={photo.id} className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        {/* Anteprima foto */}
                        <div className="flex-shrink-0">
                          <img 
                            src={photo.url} 
                            alt={`Risultato ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        </div>
                        
                        {/* Campi modifica */}
                        <div className="flex-1 space-y-2">
                          <Input
                            label="Descrizione"
                            value={photo.description ?? ""}
                            onChange={(e) => {
                              const updatedPhotos = [...(content.resultsSection?.photos ?? [])];
                              updatedPhotos[index] = { ...photo, description: e.target.value };
                              setContent({
                                ...content,
                                resultsSection: {
                                  ...content.resultsSection,
                                  photos: updatedPhotos
                                }
                              });
                            }}
                            placeholder="Descrizione del risultato..."
                            className={fieldCls}
                          />
                          
                        </div>
                        
                        {/* Pulsante elimina */}
                        <div className="flex-shrink-0 flex flex-col justify-between">
                          <button
                            onClick={() => {
                              const updatedPhotos = content.resultsSection?.photos?.filter((_, i) => i !== index) ?? [];
                              setContent({
                                ...content,
                                resultsSection: {
                                  ...content.resultsSection,
                                  photos: updatedPhotos
                                }
                              });
                            }}
                            className="text-red-600 hover:text-red-800 p-2"
                            title="Rimuovi foto"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!content.resultsSection?.photos || content.resultsSection.photos.length === 0) && (
                  <div className="text-center py-8 text-black/60">
                    <p>Nessuna foto caricata. Usa il pulsante "Carica File" per aggiungere foto dei risultati.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
        </div>

        {/* ========== POPUP E INTEGRAZIONI ========== */}
        <div>
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            🔔 Popup e Integrazioni
          </h3>
          
          {/* Popup 10 Minuti Consultivi Gratuiti */}
          <section className="space-y-4">
          <h2 className="font-semibold text-black">🔔 Popup Consultazione Gratuita</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="popupEnabled"
                checked={content.freeConsultationPopup?.isEnabled ?? false}
                onChange={(e) => setContent({
                  ...content,
                  freeConsultationPopup: {
                    ...content.freeConsultationPopup,
                    isEnabled: e.target.checked
                  }
                })}
                className="text-primary"
              />
              <label htmlFor="popupEnabled" className="font-medium">
                Abilita popup consultazione gratuita
              </label>
            </div>

            {content.freeConsultationPopup?.isEnabled && (
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <Input
                  label="Titolo del popup"
                  value={content.freeConsultationPopup?.title ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    freeConsultationPopup: {
                      ...content.freeConsultationPopup,
                      title: e.target.value
                    }
                  })}
                  placeholder="🎯 10 Minuti Consultivi Gratuiti"
                />
                
                <Input
                  label="Sottotitolo"
                  value={content.freeConsultationPopup?.subtitle ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    freeConsultationPopup: {
                      ...content.freeConsultationPopup,
                      subtitle: e.target.value
                    }
                  })}
                  placeholder="Valuta i tuoi obiettivi gratuitamente"
                />
                
                <div>
                  <label className="block text-sm font-medium mb-2">Descrizione</label>
                  <textarea
                    value={content.freeConsultationPopup?.description ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      freeConsultationPopup: {
                        ...content.freeConsultationPopup,
                        description: e.target.value
                      }
                    })}
                    placeholder="Prenota il tuo primo incontro conoscitivo gratuito per valutare i tuoi obiettivi di benessere e performance. Ti aiuteremo a definire un piano personalizzato."
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground min-h-[100px] resize-y"
                  />
                </div>
                
                <Input
                  label="Testo pulsante CTA"
                  value={content.freeConsultationPopup?.ctaText ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    freeConsultationPopup: {
                      ...content.freeConsultationPopup,
                      ctaText: e.target.value
                    }
                  })}
                  placeholder="Prenota Ora - È Gratis!"
                />
                
                <Input
                  label="URL Pacchetto Promozionale"
                  value={content.freeConsultationPopup?.packageUrl ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    freeConsultationPopup: {
                      ...content.freeConsultationPopup,
                      packageUrl: e.target.value
                    }
                  })}
                  placeholder="free-consultation"
                />
                <p className="text-xs text-black/60">
                  ID del pacchetto da selezionare quando si clicca il popup (es: "free-consultation", "basic-package")
                </p>
              </div>
            )}
          </div>
        </section>
        
        {/* ✅ NUOVA SEZIONE: Calcolatore BMI */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">📊 Calcolatore BMI</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="bmiEnabled"
                checked={content.bmiCalculator?.enabled ?? false}
                onChange={(e) => setContent({
                  ...content,
                  bmiCalculator: {
                    ...content.bmiCalculator,
                    enabled: e.target.checked
                  }
                })}
                className="text-primary"
              />
              <label htmlFor="bmiEnabled" className="font-medium">
                Abilita calcolatore BMI nella landing page
              </label>
            </div>
            
            <div className="text-sm text-black/70 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <strong>ℹ️ Calcolatore BMI:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Permette ai visitatori di calcolare il proprio Indice di Massa Corporea</li>
                <li>Design moderno e responsivo, integrato con la palette del sito</li>
                <li>Include visualizzazione grafica e classificazione WHO</li>
                <li>Posizionato sotto il form di prenotazione</li>
                <li>Disabilitato di default per non appesantire la pagina</li>
              </ul>
            </div>

            {content.bmiCalculator?.enabled && (
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Titolo sezione
                  </label>
                  <input
                    type="text"
                    value={content.bmiCalculator?.title ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      bmiCalculator: {
                        ...content.bmiCalculator,
                        title: e.target.value
                      }
                    })}
                    placeholder="📊 Calcola il tuo BMI"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Sottotitolo (opzionale)
                  </label>
                  <input
                    type="text"
                    value={content.bmiCalculator?.subtitle ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      bmiCalculator: {
                        ...content.bmiCalculator,
                        subtitle: e.target.value
                      }
                    })}
                    placeholder="Scopri il tuo Indice di Massa Corporea"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ✅ NUOVA SEZIONE: Google Reviews (sostituisce Trustpilot) */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">⭐ Recensioni Google</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="googleReviewsEnabled"
                checked={content.googleReviews?.enabled ?? true}
                onChange={(e) => setContent({
                  ...content,
                  googleReviews: {
                    ...content.googleReviews,
                    enabled: e.target.checked
                  }
                })}
                className="text-primary"
              />
              <label htmlFor="googleReviewsEnabled" className="font-medium">
                Mostra sezione recensioni Google nella landing page
              </label>
            </div>
            
            <div className="text-sm text-black/70 p-3 bg-green-50 rounded-lg border border-green-200">
              <strong>⭐ Google Reviews:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Sostituisce le recensioni Trustpilot con Google Reviews</li>
                <li>Design moderno con stelle, badge Google e link diretto</li>
                <li>Configurazione semplice: aggiungi recensioni manualmente</li>
                <li>Include CTA per "Scrivi una recensione" che apre Google</li>
                <li>Abilitato di default per massima credibilità</li>
              </ul>
            </div>

            {content.googleReviews?.enabled !== false && (
              <div className="space-y-6 p-4 border border-border rounded-lg">
                {/* Configurazione base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Titolo sezione
                    </label>
                    <input
                      type="text"
                      value={content.googleReviews?.title ?? ""}
                      onChange={(e) => setContent({
                        ...content,
                        googleReviews: {
                          ...content.googleReviews,
                          title: e.target.value
                        }
                      })}
                      placeholder="⭐ Recensioni Google"
                      className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Sottotitolo
                    </label>
                    <input
                      type="text"
                      value={content.googleReviews?.subtitle ?? ""}
                      onChange={(e) => setContent({
                        ...content,
                        googleReviews: {
                          ...content.googleReviews,
                          subtitle: e.target.value
                        }
                      })}
                      placeholder="Cosa dicono i nostri clienti"
                      className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Nome Business Google
                    </label>
                    <input
                      type="text"
                      value={content.googleReviews?.businessName ?? ""}
                      onChange={(e) => setContent({
                        ...content,
                        googleReviews: {
                          ...content.googleReviews,
                          businessName: e.target.value
                        }
                      })}
                      placeholder="GZ Nutrition"
                      className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                    />
                  </div>
                  
                  {/* ✅ OPZIONE SEMPLICE: Place ID per link diretto */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-black mb-3">🔗 Link Google Reviews</h4>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-black">
                        Google Place ID (per link "Vedi tutte le recensioni")
                      </label>
                      <input
                        type="text"
                        value={content.googleReviews?.placeId ?? ""}
                        onChange={(e) => setContent({
                          ...content,
                          googleReviews: {
                            ...content.googleReviews,
                            placeId: e.target.value
                          }
                        })}
                        placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                        className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Come trovarlo:</strong> Google Maps → Cerca la tua attività → Condividi → Copia link → Cerca "place_id="
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gestione recensioni manuali */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-black">
                      📝 Recensioni Manuali (gestite da admin)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newReview = {
                          id: Date.now().toString(),
                          name: "",
                          rating: 5,
                          text: "",
                          date: "",
                          source: "fallback" as const
                        };
                        setContent({
                          ...content,
                          googleReviews: {
                            ...content.googleReviews,
                            fallbackReviews: [...(content.googleReviews?.fallbackReviews || []), newReview]
                          }
                        });
                      }}
                      className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90"
                    >
                      + Aggiungi Recensione
                    </button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(content.googleReviews?.fallbackReviews || []).map((review, index) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <input
                            type="text"
                            value={review.name}
                            onChange={(e) => {
                              const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                              updatedReviews[index] = { ...review, name: e.target.value };
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            placeholder="Nome recensore"
                            className={`px-3 py-2 border border-border rounded-md ${fieldCls}`}
                          />
                          
                          <select
                            value={review.rating}
                            onChange={(e) => {
                              const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                              updatedReviews[index] = { ...review, rating: Number(e.target.value) };
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            className={`px-3 py-2 border border-border rounded-md ${fieldCls}`}
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5 stelle)</option>
                            <option value={4}>⭐⭐⭐⭐ (4 stelle)</option>
                            <option value={3}>⭐⭐⭐ (3 stelle)</option>
                            <option value={2}>⭐⭐ (2 stelle)</option>
                            <option value={1}>⭐ (1 stella)</option>
                          </select>
                          
                          <input
                            type="text"
                            value={review.date || ""}
                            onChange={(e) => {
                              const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                              updatedReviews[index] = { ...review, date: e.target.value };
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            placeholder="Es: 2 settimane fa"
                            className={`px-3 py-2 border border-border rounded-md ${fieldCls}`}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <textarea
                            value={review.text}
                            onChange={(e) => {
                              const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                              updatedReviews[index] = { ...review, text: e.target.value };
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            placeholder="Testo della recensione..."
                            rows={3}
                            className={`flex-1 px-3 py-2 border border-border rounded-md ${fieldCls}`}
                          />
                          
                          <button
                            type="button"
                            onClick={() => {
                              const updatedReviews = (content.googleReviews?.fallbackReviews || []).filter((_, i) => i !== index);
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!content.googleReviews?.fallbackReviews || content.googleReviews.fallbackReviews.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nessuna recensione configurata.</p>
                      <p className="text-sm">Usa "Aggiungi Recensione" per iniziare o verranno mostrate quelle di default.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ✅ NUOVA SEZIONE: Legal Compliance */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">⚖️ Informazioni Legali</h2>
          
          <div className="space-y-4">
            <div className="text-sm text-black/70 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <strong>⚖️ Legal Compliance:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Configura informazioni aziendali per il footer (P.IVA, CF, etc.)</li>
                <li>Gestisci consenso GDPR per il form di prenotazione</li>
                <li>Configura banner cookie e policy</li>
                <li>Link a Privacy Policy, Cookie Policy e Termini di Servizio</li>
              </ul>
            </div>

            {/* Informazioni aziendali */}
            <div className="space-y-4 p-4 border border-foreground/10 rounded-lg">
              <h3 className="font-medium text-black">🏢 Informazioni Aziendali</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Nome Azienda
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.companyName || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        companyName: e.target.value
                      }
                    })}
                    placeholder="GZnutrition"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.vatNumber || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        vatNumber: e.target.value
                      }
                    })}
                    placeholder="IT12345678901"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.taxCode || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        taxCode: e.target.value
                      }
                    })}
                    placeholder="RSSMRA80A01H501U"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Email Legale
                  </label>
                  <input
                    type="email"
                    value={content.legalInfo?.email || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        email: e.target.value
                      }
                    })}
                    placeholder="info@gznutrition.com"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Indirizzo Legale
                </label>
                <textarea
                  value={content.legalInfo?.registeredAddress || ""}
                  onChange={(e) => setContent({
                    ...content,
                    legalInfo: {
                      ...content.legalInfo,
                      registeredAddress: e.target.value
                    }
                  })}
                  placeholder="Via Roma 123, 00100 Roma (RM)"
                  rows={2}
                  className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Testo Footer Personalizzato
                </label>
                <input
                  type="text"
                  value={content.legalInfo?.footerText || ""}
                  onChange={(e) => setContent({
                    ...content,
                    legalInfo: {
                      ...content.legalInfo,
                      footerText: e.target.value
                    }
                  })}
                  placeholder="Testo aggiuntivo per il footer"
                  className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                />
              </div>
            </div>

            {/* GDPR e Privacy */}
            <div className="space-y-4 p-4 border border-foreground/10 rounded-lg">
              <h3 className="font-medium text-black">🔒 GDPR e Privacy</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Testo Consenso GDPR
                </label>
                <textarea
                  value={content.legalInfo?.gdprConsentText || ""}
                  onChange={(e) => setContent({
                    ...content,
                    legalInfo: {
                      ...content.legalInfo,
                      gdprConsentText: e.target.value
                    }
                  })}
                  placeholder="Testo personalizzato per il consenso GDPR nel form..."
                  rows={3}
                  className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Se vuoto, verrà usato il testo di default conforme al GDPR
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-black mb-2">📄 Pagine Legali</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Le pagine legali sono ora integrate nel sito e accessibili tramite:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li><strong>Privacy Policy:</strong> <a href="/privacy" target="_blank" className="text-primary hover:underline">/privacy</a></li>
                  <li><strong>Cookie Policy:</strong> <a href="/cookies" target="_blank" className="text-primary hover:underline">/cookies</a></li>
                  <li><strong>Termini di Servizio:</strong> <a href="/terms" target="_blank" className="text-primary hover:underline">/terms</a></li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Le pagine sono personalizzate automaticamente con le informazioni aziendali configurate sopra.
                </p>
              </div>
            </div>

            {/* Editor Pagine Legali */}
            <div className="space-y-4 p-4 border border-foreground/10 rounded-lg">
              <h3 className="font-medium text-black">📝 Editor Pagine Legali</h3>
              <p className="text-sm text-gray-600 mb-4">
                Modifica il contenuto delle pagine legali. Puoi utilizzare HTML per la formattazione.
              </p>
              
              {/* Privacy Policy Editor */}
              <div className="space-y-3">
                <h4 className="font-medium text-black">🔒 Privacy Policy</h4>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Titolo
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.legalPages?.privacyPolicy?.title || "Privacy Policy"}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        legalPages: {
                          ...content.legalInfo?.legalPages,
                          privacyPolicy: {
                            ...content.legalInfo?.legalPages?.privacyPolicy,
                            title: e.target.value
                          }
                        }
                      }
                    })}
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Contenuto (HTML)
                  </label>
                  <textarea
                    value={content.legalInfo?.legalPages?.privacyPolicy?.content || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        legalPages: {
                          ...content.legalInfo?.legalPages,
                          privacyPolicy: {
                            ...content.legalInfo?.legalPages?.privacyPolicy,
                            content: e.target.value,
                            lastUpdated: new Date().toLocaleDateString('it-IT')
                          }
                        }
                      }
                    })}
                    rows={15}
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                    placeholder="Inserisci il contenuto HTML della Privacy Policy..."
                  />
                </div>
              </div>

              {/* Cookie Policy Editor */}
              <div className="space-y-3">
                <h4 className="font-medium text-black">🍪 Cookie Policy</h4>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Titolo
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.legalPages?.cookiePolicy?.title || "Cookie Policy"}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        legalPages: {
                          ...content.legalInfo?.legalPages,
                          cookiePolicy: {
                            ...content.legalInfo?.legalPages?.cookiePolicy,
                            title: e.target.value
                          }
                        }
                      }
                    })}
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Contenuto (HTML)
                  </label>
                  <textarea
                    value={content.legalInfo?.legalPages?.cookiePolicy?.content || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        legalPages: {
                          ...content.legalInfo?.legalPages,
                          cookiePolicy: {
                            ...content.legalInfo?.legalPages?.cookiePolicy,
                            content: e.target.value,
                            lastUpdated: new Date().toLocaleDateString('it-IT')
                          }
                        }
                      }
                    })}
                    rows={15}
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                    placeholder="Inserisci il contenuto HTML della Cookie Policy..."
                  />
                </div>
              </div>

              {/* Terms of Service Editor */}
              <div className="space-y-3">
                <h4 className="font-medium text-black">📋 Termini di Servizio</h4>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Titolo
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.legalPages?.termsOfService?.title || "Termini di Servizio"}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        legalPages: {
                          ...content.legalInfo?.legalPages,
                          termsOfService: {
                            ...content.legalInfo?.legalPages?.termsOfService,
                            title: e.target.value
                          }
                        }
                      }
                    })}
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Contenuto (HTML)
                  </label>
                  <textarea
                    value={content.legalInfo?.legalPages?.termsOfService?.content || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        legalPages: {
                          ...content.legalInfo?.legalPages,
                          termsOfService: {
                            ...content.legalInfo?.legalPages?.termsOfService,
                            content: e.target.value,
                            lastUpdated: new Date().toLocaleDateString('it-IT')
                          }
                        }
                      }
                    })}
                    rows={15}
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                    placeholder="Inserisci il contenuto HTML dei Termini di Servizio..."
                  />
                </div>
              </div>
            </div>

            {/* Cookie Banner */}
            <div className="space-y-4 p-4 border border-foreground/10 rounded-lg">
              <h3 className="font-medium text-black">🍪 Cookie Banner</h3>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="cookieBannerEnabled"
                  checked={content.legalInfo?.cookieBanner?.enabled !== false}
                  onChange={(e) => setContent({
                    ...content,
                    legalInfo: {
                      ...content.legalInfo,
                      cookieBanner: {
                        ...content.legalInfo?.cookieBanner,
                        enabled: e.target.checked
                      }
                    }
                  })}
                  className="w-4 h-4 text-primary bg-background border-foreground/20 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="cookieBannerEnabled" className="text-sm text-black">
                  Abilita banner cookie
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Titolo Banner
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.cookieBanner?.title || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        cookieBanner: {
                          ...content.legalInfo?.cookieBanner,
                          title: e.target.value
                        }
                      }
                    })}
                    placeholder="🍪 Utilizzo dei Cookie"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Testo Pulsante Accetta
                  </label>
                  <input
                    type="text"
                    value={content.legalInfo?.cookieBanner?.acceptText || ""}
                    onChange={(e) => setContent({
                      ...content,
                      legalInfo: {
                        ...content.legalInfo,
                        cookieBanner: {
                          ...content.legalInfo?.cookieBanner,
                          acceptText: e.target.value
                        }
                      }
                    })}
                    placeholder="Accetta"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Messaggio Banner
                </label>
                <textarea
                  value={content.legalInfo?.cookieBanner?.message || ""}
                  onChange={(e) => setContent({
                    ...content,
                    legalInfo: {
                      ...content.legalInfo,
                      cookieBanner: {
                        ...content.legalInfo?.cookieBanner,
                        message: e.target.value
                      }
                    }
                  })}
                  placeholder="Messaggio personalizzato per il banner cookie..."
                  rows={2}
                  className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                />
              </div>
            </div>
          </div>

        </section>

        {/* ✅ SEZIONE META TAG PER LINK PREVIEW */}
        <section className="bg-card p-6 rounded-lg border border-border mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            🔗 Meta Tag per Link Preview
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Configura come appare il tuo sito quando viene condiviso sui social media (Facebook, Twitter, WhatsApp, etc.)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Titolo Open Graph */}
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                Titolo per Social Media
              </label>
              <Input
                value={content.metaTags?.title || ""}
                onChange={(e) => setContent({
                  ...content,
                  metaTags: {
                    ...content.metaTags,
                    title: e.target.value
                  }
                })}
                placeholder="Es. GZnutrition — Trasformazione fisica"
                className={fieldCls}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se vuoto, usa il titolo della sezione Hero
              </p>
            </div>

            {/* Descrizione Open Graph */}
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                Descrizione per Social Media
              </label>
              <textarea
                value={content.metaTags?.description || ""}
                onChange={(e) => setContent({
                  ...content,
                  metaTags: {
                    ...content.metaTags,
                    description: e.target.value
                  }
                })}
                placeholder="Breve descrizione del tuo servizio..."
                rows={3}
                className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se vuoto, usa il sottotitolo della sezione Hero
              </p>
            </div>

            {/* URL del sito */}
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                URL del Sito
              </label>
              <Input
                value={content.metaTags?.siteUrl || ""}
                onChange={(e) => setContent({
                  ...content,
                  metaTags: {
                    ...content.metaTags,
                    siteUrl: e.target.value
                  }
                })}
                placeholder="https://gznutrition.it"
                className={fieldCls}
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL completo del tuo sito web
              </p>
            </div>

            {/* Nome del sito */}
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                Nome del Sito
              </label>
              <Input
                value={content.metaTags?.siteName || ""}
                onChange={(e) => setContent({
                  ...content,
                  metaTags: {
                    ...content.metaTags,
                    siteName: e.target.value
                  }
                })}
                placeholder="GZnutrition"
                className={fieldCls}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nome che appare nei link condivisi
              </p>
            </div>

            {/* Immagine Open Graph */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-black">
                Immagine per Link Preview
              </label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    value={content.metaTags?.image || ""}
                    onChange={(e) => setContent({
                      ...content,
                      metaTags: {
                        ...content.metaTags,
                        image: e.target.value
                      }
                    })}
                    placeholder="URL dell'immagine di anteprima"
                    className={fieldCls}
                  />
                </div>
                <UploadButton
                  onUploaded={(url: string) => setContent({
                    ...content,
                    metaTags: {
                      ...content.metaTags,
                      image: url
                    }
                  })}
                  folder="meta"
                >
                  📤 Carica Immagine
                </UploadButton>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dimensioni consigliate: 1200x630px. Se vuoto, usa l'immagine di sfondo della sezione Hero
              </p>
              {content.metaTags?.image && (
                <div className="mt-3">
                  <img
                    src={content.metaTags.image}
                    alt="Preview"
                    className="max-w-sm h-auto rounded border"
                  />
                </div>
              )}
            </div>

            {/* Opzioni avanzate */}
            <div className="md:col-span-2">
              <div className="bg-muted/50 p-4 rounded border">
                <h4 className="font-medium text-foreground mb-3">Opzioni Avanzate</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tipo Twitter Card */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Tipo Twitter Card
                    </label>
                    <select
                      value={content.metaTags?.twitterCard || "summary_large_image"}
                      onChange={(e) => setContent({
                        ...content,
                        metaTags: {
                          ...content.metaTags,
                          twitterCard: e.target.value as "summary" | "summary_large_image"
                        }
                      })}
                      className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                    >
                      <option value="summary_large_image">Immagine Grande</option>
                      <option value="summary">Immagine Piccola</option>
                    </select>
                  </div>

                  {/* Lingua/Locale */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Lingua del Sito
                    </label>
                    <Input
                      value={content.metaTags?.locale || "it_IT"}
                      onChange={(e) => setContent({
                        ...content,
                        metaTags: {
                          ...content.metaTags,
                          locale: e.target.value
                        }
                      })}
                      placeholder="it_IT"
                      className={fieldCls}
                    />
                  </div>

                  {/* Tipo Open Graph */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Tipo Open Graph
                    </label>
                    <Input
                      value={content.metaTags?.ogType || "website"}
                      onChange={(e) => setContent({
                        ...content,
                        metaTags: {
                          ...content.metaTags,
                          ogType: e.target.value
                        }
                      })}
                      placeholder="website"
                      className={fieldCls}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        </div>

        {/* Pulsante salva */}
        <div className="flex justify-between items-center pt-6 border-t border-foreground/10 mt-8">
          {/* Debug button */}
          <Button 
            onClick={async () => {
              await debugLog("🔍 DEBUG - Stato attuale content:", content);
              await debugLog("📊 DEBUG - BMI config:", content.bmiCalculator);
              await debugLog("⭐ DEBUG - Reviews config:", content.googleReviews);
              await debugLog("🔗 DEBUG - Meta tags config:", content.metaTags);
              toast.success("🔍 Debug info logged to console");
            }}
            variant="outline"
            className="text-xs px-4 py-2"
          >
            🔍 Debug State
          </Button>
          
          <Button onClick={save} className="bg-primary hover:bg-primary/90 px-6 py-2">
            💾 Salva Contenuti
          </Button>
        </div>
      </div>
    </>
  );
}



