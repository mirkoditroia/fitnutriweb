"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
// removed client content fetch for mode

const navigationItems = [
  { name: "Chi sono", href: "#chi-sono" },
  { name: "Pacchetti", href: "#pacchetti" },
  { name: "Prenota", href: "#booking" },
  { name: "Contatti", href: "#contatti" },
  { name: "Recensioni", href: "#recensioni" },
];

import { getSiteContent } from "@/lib/datasource";
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lightBg, setLightBg] = useState(false);
  type BrandCfg = { mode: "image"|"text"; imageUrl?: string; height?: number; autoBg?: boolean; text?: string; color?: string; weight?: number; size?: number };
  const [brand, setBrand] = useState<BrandCfg | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load branding info
  useEffect(() => {
    getSiteContent().then((c) => {
      const cfg: BrandCfg = {
        mode: c?.navbarLogoMode === 'image' ? 'image' : 'text',
        imageUrl: c?.navbarLogoImageUrl || undefined,
        height: typeof c?.navbarLogoHeight === 'number' ? c?.navbarLogoHeight : 24,
        autoBg: Boolean(c?.navbarLogoAutoRemoveBg),
        text: c?.navbarLogoText || 'GZnutrition',
        color: c?.navbarLogoTextColor || undefined,
        weight: typeof c?.navbarLogoTextWeight === 'number' ? c?.navbarLogoTextWeight : 700,
        size: typeof c?.navbarLogoTextSize === 'number' ? c?.navbarLogoTextSize : 18,
      };
      setBrand(cfg);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const toRgb = (value: string): [number, number, number] => {
      const v = value.trim();
      if (v.startsWith('#')) {
        const hex = v.slice(1);
        const h = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
        const num = parseInt(h, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      }
      const m = v.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
      return [247, 249, 251];
    };
    const relLum = ([r, g, b]: [number, number, number]) => {
      const f = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const [R, G, B] = [f(r), f(g), f(b)];
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--background') || '#ffffff';
    setLightBg(relLum(toRgb(bg)) > 0.5);
  }, []);

  // Fixed behavior controlled by palette/background only

  // Always dark glass navbar
  const headerClasses = 'bg-black/80 text-white backdrop-blur-xl border-b border-white/15 shadow-lg shadow-black/30';

  return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerClasses}`}>
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                {brand?.mode === "image" && brand?.imageUrl ? (
                  <img
                    src={brand.imageUrl}
                    alt="Logo"
                    style={{ height: `${brand.height}px` }}
                    className={`${brand.autoBg ? 'mix-blend-multiply' : ''}`}
                  />
                ) : (
                  <span
                    className="tracking-tight"
                    style={{ fontWeight: brand?.weight || 700, fontSize: brand?.size ? `${brand.size}px` : undefined, color: brand?.color || 'inherit' }}
                  >
                    {brand?.text || 'GZnutrition'}
                  </span>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <div className={`flex items-center gap-1 backdrop-blur-lg rounded-full p-2 border bg-white/10 border-white/20 text-white`}>
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full group text-white/85 hover:text-white hover:bg-white/15`}
                    >
                      <span className="relative z-10">{item.name}</span>
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${lightBg ? 'mix-blend-screen' : ''}`} />
                    </Link>
                  ))}
                </div>
                <Link
                  href="/admin"
                  className={`ml-4 px-3 py-1 text-xs transition-colors duration-200 rounded-md text-white/80 hover:text-white hover:bg-white/10`}
                >
                  Admin
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className={`md:hidden relative p-2 rounded-lg backdrop-blur-lg border transition-all duration-300 bg-black/40 border-white/15 text-white hover:bg-black/50`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                <div className="relative w-5 h-5">
                  <Menu className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                  <X className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
                </div>
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${
              isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className={`backdrop-blur-xl rounded-2xl mt-2 mb-4 shadow-lg bg-black border border-white/15 text-white`}>
                <nav className="p-4 space-y-2">
                  {navigationItems.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl group relative overflow-hidden text-white/85 hover:text-white hover:bg-white/10`}
                      onClick={() => setIsOpen(false)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="relative z-10">{item.name}</span>
                      <div className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300 ${lightBg ? 'mix-blend-screen' : ''}`} />
                    </Link>
                  ))}
                  <div className={`pt-2 mt-2 border-t border-white/15`}>
                    <Link
                      href="/admin"
                      className={`block px-4 py-2 text-xs transition-colors duration-200 rounded-lg text-white/80 hover:text-white hover:bg-white/10`}
                      onClick={() => setIsOpen(false)}
                    >
                      Admin
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </header>
  );
}


