# 🔐 Regole di Sicurezza Firebase

## Panoramica
Le regole Firebase sono state configurate per garantire la sicurezza del database Firestore, permettendo l'accesso pubblico solo ai dati necessari per il funzionamento del sito web, mentre proteggendo le operazioni amministrative.

## 📋 Regole Implementate

### 1. **Prenotazioni (`/bookings/{bookingId}`)**
- ✅ **Lettura**: Pubblica (chiunque può leggere)
- ✅ **Creazione**: Solo utenti autenticati
- 🔒 **Modifica/Eliminazione**: Solo admin autorizzati

### 2. **Pacchetti (`/packages/{packageId}`)**
- ✅ **Lettura**: Pubblica (per visualizzazione sul sito)
- 🔒 **Scrittura**: Solo admin autorizzati

### 3. **Contenuto Sito (`/siteContent/{contentId}`)**
- ✅ **Lettura**: Pubblica (per visualizzazione sul sito)
- 🔒 **Scrittura**: Solo admin autorizzati

### 4. **Clienti (`/clients/{clientId}`)**
- 🔒 **Accesso completo**: Solo admin autorizzati

### 5. **Immagini (`/uploads/{allPaths=**}`)**
- ✅ **Lettura**: Pubblica (per visualizzazione sul sito)
- 🔒 **Scrittura**: Solo admin autorizzati

### 6. **Altre Collezioni**
- 🔒 **Accesso completo**: Solo admin autorizzati

## 👥 Admin Autorizzati

Gli admin autorizzati sono identificati tramite email:
- `zamboninutrition@gmail.com`
- `impostazionizamboninutrition@gmail.com`

## 🚀 Come Deployare le Regole

### Metodo 1: Firebase CLI
```bash
# Assicurati di essere nella directory del progetto
cd gznutrition

# Deploy delle regole
firebase deploy --only firestore:rules
```

### Metodo 2: Firebase Console
1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto `gznutrition-d5d13`
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
