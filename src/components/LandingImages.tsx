"use client";
import { useState } from "react";

type Img = { key: string; url: string };

export function LandingImages({ images }: { images?: Img[] }) {
  const [idx, setIdx] = useState(0);
  
  if (!images || images.length === 0) return null;
  const prev = () => setIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  const current = images[idx];

  return (
    <section className="container py-12 border-t border-foreground/10">
      <div className="relative">
        <div className="rounded-xl bg-[color:var(--background)] border border-[color:var(--border)] p-2 flex items-center justify-center">
          <img
            src={current.url}
            alt={current.key}
            className="w-full h-auto max-h-[28rem] object-contain rounded-md"
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button className="btn-outline" onClick={prev} aria-label="Immagine precedente">
          <span className="text-center">Indietro</span>
        </button>
          <div className="flex gap-2" aria-label="Selettore immagini landing">
            {images.map((img, i) => (
              <button
                key={img.key + i}
                onClick={() => setIdx(i)}
                className={`h-2 w-2 rounded-full ${i === idx ? "bg-primary" : "bg-foreground/20"}`}
                aria-label={`Immagine ${i + 1}`}
              />
            ))}
          </div>
          <button className="btn-primary" onClick={next} aria-label="Immagine successiva">
          <span className="text-center">Avanti</span>
        </button>
        </div>
      </div>
    </section>
  );
}


