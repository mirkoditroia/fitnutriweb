import { BrandPreview } from "@/components/brand-preview";

export default function BrandPage() {
  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold">Brand Preview</h1>
      <p className="text-foreground/70 mt-2">
        Verifica palette, spacing e scala tipografica su light e dark mode.
      </p>
      <div className="mt-6">
        <BrandPreview />
      </div>
    </main>
  );
}


