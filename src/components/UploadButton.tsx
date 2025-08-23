"use client";
import { useRef, useState } from "react";

export function UploadButton({ folder = "uploads", onUploaded }: { folder?: string; onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const onClick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "upload failed");
      onUploaded(json.url as string);
    } catch (e) {
      console.error(e);
      alert("Upload fallito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button type="button" className="btn-outline" onClick={onClick} disabled={loading}>
        {loading ? "Caricamento..." : "Carica immagine"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  );
}


