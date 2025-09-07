"use client";
import { useEffect, useState } from "react";
import { getSiteContent, upsertSiteContent, type SiteContent } from "@/lib/datasource";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function AdminGoogleReviewsPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const fieldCls = "bg-white text-black placeholder:text-black/70 border-foreground/30";

  useEffect(() => {
    getSiteContent().then((c) => {
      console.log("🔄 CARICAMENTO Google Reviews config:", c?.googleReviews);
      
      const finalContent = c ? {
        ...c,
        googleReviews: c.googleReviews ?? {
          enabled: true,
          title: "⭐ Recensioni Google",
          subtitle: "Cosa dicono i nostri clienti",
          businessName: "GZ Nutrition",
          fallbackReviews: []
        }
      } : null;
      
      setContent(finalContent);
      setLoading(false);
    }).catch(error => {
      console.error("❌ Errore caricamento:", error);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!content) return;

    console.log("💾 SALVATAGGIO Google Reviews config:", content.googleReviews);
    
    try {
      await upsertSiteContent(content);
      
      toast.success(`✅ Configurazione Google Reviews salvata!`, {
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
        }
      });
      
      console.log("✅ SALVATAGGIO Google Reviews completato");
      
    } catch (error) {
      console.error("❌ Errore salvataggio:", error);
      toast.error("❌ Errore nel salvataggio");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
  return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Errore nel caricamento</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">⭐ Google Reviews</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci le recensioni Google del tuo sito - Widget o recensioni manuali
          </p>
        </div>
        <Button onClick={save} disabled={!content}>
          💾 Salva Modifiche
        </Button>
      </div>

      <div className="space-y-8">
        {/* Abilita/Disabilita */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="googleReviewsEnabled"
              checked={content.googleReviews?.enabled ?? true}
              onChange={(e) => setContent({
                ...content,
                googleReviews: {
                  ...content.googleReviews,
                  enabled: e.target.checked
                }
              })}
              className="w-5 h-5 text-primary"
            />
            <label htmlFor="googleReviewsEnabled" className="text-lg font-medium">
              🌟 Mostra sezione Google Reviews sul sito
            </label>
          </div>
          
          {content.googleReviews?.enabled && (
            <div className="pl-8 border-l-2 border-primary/20 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">📝 Titolo sezione</label>
                  <input
                    type="text"
                    value={content.googleReviews?.title ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleReviews: {
                        ...content.googleReviews,
                        title: e.target.value
                      }
                    })}
                    placeholder="⭐ Recensioni Google"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">📄 Sottotitolo</label>
                  <input
                    type="text"
                    value={content.googleReviews?.subtitle ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleReviews: {
                        ...content.googleReviews,
                        subtitle: e.target.value
                      }
                    })}
                    placeholder="Cosa dicono i nostri clienti"
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">🏢 Nome del tuo business</label>
                <input
                  type="text"
                  value={content.googleReviews?.businessName ?? ""}
                  onChange={(e) => setContent({
                    ...content,
                    googleReviews: {
                      ...content.googleReviews,
                      businessName: e.target.value
                    }
                  })}
                  placeholder="GZ Nutrition"
                  className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Widget vs Recensioni Manuali */}
        {content.googleReviews?.enabled && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">🎯 Modalità Recensioni</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="widgetMode"
                  name="reviewMode"
                  checked={!!(content.googleReviews?.embedCode && content.googleReviews?.embedCode.trim())}
                  onChange={() => {
                    if (!content.googleReviews?.embedCode) {
                      setContent({
                        ...content,
                        googleReviews: {
                          ...content.googleReviews,
                          embedCode: "<!-- Inserisci qui il codice del widget -->"
                        }
                      });
                    }
                  }}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="widgetMode" className="font-medium">
                  🎨 Widget Google Reviews (Automatico, senza API)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="manualMode"
                  name="reviewMode"
                  checked={!(content.googleReviews?.embedCode && content.googleReviews?.embedCode.trim())}
                  onChange={() => {
                    setContent({
                      ...content,
                      googleReviews: {
                        ...content.googleReviews,
                        embedCode: ""
                      }
                    });
                  }}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="manualMode" className="font-medium">
                  📝 Recensioni manuali (Inserite da admin)
                </label>
              </div>
            </div>

            {/* Widget Section */}
            {!!(content.googleReviews?.embedCode && content.googleReviews?.embedCode.trim()) && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-black mb-3">🎨 Configurazione Widget</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    📌 Codice Embed Widget
                  </label>
                  <textarea
                    rows={4}
                    value={content.googleReviews?.embedCode ?? ""}
                    onChange={(e) => setContent({
                      ...content,
                      googleReviews: {
                        ...content.googleReviews,
                        embedCode: e.target.value
                      }
                    })}
                    placeholder='<div class="elfsight-app-abc123"></div><script src="https://static.elfsight.com/platform/platform.js"></script>'
                    className={`w-full px-3 py-2 border border-border rounded-md ${fieldCls} font-mono text-sm`}
                  />
                  <div className="mt-2 text-sm text-black/70">
                    <strong>📋 Come ottenere il widget:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>Opzione A:</strong> Google My Business → Marketing → Recensioni → Widget</li>
                      <li><strong>Opzione B:</strong> Elfsight.com → Google Reviews Widget (gratuito)</li>
                      <li><strong>Opzione C:</strong> Trustmary.com → Google Reviews Widget</li>
                      <li><strong>✅ Risultato:</strong> Recensioni vere senza API, auto-aggiornate</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
                  <span className="text-green-700 font-medium">✅ Widget Attivo - Le recensioni del widget sostituiranno quelle manuali</span>
                </div>
              </div>
            )}

            {/* Manual Reviews Section */}
            {!(content.googleReviews?.embedCode && content.googleReviews?.embedCode.trim()) && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-black">
                    📝 Recensioni manuali: {content.googleReviews?.fallbackReviews?.length || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newReview = {
                        id: Date.now().toString(),
                        name: "",
                        rating: 5,
                        text: "",
                        date: new Date().toISOString().split('T')[0],
                        source: "fallback" as const
                      };
                      setContent({
                        ...content,
                        googleReviews: {
                          ...content.googleReviews,
                          fallbackReviews: [...(content.googleReviews?.fallbackReviews || []), newReview]
                        }
                      });
                    }}
                    className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90"
                  >
                    + Aggiungi Recensione
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {(content.googleReviews?.fallbackReviews || []).map((review, index) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Nome</label>
                          <input
                            type="text"
                            value={review.name}
                            onChange={(e) => {
                              const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                              updatedReviews[index] = { ...review, name: e.target.value };
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            placeholder="Mario Rossi"
                            className={`w-full px-2 py-1 text-sm border border-border rounded ${fieldCls}`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">Stelle</label>
                          <select
                            value={review.rating}
                            onChange={(e) => {
                              const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                              updatedReviews[index] = { ...review, rating: parseInt(e.target.value) };
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            className={`w-full px-2 py-1 text-sm border border-border rounded ${fieldCls}`}
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                            <option value={4}>⭐⭐⭐⭐ (4)</option>
                            <option value={3}>⭐⭐⭐ (3)</option>
                            <option value={2}>⭐⭐ (2)</option>
                            <option value={1}>⭐ (1)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-xs font-medium mb-1">Recensione</label>
                        <textarea
                          rows={2}
                          value={review.text}
                          onChange={(e) => {
                            const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                            updatedReviews[index] = { ...review, text: e.target.value };
                            setContent({
                              ...content,
                              googleReviews: {
                                ...content.googleReviews,
                                fallbackReviews: updatedReviews
                              }
                            });
                          }}
                          placeholder="Esperienza fantastica, lo consiglio!"
                          className={`w-full px-2 py-1 text-sm border border-border rounded ${fieldCls}`}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Data</label>
                          <input
                            type="date"
                            value={review.date}
                            onChange={(e) => {
                              const updatedReviews = [...(content.googleReviews?.fallbackReviews || [])];
                              updatedReviews[index] = { ...review, date: e.target.value };
                              setContent({
                                ...content,
                                googleReviews: {
                                  ...content.googleReviews,
                                  fallbackReviews: updatedReviews
                                }
                              });
                            }}
                            className={`px-2 py-1 text-sm border border-border rounded ${fieldCls}`}
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const updatedReviews = (content.googleReviews?.fallbackReviews || []).filter((_, i) => i !== index);
                            setContent({
                              ...content,
                              googleReviews: {
                                ...content.googleReviews,
                                fallbackReviews: updatedReviews
                              }
                            });
                          }}
                          className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          🗑️ Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {(!content.googleReviews?.fallbackReviews || content.googleReviews?.fallbackReviews.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <p>Nessuna recensione manuale.</p>
                      <p className="text-sm">Clicca "Aggiungi Recensione" per iniziare.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 Come funziona</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>🎨 Widget:</strong> Recensioni vere da Google, aggiornamento automatico, zero configurazione API</li>
            <li><strong>📝 Manuali:</strong> Controllo completo, perfette per demo o quando non hai ancora recensioni Google</li>
            <li><strong>🔄 Priorità:</strong> Se attivi il widget, le recensioni manuali vengono nascoste automaticamente</li>
            <li><strong>🚀 Consiglio:</strong> Inizia con recensioni manuali, poi passa al widget quando hai recensioni Google reali</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
