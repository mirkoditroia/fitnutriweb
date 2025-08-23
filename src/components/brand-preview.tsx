import { palette, spacing, fontScale } from "@/lib/brand";

export function BrandPreview() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold">Palette</h2>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(palette).map(([key, value]) => (
            <div key={key} className="card p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: value }} aria-label={key} />
              <div className="text-sm">
                <div className="font-medium">{key}</div>
                <div className="text-foreground/70">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Spacing (px)</h2>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(spacing).map(([key, value]) => (
            <div key={key} className="card p-4">
              <div className="text-sm font-medium">{key}</div>
              <div className="text-foreground/70">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Font scale (px)</h2>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(fontScale).map(([key, value]) => (
            <div key={key} className="card p-4">
              <div className="text-sm font-medium">{key}</div>
              <div className="text-foreground/70">{value}</div>
              <p style={{ fontSize: value }} className="mt-2">Aa GZnutrition</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


