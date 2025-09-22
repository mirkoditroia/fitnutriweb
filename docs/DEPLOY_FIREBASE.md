# 🚀 Guida Deploy Firebase

Questa guida contiene le istruzioni complete per il deploy del progetto Demo su Firebase.

## 📋 Prerequisiti

- Node.js 18+ installato
- Firebase CLI installato (`npm install -g firebase-tools`)
- Account Firebase configurato
- Progetto Firebase creato

## 🔧 Setup Iniziale

### 1. Login a Firebase
```bash
firebase login
```

### 2. Inizializzazione progetto
```bash
firebase init
```

Seleziona:
- ✅ Hosting
- ✅ Firestore
- ✅ Functions

### 3. Configurazione ambiente
```bash
# Installa dipendenze
npm install

# Installa dipendenze per Functions
cd functions
npm install
cd ..
```

## 🚀 Deploy Completo

### Deploy di tutto il progetto
```bash
firebase deploy
```

### Deploy selettivo

#### Solo Hosting
```bash
firebase deploy --only hosting
```

#### Solo Functions
```bash
firebase deploy --only functions
```

#### Solo Firestore Rules
```bash
firebase deploy --only firestore:rules
```

#### Solo Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

## 🔐 Configurazione Admin

### 1. Impostare l'admin tramite UID

* Vai su **Firebase Console → Authentication → Users** e copia l'UID dell'utente admin
* Apri **Cloud Shell** e incolla questo script sostituendo `INSERISCI_TUO_UID`:

```bash
node -e "
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
initializeApp({ credential: applicationDefault() });
getAuth().setCustomUserClaims('INSERISCI_TUO_UID', { isAdmin: true })
  .then(() => console.log('✅ isAdmin assegnato con successo'))
  .catch(console.error);
"
```

⚠️ **Importante**: Dopo aver eseguito questo script, fai logout/login per aggiornare i token dell'utente.

### 2. Verifica permessi admin

Puoi verificare che i permessi admin siano stati assegnati correttamente controllando il token JWT dell'utente o testando l'accesso alle funzionalità admin.

## 🔒 Aggiornamento regole Firestore

### 1. Login a Firebase
```bash
firebase login
```

### 2. Impostare l'admin tramite UID

* Vai su **Firebase Console → Authentication → Users** e copia l'UID dell'utente admin
* Apri **Cloud Shell** e incolla questo script sostituendo `INSERISCI_TUO_UID`:

```bash
node -e "
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
initializeApp({ credential: applicationDefault() });
getAuth().setCustomUserClaims('INSERISCI_TUO_UID', { isAdmin: true })
  .then(() => console.log('✅ isAdmin assegnato con successo'))
  .catch(console.error);
"
```

⚠️ Dopo averlo eseguito, fai logout/login per aggiornare i token dell'utente.

### 3. Deploy delle regole

* Per pubblicare **solo** le regole Firestore:

```bash
firebase deploy --only firestore:rules
```

* Per deploy completo del progetto:

```bash
firebase deploy
```

## 📁 Struttura File

```
demo/
├── firebase.json          # Configurazione Firebase
├── firestore.rules        # Regole di sicurezza Firestore
├── firestore.indexes.json # Indici Firestore
├── functions/             # Cloud Functions
│   ├── index.js
│   └── package.json
└── docs/
    └── DEPLOY_FIREBASE.md # Questa guida
```

## 🛡️ Regole di Sicurezza

Le regole Firestore sono configurate in `firestore.rules` e includono:

- **Bookings**: Creazione/aggiornamento pubblico, lettura/cancellazione solo admin
- **Clients**: Creazione/aggiornamento pubblico, lettura/cancellazione solo admin  
- **Packages**: Lettura pubblica, scrittura solo admin
- **Availability**: Lettura pubblica, scrittura con validazione
- **Content**: Lettura pubblica, scrittura solo admin
- **ClientProgress**: Accesso solo admin
- **Uploads**: Lettura pubblica, scrittura solo admin

## 🔍 Troubleshooting

### Errore di autenticazione
```bash
firebase logout
firebase login
```

### Errore di permessi
Verifica che l'utente abbia il claim `isAdmin: true` e che sia stato fatto logout/login.

### Errore di deploy
```bash
# Verifica configurazione
firebase projects:list

# Verifica regole
firebase firestore:rules:get
```

## 📞 Supporto

Per problemi di deploy o configurazione, consulta:
- [Documentazione Firebase](https://firebase.google.com/docs)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
