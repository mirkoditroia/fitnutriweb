// Script per aggiornare Firebase con la nuova struttura resultsSection
// Esegui questo dal browser console sull'admin panel

console.log('🔄 Aggiornamento struttura resultsSection in Firebase...');

// Funzione per aggiornare il siteContent
async function updateFirebaseWithResultsSection() {
  try {
    // Carica il contenuto esistente
    const response = await fetch('/api/admin/migrate-results-section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'add_results_section'
      })
    });
    
    if (response.ok) {
      console.log('✅ Struttura resultsSection aggiunta con successo!');
      console.log('🔄 Ricarica la pagina per vedere i cambiamenti...');
      window.location.reload();
    } else {
      console.error('❌ Errore nell\'aggiornamento:', await response.text());
    }
  } catch (error) {
    console.error('❌ Errore di rete:', error);
  }
}

// Esegui l'aggiornamento
updateFirebaseWithResultsSection();
