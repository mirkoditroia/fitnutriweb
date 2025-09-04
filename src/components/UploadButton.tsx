"use client";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface UploadButtonProps {
  folder: string;
  onUploaded: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function UploadButton({ 
  folder, 
  onUploaded, 
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png", 
  maxSize = 10 
}: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  // Generate a unique ID per component instance so multiple upload buttons can coexist
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File troppo grande. Dimensione massima: ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      // Real upload via API (works in local and firebase modes)
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      
      console.log(`[UploadButton] Caricamento file: ${file.name} (${file.size} bytes)`);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[UploadButton] Upload fallito: ${res.status} - ${errorText}`);
        throw new Error(`Upload fallito: ${res.status}`);
      }
      
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.error) {
        console.error(`[UploadButton] Errore server:`, json.error);
        throw new Error(`Errore server: ${json.error}`);
      }
      
      if (!json.url) {
        console.error(`[UploadButton] Nessun URL ritornato:`, json);
        throw new Error("Nessun URL ritornato dal server");
      }

      console.log(`[UploadButton] Upload completato: ${json.url}`);
      toast.success("File caricato con successo!");
      onUploaded(json.url);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
      toast.error(`Errore caricamento: ${errorMessage}`);
    } finally {
      setUploading(false);
      // allow selecting the same file again if needed
      if (event.target) {
        try { (event.target as HTMLInputElement).value = ""; } catch {}
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        id={`upload-${folder}-${inputId}`}
        disabled={uploading}
      />
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        className="cursor-pointer"
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? "⏳ Caricamento..." : "📁 Carica File"}
      </Button>
      <span className="text-xs text-foreground/60">
        Max {maxSize}MB
      </span>
    </div>
  );
}


