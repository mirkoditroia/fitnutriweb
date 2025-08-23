"use client";
import { useState } from "react";

type Props = {
  title?: string;
  body?: string;
  imageUrl?: string;
};

export function AboutSection({ title, body, imageUrl }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  if (!title && !body) return null;

  return (
    <section id="chi-sono" className="container py-12 border-t border-[color:var(--border)]">
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2">
          <div className="text-center">
            {body && (
              <p className={`text-foreground/80 whitespace-pre-line mx-auto ${expanded ? "" : "line-clamp-4"}`}>
                {body}
              </p>
            )}
            {body && body.length > 220 && (
              <button
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:opacity-80"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? "Mostra meno" : "Espandi testo"}
              >
                {expanded ? "Mostra meno" : "Espandi"}
                <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
              </button>
            )}
          </div>
        </div>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title || "Immagine nutrizionista"}
            className="w-full h-auto max-h-[28rem] object-contain rounded-xl md:order-2"
          />
        )}
      </div>
    </section>
  );
}


