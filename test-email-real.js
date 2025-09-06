// ✅ TEST FINALE API EMAIL CLIENTE CON CREDENZIALI REALI
// Password recuperata da Firebase: luvuupdxynysdgxu

const testBooking = {
  id: 'test-finale-123',
  name: 'Test Cliente GZ',
  email: 'mirkoditroia@gmail.com', // Email di test
  phone: '+39 393 421 69 001',
  date: '2024-01-15',
  slot: '10:00',
  location: 'online',
  isFreeConsultation: true
};

const testPayload = {
  booking: testBooking,
  packageTitle: 'Consultazione Gratuita (10 minuti)',
  businessName: 'GZ Nutrition',
  colorPalette: 'gz-default',
  customMessage: 'Grazie per aver prenotato con GZ Nutrition! Ti contatteremo al più presto per confermare i dettagli del tuo appuntamento.',
  siteContent: {
    contactPhone: '+39 393 421 69 001',
    contactEmail: 'zamboninutrition@gmail.com',
    contactAddresses: [
      {
        name: 'Studio Principale',
        address: 'Corso Garibaldi 123',
        city: 'Milano',
        postalCode: '20121'
      }
    ],
    businessName: 'GZ Nutrition'
  }
};

async function testEmailAPIFinal() {
  console.log('🧪 TEST FINALE: API Email Cliente con credenziali reali');
  console.log('📧 Email destinatario:', testBooking.email);
  console.log('🔑 Credenziali SMTP: fitnutriweb@gmail.com');
  console.log('');
  
  try {
    console.log('📤 Inviando richiesta all\'API...');
    
    const response = await fetch('http://localhost:3000/api/email/client-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    
    console.log('\n📋 RISULTATO:');
    console.log('Status HTTP:', response.status);
    console.log('Success:', result.success);
    console.log('Sent to:', result.sentTo);
    console.log('Email ID:', result.emailId);
    console.log('Message:', result.message);
    
    if (result.success) {
      console.log('\n🎉 SUCCESSO! Email di conferma inviata!');
      console.log('✅ Il cliente dovrebbe aver ricevuto un\'email elegante con:');
      console.log('   - Conferma prenotazione personalizzata');
      console.log('   - Dettagli appuntamento');
      console.log('   - Contatti dello studio');
      console.log('   - Design coerente con la palette del sito');
      console.log('\n🔥 FEATURE COMPLETAMENTE FUNZIONANTE!');
    } else {
      console.log('\n❌ ERRORE:', result.message);
    }
    
  } catch (error) {
    console.error('\n💥 ERRORE DURANTE IL TEST:', error.message);
    if (error.message.includes('fetch failed')) {
      console.log('ℹ️  Assicurati che il server sia avviato su localhost:3000');
      console.log('💡 Esegui: npm run dev');
    }
  }
}

testEmailAPIFinal();
