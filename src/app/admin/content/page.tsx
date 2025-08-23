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
        c ?? { heroTitle: "", heroSubtitle: "", heroCta: "Prenota ora", images: [] }
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
    <main className="container py-8">
      <h1 className="text-2xl font-bold">Contenuti Landing</h1>
      <div className="mt-6 card p-6 space-y-6">
        <section className="space-y-3">
          <h2 className="font-semibold">Hero</h2>
          <Input label="Hero title" value={content.heroTitle} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} />
          <Input label="Hero subtitle" value={content.heroSubtitle} onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })} />
          <Input label="Hero CTA" value={content.heroCta} onChange={(e) => setContent({ ...content, heroCta: e.target.value })} />
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
        <div className="flex justify-end pt-2">
          <Button onClick={save}>Salva contenuti</Button>
        </div>
      </div>
    </main>
  );
}


