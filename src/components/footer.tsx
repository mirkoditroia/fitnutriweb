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
  const companyName = legalInfo?.companyName || "GZnutrition";
  const footerText = legalInfo?.footerText;
  const showLegalLinks = legalInfo?.showLegalLinks !== false; // Default true

  return (
    <footer className="border-t border-foreground/10 mt-16">
      <div className="container py-8 text-sm text-foreground/70">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright e informazioni aziendali */}
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} {companyName}</p>
            {footerText && (
              <p className="mt-1 text-xs text-foreground/60">{footerText}</p>
            )}
            {legalInfo?.vatNumber && (
              <p className="mt-1 text-xs text-foreground/60">
                P.IVA: {legalInfo.vatNumber}
              </p>
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
              {legalInfo?.privacyPolicyUrl && (
                <a 
                  href={legalInfo.privacyPolicyUrl} 
                  className="hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              )}
              {legalInfo?.cookiePolicyUrl && (
                <a 
                  href={legalInfo.cookiePolicyUrl} 
                  className="hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cookie Policy
                </a>
              )}
              {legalInfo?.termsOfServiceUrl && (
                <a 
                  href={legalInfo.termsOfServiceUrl} 
                  className="hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Termini di Servizio
                </a>
              )}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}


