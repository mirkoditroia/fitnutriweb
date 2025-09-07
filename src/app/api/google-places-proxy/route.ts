import { NextResponse } from 'next/server';

// ✅ API Proxy per Google Places - evita CORS e protegge API key
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('place_id');
    const apiKey = searchParams.get('api_key');
    
    console.log("🌐 Google Places Proxy chiamato:", { placeId, hasApiKey: !!apiKey });
    
    if (!placeId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing place_id or api_key parameter' }, 
        { status: 400 }
      );
    }
    
    // Costruisci URL Google Places API
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
    
    console.log("📡 Chiamata a Google Places API...");
    
    // Chiamata all'API Google Places
    const response = await fetch(googleUrl);
    
    if (!response.ok) {
      console.error("❌ Errore Google Places API:", response.status, response.statusText);
      return NextResponse.json(
        { error: `Google Places API Error: ${response.status}` }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log("📥 Risposta Google Places ricevuta:", data.status);
    
    // Verifica status della risposta Google
    if (data.status !== 'OK') {
      console.error("❌ Google Places Status Error:", data.status, data.error_message);
      return NextResponse.json({
        status: data.status,
        error_message: data.error_message || 'Unknown Google Places error',
        result: null
      }, { status: 400 });
    }
    
    // Filtra e pulisci i dati sensibili
    const cleanData = {
      status: data.status,
      result: {
        reviews: data.result?.reviews || [],
        rating: data.result?.rating,
        user_ratings_total: data.result?.user_ratings_total
      }
    };
    
    console.log(`✅ Proxy: ${cleanData.result.reviews.length} recensioni recuperate`);
    
    // Restituisci i dati con cache headers
    return NextResponse.json(cleanData, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache per 1 ora
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error("❌ Errore Google Places Proxy:", error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: (error as Error).message 
      }, 
      { status: 500 }
    );
  }
}
