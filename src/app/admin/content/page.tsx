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
              setContent(
        c ?? { 
          heroTitle: "", 
          heroSubtitle: "", 
          heroCta: "Prenota ora", 
          heroBackgroundImage: "", 
          images: [],
          colorPalette: "gz-default" as const
        }
      );
        setLoading(false);
      });
  }, []);

  if (loading || !content) return <main className="container py-8">Caricamento...</main>;

  const save = async () => {
    await upsertSiteContent(content);
    
    // Save palette to localStorage for immediate effect
    if (content.colorPalette) {
      localStorage.setItem('gz-palette', content.colorPalette);
      
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
    
    toast.success("Palette salvata e applicata!");
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
      <h1 className="text-2xl font-bold text-foreground pt-4 tracking-tight">Contenuti Landing</h1>
      <div className="admin-surface mt-6 rounded-xl p-6 space-y-8 border border-foreground/10 bg-background/70 backdrop-blur-sm shadow-md">
        {/* Palette Colori Robuste */}
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
                  
                  // Also update localStorage for immediate effect across the site
                  try {
                    localStorage.setItem('gz-palette', paletteId);
                  } catch (e) {
                    // Ignore if localStorage is not available
                  }
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


        {/* Navbar Logo */}
        <section className="space-y-3">
          <h2 className="font-semibold">Logo Navbar</h2>
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
        <section className="space-y-3">
          <h2 className="font-semibold">Hero</h2>
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

        <section className="space-y-3">
          <h2 className="font-semibold">Presentazione nutrizionista</h2>
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

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Immagini sezione</h2>
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
        <section className="space-y-3">
          <h2 className="font-semibold">Contatti</h2>
          
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

        {/* Google Calendar Integration */}
        <section className="space-y-3">
          <h2 className="font-semibold">Google Calendar</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="calendarEnabled"
                checked={content.googleCalendar?.isEnabled ?? false}
                onChange={(e) => setContent({
                  ...content,
                  googleCalendar: {
                    ...content.googleCalendar,
                    isEnabled: e.target.checked
                  }
                })}
                className="text-primary"
              />
              <label htmlFor="calendarEnabled" className="font-medium">
                Abilita sincronizzazione Google Calendar
              </label>
            </div>

            {content.googleCalendar?.isEnabled && (
              <div className="space-y-4 p-4 border border-border rounded-lg bg-background/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Calendar ID"
                    value={content.googleCalendar?.calendarId ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleCalendar: {
                        ...content.googleCalendar,
                        calendarId: e.target.value
                      }
                    })}
                    placeholder="ID del calendario Google"
                  />
                  
                  <Input
                    label="Timezone"
                    value={content.googleCalendar?.timezone ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleCalendar: {
                        ...content.googleCalendar,
                        timezone: e.target.value
                      }
                    })}
                    placeholder="Europe/Rome"
                  />
                  
                  <Input
                    label="Service Account Email"
                    value={content.googleCalendar?.serviceAccountEmail ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleCalendar: {
                        ...content.googleCalendar,
                        serviceAccountEmail: e.target.value
                      }
                    })}
                    placeholder="email@project.iam.gserviceaccount.com"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/calendar');
                        const result = await response.json();
                        if (result.success) {
                          toast.success('Connessione Google Calendar riuscita!');
                        } else {
                          toast.error(`Errore connessione: ${result.message}`);
                        }
                      } catch (error) {
                        toast.error('Errore nel test della connessione');
                      }
                    }}
                  >
                    Test Connessione
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Apri il calendario in una nuova tab
                      const calendarId = content.googleCalendar?.calendarId;
                      if (calendarId) {
                        window.open(`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`, '_blank');
                      }
                    }}
                  >
                    Apri Calendario
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <p><strong>Info:</strong> Ogni prenotazione verrà automaticamente sincronizzata con Google Calendar.</p>
                  <p>• Eventi confermati: colore blu</p>
                  <p>• Consultazioni gratuite: colore arancione</p>
                  <p>• Promemoria automatici: 24h prima e 30 minuti prima</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sezione Risultati Clienti */}
        <section className="space-y-4">
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
                  <UploadButton
                    folder="results"
                    accept=".jpg,.jpeg,.png,.webp"
                    maxSize={5}
                    onUploaded={(url) => {
                      const newPhoto = {
                        id: Date.now().toString(),
                        url,
                        description: "",
                        beforeAfter: "single" as const
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
                          
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Tipo foto</label>
                            <select
                              value={photo.beforeAfter ?? "single"}
                              onChange={(e) => {
                                const updatedPhotos = [...(content.resultsSection?.photos ?? [])];
                                updatedPhotos[index] = { ...photo, beforeAfter: e.target.value as any };
                                setContent({
                                  ...content,
                                  resultsSection: {
                                    ...content.resultsSection,
                                    photos: updatedPhotos
                                  }
                                });
                              }}
                              className={`w-full rounded-md border px-3 py-2 text-sm ${fieldCls}`}
                            >
                              <option value="single">Foto singola</option>
                              <option value="before">Prima</option>
                              <option value="after">Dopo</option>
                            </select>
                          </div>
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

        {/* Popup 10 Minuti Consultivi Gratuiti */}
        <section className="space-y-3">
          <h2 className="font-semibold">Popup</h2>
          
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
              </div>
            )}
          </div>
        </section>
        <div className="flex justify-end pt-2">
          <Button onClick={save}>Salva contenuti</Button>
        </div>
      </div>
    </>
  );
}



