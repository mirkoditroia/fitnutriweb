"use client";
import { useState, useEffect } from "react";
import { getPaletteConfig } from "@/lib/palettes";
import { getGoogleReviewsWithCache, type GoogleReview } from "@/lib/googlePlaces";

interface GoogleReviewsProps {
  title?: string;
  subtitle?: string;
  businessName?: string;
  placeId?: string;
  googleApiKey?: string;
  useRealReviews?: boolean;
  fallbackReviews?: GoogleReview[];
  lastFetched?: string;
  reviews?: GoogleReview[];
  colorPalette?: string;
  enabled?: boolean;
}

// Componente per mostrare le stelle
const StarRating = ({ rating, color }: { rating: number; color: string }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-5 h-5"
          fill={star <= rating ? color : "#E5E7EB"}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-600">
        {rating}.0
      </span>
    </div>
  );
};

// ✅ Componente ora usa Google Places API per recensioni vere

export default function GoogleReviews({
  title = "⭐ Recensioni Google",
  subtitle = "Cosa dicono i nostri clienti",
  businessName = "GZ Nutrition",
  placeId,
  googleApiKey,
  useRealReviews = true,
  fallbackReviews = [],
  lastFetched,
  reviews = [],
  colorPalette = "gz-default",
  enabled = true
}: GoogleReviewsProps) {
  // Non renderizzare se disabilitato
  if (!enabled) return null;

  // State per gestire recensioni e loading
  const [currentReviews, setCurrentReviews] = useState<GoogleReview[]>(reviews);
  const [loading, setLoading] = useState(false);
  const [reviewSource, setReviewSource] = useState<'google' | 'fallback' | 'unknown'>('unknown');

  // Ottieni colori della palette
  const paletteConfig = getPaletteConfig(colorPalette);
  const primary = paletteConfig?.primary || "#0B5E0B";
  const accent = paletteConfig?.accent || "#00D084";

  // ✅ Carica recensioni da Google Places API
  useEffect(() => {
    async function loadReviews() {
      console.log("🔄 GoogleReviews: Caricamento recensioni...", {
        useRealReviews,
        placeId,
        hasApiKey: !!googleApiKey,
        hasExistingReviews: currentReviews.length > 0
      });

      // Se non dobbiamo usare Google API, usa fallback
      if (!useRealReviews || !placeId) {
        console.log("📝 Uso recensioni fallback (API disabilitata o senza Place ID)");
        setCurrentReviews(fallbackReviews);
        setReviewSource('fallback');
        return;
      }

      // Se abbiamo già recensioni e non serve refresh, non ricaricare
      if (currentReviews.length > 0 && lastFetched) {
        const lastFetchTime = new Date(lastFetched).getTime();
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - lastFetchTime < oneHour) {
          console.log("📂 Uso recensioni in cache (meno di 1 ora)");
          setReviewSource(currentReviews[0]?.source === 'google' ? 'google' : 'fallback');
          return;
        }
      }

      setLoading(true);
      
      try {
        const result = await getGoogleReviewsWithCache(
          placeId, 
          googleApiKey, 
          lastFetched, 
          currentReviews
        );

        console.log("✅ Recensioni caricate:", result.reviews.length, "fonte:", result.reviews[0]?.source);
        setCurrentReviews(result.reviews);
        setReviewSource(result.reviews[0]?.source === 'google' ? 'google' : 'fallback');
        
      } catch (error) {
        console.error("❌ Errore caricamento recensioni:", error);
        console.log("🔄 Fallback alle recensioni predefinite");
        setCurrentReviews(fallbackReviews.length > 0 ? fallbackReviews : []);
        setReviewSource('fallback');
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [placeId, googleApiKey, useRealReviews, fallbackReviews]);

  // URL per aprire Google Reviews
  const googleReviewsUrl = placeId 
    ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
    : `https://www.google.com/search?q=${encodeURIComponent(businessName + " recensioni")}`;

  return (
    <section id="recensioni" className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              {subtitle}
            </p>
          )}
          
          {/* Google Badge e CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Google Rating Badge con fonte */}
            <div className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg border">
              {reviewSource === 'google' ? (
                <>
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
                    alt="Google" 
                    className="w-6 h-6"
                  />
                  <div className="flex items-center gap-2">
                    <StarRating rating={5} color={primary} />
                    <span className="text-sm text-gray-500">recensioni Google</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      ✅ Live
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">★</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={5} color={primary} />
                    <span className="text-sm text-gray-500">recensioni clienti</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      📝 Demo
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {/* CTA Recensioni */}
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              style={{ backgroundColor: primary }}
            >
              <span>📝 Scrivi una recensione</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary }}></div>
              <span className="text-gray-600">Caricamento recensioni Google...</span>
            </div>
          </div>
        )}

        {/* Reviews Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentReviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Header con avatar e info */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: primary }}
                >
                  {review.avatar ? (
                    <img 
                      src={review.avatar} 
                      alt={review.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">
                      {review.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Nome e data */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {review.name}
                  </h3>
                  {review.date && (
                    <p className="text-sm text-gray-500">
                      {review.date}
                    </p>
                  )}
                </div>
                
                {/* Google Icon */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
                  alt="Google" 
                  className="w-6 h-6 opacity-70"
                />
              </div>

              {/* Rating */}
              <div className="mb-4">
                <StarRating rating={review.rating} color={primary} />
              </div>

              {/* Testo recensione */}
              <blockquote className="text-gray-700 leading-relaxed">
                "{review.text}"
              </blockquote>
            </div>
          ))}
          </div>
        )}

        {/* Nessuna recensione */}
        {!loading && currentReviews.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Recensioni in arrivo
            </h3>
            <p className="text-gray-500">
              Le prime recensioni dei nostri clienti appariranno presto qui.
            </p>
          </div>
        )}

        {/* Footer con link Google */}
        <div className="text-center mt-12">
          <a
            href={googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>Vedi tutte le recensioni su</span>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
              alt="Google" 
              className="w-5 h-5"
            />
            <strong>Google</strong>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
