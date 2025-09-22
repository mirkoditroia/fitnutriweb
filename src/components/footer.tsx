"use client";

import { useEffect, useState } from "react";
import { getSiteContent } from "@/lib/datasource";
import type { SiteContent } from "@/lib/data";

export function Footer() {
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    getSiteContent().then(setSiteContent);
  }, []);

  const legalInfo = siteContent?.legalInfo;
  const companyName = legalInfo?.companyName || siteContent?.businessName || "Demo";
  const footerText = legalInfo?.footerText;
  const showLegalLinks = legalInfo?.showLegalLinks !== false; // Default true

  return (
    <footer className="border-t border-foreground/10 mt-16">
      <div className="container py-8 text-sm text-foreground/70">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright e informazioni aziendali */}
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} {companyName}</p>
            {legalInfo?.vatNumber && (
              <p className="mt-1 text-sm font-medium text-foreground/80">
                P.IVA: {legalInfo.vatNumber}
              </p>
            )}
            {footerText && (
              <p className="mt-1 text-xs text-foreground/60">{footerText}</p>
            )}
            {legalInfo?.taxCode && (
              <p className="mt-1 text-xs text-foreground/60">
                CF: {legalInfo.taxCode}
              </p>
            )}
          </div>

          {/* Link legali */}
          {showLegalLinks && (
            <nav className="flex flex-wrap justify-center sm:justify-end gap-4 text-xs">
              <a 
                href="/privacy" 
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="/cookies" 
                className="hover:text-primary transition-colors"
              >
                Cookie Policy
              </a>
              <a 
                href="/terms" 
                className="hover:text-primary transition-colors"
              >
                Termini di Servizio
              </a>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}


