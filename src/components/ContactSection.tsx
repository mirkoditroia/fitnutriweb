"use client";

interface ContactInfo {
  title?: string;
  subtitle?: string;
  phone: string;
  email: string;
  addresses: Array<{
    name: string;
    address: string;
    city: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  socialChannels?: Array<{
    platform: string;
    url: string;
    icon: string;
    logoUrl?: string;
  }>;
  // Nuovi campi per personalizzare la sezione studi
  studiosTitle?: string; // Titolo della sezione studi (default: "🏢 I Nostri Studi")
  studiosSubtitle?: string; // Sottotitolo della sezione studi
  contactTitle?: string; // Titolo della sezione contatti (default: "💬 Contatti Diretti")
  contactSubtitle?: string; // Sottotitolo della sezione contatti
}

interface ContactSectionProps {
  contactInfo: ContactInfo;
}

export function ContactSection({ contactInfo }: ContactSectionProps) {
  // Debug: log delle informazioni ricevute
  console.log("ContactSection - contactInfo ricevuto:", contactInfo);
  console.log("ContactSection - phone:", contactInfo.phone);
  console.log("ContactSection - phone type:", typeof contactInfo.phone);
  console.log("ContactSection - phone length:", contactInfo.phone?.length);

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const openGoogleMaps = (address: string, coordinates?: { lat: number; lng: number }) => {
    let mapsUrl: string;
    
    if (coordinates) {
      // Se abbiamo coordinate precise, usiamo quelle
      mapsUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    } else {
      // Altrimenti usiamo l'indirizzo testuale
      const encodedAddress = encodeURIComponent(address);
      mapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
    }
    
    window.open(mapsUrl, '_blank');
  };

  // Controllo se il telefono è valido (non vuoto e non solo spazi)
  const isValidPhone = contactInfo.phone && contactInfo.phone.trim().length > 0;

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20 border-t border-foreground/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {contactInfo.title || "📞 Contattami"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {contactInfo.subtitle || "Siamo qui per aiutarti nel tuo percorso verso una vita più sana. Contattaci per qualsiasi domanda o per prenotare una consulenza."}
          </p>
        </div>

        <div className={`grid gap-8 max-w-6xl mx-auto ${
          (contactInfo.phone || contactInfo.email || (contactInfo.socialChannels && contactInfo.socialChannels.length > 0)) && 
          (contactInfo.addresses && contactInfo.addresses.length > 0) 
            ? 'grid-cols-1 lg:grid-cols-2' 
            : 'grid-cols-1'
        }`}>
          {/* Informazioni di Contatto */}
          {(contactInfo.phone || contactInfo.email || (contactInfo.socialChannels && contactInfo.socialChannels.length > 0)) && (
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                {contactInfo.contactTitle || "💬 Contatti Diretti"}
              </h3>
              
              <div className="space-y-6">
                {/* Telefono */}
                {isValidPhone && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefono</p>
                      <button
                        onClick={() => openWhatsApp(contactInfo.phone)}
                        className="text-lg font-semibold text-green-600 hover:text-green-700 transition-colors cursor-pointer"
                      >
                        {contactInfo.phone}
                      </button>
                    </div>
                  </div>
                )}

                {/* Debug info - rimuovi in produzione */}
                {!isValidPhone && (
                  <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded">
                    <p><strong>Debug - Numero di telefono mancante:</strong></p>
                    <p>contactInfo.phone: &quot;{contactInfo.phone}&quot;</p>
                    <p>Tipo: {typeof contactInfo.phone}</p>
                    <p>Lunghezza: {contactInfo.phone?.length || 0}</p>
                    <p>Trim length: {contactInfo.phone?.trim().length || 0}</p>
                  </div>
                )}

                {/* Email */}
                {contactInfo.email && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✉️</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Canali Social */}
                {contactInfo.socialChannels && contactInfo.socialChannels.length > 0 && (
                  <div className={`pt-4 ${(contactInfo.phone || contactInfo.email) ? 'border-t border-border' : ''}`}>
                    <p className="text-sm text-muted-foreground mb-3">Seguici sui social</p>
                    <div className="flex gap-3">
                      {contactInfo.socialChannels.map((social, index) => (
                        <a
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors text-xl overflow-hidden"
                          aria-label={social.platform}
                          title={social.platform}
                        >
                          {social.logoUrl ? (
                            <img src={social.logoUrl} alt={social.platform} className="w-6 h-6 object-contain" />
                          ) : (
                            <span>{social.icon || "🔗"}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Studi Fisici */}
          {contactInfo.addresses && contactInfo.addresses.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                {contactInfo.studiosTitle || "🏢 I Nostri Studi"}
              </h3>
              
              {contactInfo.studiosSubtitle && (
                <p className="text-muted-foreground mb-6 text-center">
                  {contactInfo.studiosSubtitle}
                </p>
              )}

              <div className="space-y-4">
                {contactInfo.addresses.map((location, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      const fullAddress = `${location.address}, ${location.city} ${location.postalCode}`;
                      openGoogleMaps(fullAddress, location.coordinates);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📍</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {location.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {location.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {location.city} {location.postalCode}
                        </p>
                      </div>
                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="text-sm">🗺️</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Bottom - RIMOSSO */}
      </div>
    </section>
  );
}
