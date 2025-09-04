import { NextRequest, NextResponse } from 'next/server';
import { getSiteContent, upsertSiteContent } from '@/lib/datasource';

export async function POST(request: NextRequest) {
  try {
    // Carica il contenuto esistente
    const existingContent = await getSiteContent();
    
    if (!existingContent) {
      return NextResponse.json({ error: 'Nessun contenuto esistente trovato' }, { status: 404 });
    }

    // Controlla se resultsSection esiste già
    if (existingContent.resultsSection) {
      return NextResponse.json({ 
        message: 'resultsSection già presente',
        isEnabled: existingContent.resultsSection.isEnabled,
        photos: existingContent.resultsSection.photos?.length || 0
      });
    }

    // Aggiungi la struttura resultsSection mancante
    const updatedContent = {
      ...existingContent,
      resultsSection: {
        isEnabled: false,
        title: "🎯 Risultati dei Nostri Clienti",
        subtitle: "Trasformazioni reali di persone reali. Questi sono alcuni dei successi raggiunti insieme.",
        photos: []
      }
    };

    // Salva il contenuto aggiornato
    await upsertSiteContent(updatedContent);

    return NextResponse.json({ 
      success: true, 
      message: 'Struttura resultsSection aggiunta con successo!' 
    });

  } catch (error) {
    console.error('Errore nella migrazione:', error);
    return NextResponse.json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}
