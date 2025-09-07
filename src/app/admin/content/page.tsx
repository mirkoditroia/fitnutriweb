"use client";
import { useEffect, useState } from "react";
import { getSiteContent, upsertSiteContent, type SiteContent } from "@/lib/datasource";
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
      console.log("🔄 CARICAMENTO INIZIALE contenuti:", c);
      console.log("📊 BMI config caricato:", c?.bmiCalculator);
      console.log("⭐ Reviews config caricato:", c?.googleReviews);
      
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
        }
      } : { 
        heroTitle: "", 
        heroSubtitle: "", 
        heroCta: "Prenota ora",
        heroBackgroundImage: "",
        heroBadgeText: "Performance • Estetica • Energia",
        heroBadgeColor: "bg-primary text-primary-foreground",
        colorPalette: "gz-default" as const,
        navbarLogoMode: "text" as const,
        navbarLogoText: "GZ Nutrition",
        navbarLogoHeight: 40,
        navbarLogoAutoRemoveBg: false,
        contactSectionTitle: "💬 Contatti Diretti",
        studiosSectionTitle: "🏢 I Nostri Studi",
        contactSectionSubtitle: "",
        studiosSectionSubtitle: "",
        socialChannels: [],
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
        }
      };
      
      setContent(finalContent);
      setLoading(false);
    }).catch(error => {
      console.error("❌ Errore caricamento:", error);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!content) return;

    console.log("💾 SALVATAGGIO contenuti:", content);
    console.log("📊 BMI Calculator config:", content.bmiCalculator);
    console.log("⭐ Google Reviews config:", content.googleReviews);
    
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
      
      console.log("✅ SALVATAGGIO COMPLETATO con successo");
      
    } catch (error) {
      console.error("❌ Errore salvataggio:", error);
      toast.error("❌ Errore nel salvataggio");
      return; // Esce se c'è errore
    }
  };

  // ✅ APPLICA PALETTE DINAMICA
  useEffect(() => {
    if (content?.colorPalette) {
      const paletteConfig = getPaletteConfig(content.colorPalette);
      if (paletteConfig) {
        const root = document.documentElement;
        root.style.setProperty('--primary', paletteConfig.primary, 'important');
        root.style.setProperty('--primary-foreground', (paletteConfig as any).primaryText || '#ffffff', 'important');
        root.style.setProperty('--secondary', paletteConfig.secondaryBg, 'important');
        root.style.setProperty('--secondary-fg', paletteConfig.secondaryText, 'important');
      }
    }
  }, [content?.colorPalette]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Errore nel caricamento
        </h2>
        <p className="text-gray-500">Impossibile caricare la configurazione.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-surface mt-6 rounded-xl p-8 space-y-12 border border-foreground/10 bg-background/70 backdrop-blur-sm shadow-md">
        {/* ========== STILE E ASPETTO ========== */}
        <div className="border-b border-foreground/10 pb-8">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            🎨 Stile e Aspetto
          </h3>
          
          {/* Palette Colori */}
          <section className="space-y-4">
            <h2 className="font-semibold text-black">Palette Colori</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(PALETTES).map(([paletteId, palette]) => (
                <div 
                  key={paletteId}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    content.colorPalette === paletteId 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => {
                    setContent({...content, colorPalette: paletteId as typeof content.colorPalette});
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-black">{palette.name}</h3>
                      {content.colorPalette === paletteId && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    
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
                    
                    <div className="space-y-2">
                      <div 
                        className="px-2 py-1 rounded text-white text-center font-medium"
                        style={{ backgroundColor: palette.primary }}
                      >
                        Bottone Primario
                      </div>
                      <div 
                        className="px-2 py-1 rounded text-center font-medium border"
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
          </section>
        </div>

        {/* Logo Navbar */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">Logo Navbar</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Tipo Logo</label>
            <select
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
              value={content.navbarLogoMode ?? "text"}
              onChange={(e) => setContent({ ...content, navbarLogoMode: (e.target.value as 'image' | 'text') })}
            >
              <option value="image">Immagine (upload)</option>
              <option value="text">Testo</option>
            </select>
          </div>

          {/* Logo immagine */}
          { (content.navbarLogoMode ?? "text") === "image" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2 text-black">URL Immagine Logo</label>
                <input
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                  value={content.navbarLogoImageUrl ?? ""}
                  onChange={(e) => setContent({ ...content, navbarLogoImageUrl: e.target.value })}
                />
                <UploadButton folder="brand" onUploaded={(url) => setContent({ ...content, navbarLogoImageUrl: url })} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-black">Altezza (px)</label>
                <input
                  type="number"
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                  value={content.navbarLogoHeight ?? 40}
                  onChange={(e) => setContent({ ...content, navbarLogoHeight: parseInt(e.target.value) || 0 })}
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRemoveBg"
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
                <label className="block text-sm font-medium mb-2 text-black">Testo Logo</label>
                <input
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                  value={content.navbarLogoText ?? ""}
                  onChange={(e) => setContent({ ...content, navbarLogoText: e.target.value })}
                  placeholder="GZ Nutrition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-black">Dimensione</label>
                <select
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                  value={content.navbarLogoTextSize ?? "text-xl"}
                  onChange={(e) => setContent({ ...content, navbarLogoTextSize: e.target.value as any })}
                >
                  <option value="text-sm">Piccolo</option>
                  <option value="text-base">Normale</option>
                  <option value="text-lg">Grande</option>
                  <option value="text-xl">Molto Grande</option>
                  <option value="text-2xl">Enorme</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-black">Peso</label>
                <select
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-black`}
                  value={content.navbarLogoTextWeight ?? "font-bold"}
                  onChange={(e) => setContent({ ...content, navbarLogoTextWeight: e.target.value as any })}
                >
                  <option value="font-normal">Normale</option>
                  <option value="font-semibold">Semi-bold</option>
                  <option value="font-bold">Bold</option>
                  <option value="font-extrabold">Extra Bold</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* ========== CONTENUTI PRINCIPALI ========== */}
        <div className="border-b border-foreground/10 pb-8">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            📝 Contenuti Principali
          </h3>
          
          {/* Hero Section */}
          <section className="space-y-4">
            <h2 className="font-semibold text-black">Hero</h2>
            <Input label="Titolo principale" value={content.heroTitle ?? ""} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} placeholder="Trasforma la tua vita con la nutrizione" />
            <Input label="Sottotitolo" value={content.heroSubtitle ?? ""} onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })} placeholder="Prenota una consulenza personalizzata" />
            <Input label="Testo CTA" value={content.heroCta ?? ""} onChange={(e) => setContent({ ...content, heroCta: e.target.value })} placeholder="Prenota ora" />
          </section>
          
          {/* Controlli per il badge personalizzabile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              label="Testo badge hero" 
              value={content.heroBadgeText ?? "Performance • Estetica • Energia"} 
              onChange={(e) => setContent({ ...content, heroBadgeText: e.target.value })} 
              placeholder="Performance • Estetica • Energia"
            />
            
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Colore badge</label>
              <select 
                className={`w-full rounded-md border px-3 py-2 text-sm ${fieldCls}`}
                value={content.heroBadgeColor ?? "bg-primary text-primary-foreground"}
                onChange={(e) => setContent({ ...content, heroBadgeColor: e.target.value })}
              >
                <option value="bg-primary text-primary-foreground">Primario (verde)</option>
                <option value="bg-blue-500 text-white">Blu</option>
                <option value="bg-purple-500 text-white">Viola</option>
                <option value="bg-orange-500 text-white">Arancione</option>
                <option value="bg-pink-500 text-white">Rosa</option>
                <option value="bg-gray-800 text-white">Grigio scuro</option>
                <option value="bg-gradient-to-r from-blue-500 to-purple-600 text-white">Gradiente Blu-Viola</option>
                <option value="bg-gradient-to-r from-green-400 to-blue-500 text-white">Gradiente Verde-Blu</option>
                <option value="bg-gradient-to-r from-pink-500 to-orange-500 text-white">Gradiente Rosa-Arancione</option>
              </select>
            </div>
          </div>
        </div>

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
          
          {/* Canali Social */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-black">Canali Social</h3>
              <button
                onClick={() => setContent({ ...content, socialChannels: [...(content.socialChannels ?? []), { platform: "", url: "", icon: "" }] })}
                className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90"
              >
                + Aggiungi canale
              </button>
            </div>
            
            {(content.socialChannels ?? []).map((social, index) => (
              <div key={index} className="flex gap-3">
                <Input
                  label="Piattaforma" 
                  value={social.platform} 
                  onChange={(e) => {
                    const newSocials = [...(content.socialChannels ?? [])];
                    newSocials[index] = { ...social, platform: e.target.value };
                    setContent({ ...content, socialChannels: newSocials });
                  }} 
                  placeholder="Instagram, LinkedIn, Facebook..."
                />
                <Input
                  label="URL" 
                  value={social.url}
                  onChange={(e) => {
                    const newSocials = [...(content.socialChannels ?? [])];
                    newSocials[index] = { ...social, url: e.target.value };
                    setContent({ ...content, socialChannels: newSocials });
                  }}
                  placeholder="https://..."
                />
                <button
                  onClick={() => {
                    const newSocials = (content.socialChannels ?? []).filter((_, i) => i !== index);
                    setContent({ ...content, socialChannels: newSocials });
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 self-end"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ NUOVA SEZIONE: Calcolatore BMI */}
        <section className="space-y-4 mt-8">
          <h2 className="font-semibold text-black">📊 Calcolatore BMI</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="bmiCalculatorEnabled"
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
              <label htmlFor="bmiCalculatorEnabled" className="font-medium">
                Mostra calcolatore BMI nella landing page
              </label>
            </div>
            
            <div className="text-sm text-black/70 p-3 bg-green-50 rounded-lg border border-green-200">
              <strong>📊 Calcolatore BMI:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Calcolatore interattivo per Indice di Massa Corporea</li>
                <li>Design moderno e responsive</li>
                <li>Posizionato sotto il form di prenotazione</li>
                <li>Personalizzabile titolo e sottotitolo</li>
                <li>Disabilitato di default</li>
              </ul>
            </div>

            {content.bmiCalculator?.enabled && (
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">
                      Titolo calcolatore
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
                      Sottotitolo calcolatore
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
              </div>
            )}
          </div>
        </section>

        {/* ✅ GOOGLE REVIEWS - Link alla pagina dedicata */}
        <section className="space-y-4 mt-8">
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-black">⭐ Google Reviews</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gestisci widget Google Reviews e recensioni manuali in una pagina dedicata
                </p>
              </div>
              <a
                href="/admin/trustpilot"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                🎯 Configura Reviews
              </a>
            </div>
            
            <div className="mt-4 text-sm text-gray-700">
              <strong>💡 Novità:</strong> Ora puoi scegliere tra Widget Google automatico o recensioni manuali. 
              Vai alla pagina dedicata per una configurazione completa.
            </div>
          </div>
        </section>

        {/* Pulsante salva */}
        <div className="flex justify-between items-center pt-6 border-t border-foreground/10 mt-8">
          {/* Debug button */}
          <Button 
            onClick={() => {
              console.log("🔍 DEBUG - Stato attuale content:", content);
              console.log("📊 DEBUG - BMI config:", content.bmiCalculator);
              console.log("⭐ DEBUG - Reviews config:", content.googleReviews);
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