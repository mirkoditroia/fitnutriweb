"use client";
import { useEffect, useRef } from "react";
import type { Package } from "@/lib/data";

type Props = {
  pkg: Package;
  onClose: () => void;
};

export function PackageModal({ pkg, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `pkg-title-${pkg.id ?? pkg.title}`;
  const descId = `pkg-desc-${pkg.id ?? pkg.title}`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleClose);
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) {
      ref.current?.close();
    }
  };

  return (
    <dialog ref={ref} className="rounded-lg p-0 w-[min(90vw,520px)] bg-background text-foreground" aria-labelledby={titleId} aria-describedby={descId} onClick={onBackdropClick}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold">{pkg.title}</h2>
          <button className="btn-outline" onClick={() => ref.current?.close()} aria-label="Chiudi dialog">
          <span className="text-center">Chiudi</span>
        </button>
        </div>
        {pkg.imageUrl && (
          <img src={pkg.imageUrl} alt={pkg.title} className="mt-4 w-full h-48 object-cover rounded-md" />
        )}
        <p id={descId} className="text-sm text-foreground/70 mt-4 whitespace-pre-line">{pkg.description}</p>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">€ {pkg.price}</div>
            <div className="text-xs text-foreground/60">pagabile mensilmente</div>
          </div>
          <a href={`?packageId=${pkg.id ?? ""}#booking`} className="btn-primary">
          <span className="text-center">Prenota</span>
        </a>
        </div>
      </div>
    </dialog>
  );
}


