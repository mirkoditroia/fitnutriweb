"use client";
import { useEffect, useState } from "react";
import { getSiteContent, upsertSiteContent, type SiteContent } from "@/lib/datasource";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { UploadButton } from "@/components/UploadButton";

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
          getSiteContent().then((c) => {
        setContent(
          c ?? { heroTitle: "", heroSubtitle: "", heroCta: "Prenota ora", heroBackgroundImage: "", images: [] }
        );
        setLoading(false);
      });
  }, []);

  if (loading || !content) return <main className="container py-8">Caricamento...</main>;

  const save = async () => {
    await upsertSiteContent(content);
    toast.success("Contenuti salvati");
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
      <h1 className="text-2xl font-bold text-foreground pt-4">Contenuti Landing</h1>
      <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-6 shadow-sm">
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
              <label className="block text-sm font-medium mb-1">Colore badge hero</label>
              <select 
                className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium mb-1">Hero background image URL</label>
            <div className="flex gap-2">
              <input className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" value={content.heroBackgroundImage ?? ""} onChange={(e) => setContent({ ...content, heroBackgroundImage: e.target.value })} />
              <UploadButton folder="content" onUploaded={(url) => setContent({ ...content, heroBackgroundImage: url })} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Presentazione nutrizionista</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input label="About title" value={content.aboutTitle ?? ""} onChange={(e) => setContent({ ...content, aboutTitle: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-1">About image URL</label>
              <div className="flex gap-2">
                <input className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" value={content.aboutImageUrl ?? ""} onChange={(e) => setContent({ ...content, aboutImageUrl: e.target.value })} />
                <UploadButton folder="content" onUploaded={(url) => setContent({ ...content, aboutImageUrl: url })} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">About body</label>
            <textarea className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" rows={5} value={content.aboutBody ?? ""} onChange={(e) => setContent({ ...content, aboutBody: e.target.value })} />
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
                  <input className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm" value={im.url} onChange={(e) => updateImg(i, "url", e.target.value)} />
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
              <Button type="button" onClick={() => setContent({ ...content, socialChannels: [...(content.socialChannels ?? []), { platform: "", url: "", icon: "" }] })}>+ Aggiungi Social</Button>
            </div>
            {(content.socialChannels ?? []).map((social, i) => (
              <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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


