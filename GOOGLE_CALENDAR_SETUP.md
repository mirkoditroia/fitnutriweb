# 📅 Manuale Configurazione Google Calendar - GZnutrition

## Panoramica
Questo manuale ti guiderà attraverso la configurazione completa dell'integrazione Google Calendar per il sistema GZnutrition. L'integrazione permette di sincronizzare automaticamente le prenotazioni confermate con Google Calendar.

## 🎯 Funzionalità
- ✅ Creazione automatica eventi per prenotazioni confermate
- ✅ Aggiornamento eventi quando le prenotazioni vengono modificate
- ✅ Eliminazione eventi quando le prenotazioni vengono cancellate
- ✅ Sincronizzazione bidirezionale tra sistema e Google Calendar
- ✅ Accesso diretto al calendario dall'admin panel

## 📋 Prerequisiti
- Account Google con accesso a Google Calendar
- Progetto Google Cloud Platform configurato
- Service Account con permessi per Google Calendar API

---

## 🔧 Configurazione Google Cloud Platform

### 1. Creazione Progetto Google Cloud
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita la fatturazione per il progetto

### 2. Abilitazione Google Calendar API
1. Nel menu laterale, vai su **"API e servizi" > "Libreria"**
2. Cerca "Google Calendar API"
3. Clicca su **"Google Calendar API"** e poi **"Abilita"**

### 3. Creazione Service Account
1. Vai su **"API e servizi" > "Credenziali"**
2. Clicca **"+ Crea credenziali" > "Account di servizio"**
3. Compila i campi:
   - **Nome**: `gznutrition-calendar-service`
   - **ID**: `gznutrition-calendar-service`
   - **Descrizione**: `Service account per integrazione Google Calendar`
4. Clicca **"Crea e continua"**
5. **Salta** i passaggi di autorizzazione e clicca **"Fatto"**

### 4. Generazione Chiave Privata
1. Clicca sull'account di servizio appena creato
2. Vai alla tab **"Chiavi"**
3. Clicca **"+ Aggiungi chiave" > "Crea nuova chiave"**
4. Seleziona **"JSON"** e clicca **"Crea"**
5. **Salva il file JSON** in un posto sicuro

### 5. Condivisione Calendario
1. Vai su [Google Calendar](https://calendar.google.com/)
2. Crea un nuovo calendario o usa uno esistente
3. Clicca sui **3 punti** accanto al calendario
4. Seleziona **"Impostazioni e condivisione"**
5. Scorri fino a **"Condividi con persone specifiche"**
6. Aggiungi l'email del service account (es: `gznutrition-calendar-service@progetto.iam.gserviceaccount.com`)
7. Imposta i permessi su **"Modifica eventi e gestisci la condivisione"**
8. Clicca **"Invia"**

---

## ⚙️ Configurazione Sistema GZnutrition

### 1. Accesso Admin Panel
1. Vai su `/admin` del tuo sito
2. Clicca sulla card **"Google Calendar"**
3. Clicca **"⚙️ Configurazione"**

### 2. Impostazioni Calendario
Compila i seguenti campi:

#### **Abilita sincronizzazione Google Calendar**
- ✅ Spunta la casella per abilitare l'integrazione

#### **Calendar ID**
- Inserisci l'ID del calendario Google
- Formato: `xxxxxxxxxxxxxxxx@group.calendar.google.com`
- **Come trovarlo**: 
  1. Vai su Google Calendar
  2. Clicca sui 3 punti accanto al calendario
  3. "Impostazioni e condivisione"
  4. Copia l'ID del calendario

#### **Timezone**
- Inserisci: `Europe/Rome`
- Altri formati supportati: `Europe/London`, `America/New_York`, etc.

#### **Service Account Email**
- Inserisci l'email del service account creato
- Formato: `nome@progetto.iam.gserviceaccount.com`

### 3. Configurazione Variabili d'Ambiente

#### **Per Sviluppo Locale (.env.local)**
```bash
GOOGLE_CLIENT_EMAIL=nome@progetto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GCAL_CALENDAR_ID=xxxxxxxxxxxxxxxx@group.calendar.google.com
GCAL_TIMEZONE=Europe/Rome
GCAL_ENABLED=true
```

#### **Per Render.com (Produzione)**
1. Vai su [Render Dashboard](https://dashboard.render.com/)
2. Seleziona il tuo servizio
3. Vai su **"Environment"**
4. Aggiungi le variabili:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GCAL_CALENDAR_ID`
   - `GCAL_TIMEZONE`
   - `GCAL_ENABLED`

#### **Per Firebase Functions**
```bash
firebase functions:config:set google.client_email="nome@progetto.iam.gserviceaccount.com"
firebase functions:config:set google.private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
firebase functions:config:set gcal.calendar_id="xxxxxxxxxxxxxxxx@group.calendar.google.com"
firebase functions:config:set gcal.timezone="Europe/Rome"
firebase functions:config:set gcal.enabled="true"
```

---

## 🔑 Gestione Chiave Privata

### **Formato Corretto**
La chiave privata deve essere nel formato PEM corretto:
```
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

### **Problemi Comuni**
- ❌ **Errore DECODER**: La chiave non è nel formato corretto
- ❌ **Chiave non valida**: Mancano le righe BEGIN/END
- ❌ **Permessi insufficienti**: Service account non ha accesso al calendario

### **Soluzioni**
1. **Verifica formato**: Assicurati che la chiave inizi e finisca correttamente
2. **Escape caratteri**: In alcuni sistemi potresti dover usare `\n` per le nuove righe
3. **Base64 encoding**: Se necessario, codifica la chiave in Base64

---

## 🧪 Test Integrazione

### 1. Test Connessione
1. Vai su **Admin Panel > Google Calendar**
2. Clicca **"📅 Test Connessione"**
3. Verifica che appaia **"✅ Connessione Riuscita"**

### 2. Test Sincronizzazione
1. Crea una prenotazione di test
2. Cambia lo status in **"Confermata"**
3. Verifica che l'evento appaia su Google Calendar
4. Modifica la prenotazione e verifica l'aggiornamento
5. Cancella la prenotazione e verifica la rimozione

### 3. Verifica Eventi
Gli eventi su Google Calendar includono:
- **Titolo**: Nome cliente + tipo consulenza
- **Descrizione**: Dettagli completi della prenotazione
- **Orario**: Data e slot selezionati
- **Metadati**: ID prenotazione per sincronizzazione

---

## 🚨 Risoluzione Problemi

### **Errore 500 - Server Error**
- Verifica le variabili d'ambiente
- Controlla i log del server
- Verifica i permessi del service account

### **Eventi non sincronizzati**
- Controlla che `GCAL_ENABLED=true`
- Verifica il Calendar ID
- Controlla i permessi di condivisione

### **Errori di autenticazione**
- Verifica l'email del service account
- Controlla la chiave privata
- Assicurati che l'API sia abilitata

### **Problemi di timezone**
- Verifica il formato timezone (es: `Europe/Rome`)
- Controlla che il calendario Google abbia lo stesso timezone

---

## 📱 Utilizzo

### **Accesso Rapido**
- **Admin Panel**: Card "Google Calendar" con pulsante principale
- **Prenotazioni**: Barra sempre visibile con accesso diretto
- **Mobile**: FAB fisso per accesso rapido

### **Gestione Eventi**
- Gli eventi vengono creati automaticamente per prenotazioni confermate
- Le modifiche si sincronizzano in tempo reale
- Gli eventi cancellati vengono rimossi automaticamente

### **Monitoraggio**
- Controlla lo stato della connessione nell'admin panel
- Verifica la sincronizzazione nelle prenotazioni
- Monitora i log per eventuali errori

---

## 🔒 Sicurezza

### **Best Practices**
- ✅ Mantieni private le chiavi del service account
- ✅ Usa calendari dedicati per l'integrazione
- ✅ Limita i permessi del service account
- ✅ Monitora regolarmente l'accesso

### **Rotazione Chiavi**
- Cambia periodicamente le chiavi private
- Aggiorna le variabili d'ambiente
- Testa la connessione dopo ogni cambio

---

## 📞 Supporto

### **Documentazione**
- [Google Calendar API](https://developers.google.com/calendar)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Functions](https://firebase.google.com/docs/functions)

### **Contatti**
Per problemi tecnici o supporto:
- Controlla i log del sistema
- Verifica la configurazione
- Testa la connessione passo per passo

---

## ✅ Checklist Configurazione

- [ ] Progetto Google Cloud creato
- [ ] Google Calendar API abilitata
- [ ] Service Account creato
- [ ] Chiave privata generata
- [ ] Calendario condiviso con service account
- [ ] Variabili d'ambiente configurate
- [ ] Integrazione abilitata nel sistema
- [ ] Test connessione riuscito
- [ ] Test sincronizzazione completato
- [ ] Accesso diretto funzionante

---

**Ultimo aggiornamento**: Agosto 2024  
**Versione**: 1.0  
**Sistema**: GZnutrition Admin Panel
