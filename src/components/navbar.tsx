"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navigationItems = [
  { name: "Chi sono", href: "#chi-sono" },
  { name: "Pacchetti", href: "#pacchetti" },
  { name: "Prenota", href: "#booking" },
  { name: "Recensioni", href: "#recensioni" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/10 dark:bg-black/10 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5'
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-extrabold tracking-tight text-xl">
            <span className="text-primary">GZ</span>nutrition
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <div className="flex items-center gap-1 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-full border border-white/20 dark:border-white/10 p-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-300 rounded-full hover:bg-white/20 dark:hover:bg-white/10 group"
                >
                  <span className="relative z-10">{item.name}</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              ))}
            </div>
            <Link
              href="/admin"
              className="ml-4 px-3 py-1 text-xs text-foreground/50 hover:text-foreground/70 transition-colors duration-200 rounded-md hover:bg-white/10 dark:hover:bg-white/5"
            >
              Admin
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative p-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
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
          <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 mt-2 mb-4 shadow-lg shadow-black/10">
            <nav className="p-4 space-y-2">
              {navigationItems.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-300 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 group relative overflow-hidden"
                  onClick={() => setIsOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="relative z-10">{item.name}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-white/20 dark:border-white/10">
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-xs text-foreground/50 hover:text-foreground/70 transition-colors duration-200 rounded-lg hover:bg-white/10 dark:hover:bg-white/5"
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


