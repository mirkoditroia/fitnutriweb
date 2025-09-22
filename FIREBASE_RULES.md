# 🔐 Regole di Sicurezza Firebase

## ✅ STATO ATTUALE: REGOLE BILANCIATE

**SICUREZZA**: Le regole attuali permettono lettura pubblica ma richiedono autenticazione per le modifiche.

## Panoramica
Le regole Firebase sono configurate per permettere la lettura pubblica di tutti i dati (necessario per il funzionamento del sito web) ma richiedono autenticazione per qualsiasi modifica (protezione dell'area admin).

## 📋 Regole Attuali (BILANCIATE)

### **Tutte le Collezioni**
- ✅ **Lettura**: Pubblica (chiunque può leggere)
- 🔒 **Scrittura**: Solo utenti autenticati (richiede login admin)

### **Vantaggi di questa configurazione:**
- ✅ **Sito funzionante**: Tutti i dati sono leggibili pubblicamente
- 🔒 **Area admin protetta**: Solo utenti loggati possono modificare
- ⚡ **Performance**: Nessun problema di caricamento
- 🛡️ **Sicurezza**: Protezione contro modifiche non autorizzate

## 📋 Dettagli delle Regole

### 1. **Prenotazioni (`/bookings/{bookingId}`)**
- ✅ **Lettura**: Pubblica (chiunque può leggere)
- 🔒 **Creazione/Modifica/Eliminazione**: Solo utenti autenticati

### 2. **Pacchetti (`/packages/{packageId}`)**
- ✅ **Lettura**: Pubblica (per visualizzazione sul sito)
- 🔒 **Creazione/Modifica/Eliminazione**: Solo utenti autenticati

### 3. **Contenuto Sito (`/siteContent/{contentId}`)**
- ✅ **Lettura**: Pubblica (per visualizzazione sul sito)
- 🔒 **Creazione/Modifica/Eliminazione**: Solo utenti autenticati

### 4. **Clienti (`/clients/{clientId}`)**
- ✅ **Lettura**: Pubblica (se necessario per il sito)
- 🔒 **Creazione/Modifica/Eliminazione**: Solo utenti autenticati

### 5. **Immagini (`/uploads/{allPaths=**}`)**
- ✅ **Lettura**: Pubblica (per visualizzazione sul sito)
- 🔒 **Upload/Modifica/Eliminazione**: Solo utenti autenticati

### 6. **Altre Collezioni**
- ✅ **Lettura**: Pubblica
- 🔒 **Scrittura**: Solo utenti autenticati

## 👥 Autenticazione Richiesta

Per modificare i contenuti è necessario:
- ✅ **Essere autenticati**: Login tramite Firebase Auth
- ✅ **Email valida**: Qualsiasi utente con account Firebase
- 🔒 **Protezione**: Solo utenti loggati possono modificare dati

## 🚀 Come Deployare le Regole

### Metodo 1: Firebase CLI
```bash
# Assicurati di essere nella directory del progetto
cd demo

# Deploy delle regole
firebase deploy --only firestore:rules
```

### Metodo 2: Firebase Console
1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto `your-project-id`
3. Vai su **Firestore Database** → **Regole**
4. Copia e incolla il contenuto di `firestore.rules`
5. Clicca **Pubblica**

## ⚠️ Note Importanti

### Sicurezza
- Le regole sono basate sull'email dell'utente autenticato
- Solo gli admin autorizzati possono modificare i dati
- I dati pubblici (pacchetti, contenuto) sono leggibili da chiunque

### Manutenzione
- Per aggiungere nuovi admin, modifica l'array delle email autorizzate
- Per nuove collezioni, aggiungi regole specifiche
- Testa sempre le regole prima del deploy in produzione

### Backup
- Le regole sono versionate nel repository
- Mantieni sempre un backup delle regole funzionanti

## 🔧 Troubleshooting

### Errore "Permission denied"
- Verifica che l'utente sia autenticato
- Controlla che l'email sia nella lista degli admin autorizzati
- Verifica che le regole siano state deployate correttamente

### Test delle Regole
```bash
# Test locale delle regole
firebase emulators:start --only firestore
```

## 📚 Risorse Utili
- [Documentazione Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Firebase Console](https://console.firebase.google.com)
