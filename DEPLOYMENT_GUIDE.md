# 🚀 Guida Completa al Deploy - GZ Nutrition Website

## 📋 Indice
1. [Panoramica dell'Architettura](#panoramica-dellarchitettura)
2. [Prerequisiti e Dipendenze](#prerequisiti-e-dipendenze)
3. [Configurazione degli Account](#configurazione-degli-account)
4. [Setup Firebase (Produzione)](#setup-firebase-produzione)
5. [Setup Render (Pre-produzione)](#setup-render-pre-produzione)
6. [Configurazione Email](#configurazione-email)
7. [Configurazione Google Calendar](#configurazione-google-calendar)
8. [Configurazione reCAPTCHA](#configurazione-recaptcha)
9. [Deploy e Testing](#deploy-e-testing)
10. [Troubleshooting](#troubleshooting)
11. [Checklist di Verifica](#checklist-di-verifica)

---

## 🏗️ Panoramica dell'Architettura

Il sito utilizza un'architettura ibrida con 3 modalità di data:

- **🔧 Locale (dev)**: `localStorage` per sviluppo rapido
- **🌐 Pre-produzione (Render)**: Dati demo da file JSON 
- **🚀 Produzione (Firebase)**: Database Firestore + Functions

### Stack Tecnologico
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: Firebase Firestore
- **Backend**: Firebase Functions (Node.js)
- **Deploy**: Render (pre-prod) + Firebase Hosting (prod)
- **Email**: Nodemailer + SMTP Gmail
- **Calendar**: Google Calendar API
- **Security**: reCAPTCHA v2

---

## 📦 Prerequisiti e Dipendenze

### Software Richiesto
```bash
# Node.js versione 18+ LTS
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# Firebase CLI
npm install -g firebase-tools

# Git
git --version
```

### Dipendenze del Progetto
```json
{
  "dependencies": {
    "next": "15.5.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "firebase": "^10.7.0",
    "react-hook-form": "^7.48.0",
    "react-google-recaptcha": "^3.1.0",
    "@types/react-google-recaptcha": "^2.1.0",
    "zod": "^3.22.0",
    "date-fns": "^3.0.0",
    "@hookform/resolvers": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "15.5.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

### Firebase Functions Dipendenze
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "googleapis": "^128.0.0",
    "nodemailer": "^6.9.0"
  }
}
```

---

## 🔧 Configurazione degli Account

### 1. Account Google (Obbligatorio)
1. Crea un account Gmail per il business
2. Abilita autenticazione a 2 fattori
3. Genera password per app specifiche

### 2. Account Firebase
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Crea nuovo progetto
3. Abilita Firestore Database
4. Abilita Functions
5. Abilita Hosting

### 3. Account Render (Per pre-produzione)
1. Registrati su [Render](https://render.com/)
2. Connetti il repository GitHub
3. Configura auto-deploy dal branch `main`

### 4. Google Cloud Console
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto Firebase
3. Abilita Google Calendar API
4. Crea Service Account per Calendar
5. Genera chiavi JSON per Service Account

### 5. Google reCAPTCHA
1. Vai su [reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Registra nuovo sito (reCAPTCHA v2)
3. Ottieni Site Key e Secret Key

---

## 🔥 Setup Firebase (Produzione)

### 1. Inizializzazione Progetto
```bash
# Clona il repository
git clone https://github.com/[USERNAME]/gznutrition-website.git
cd gznutrition-website/gznutrition

# Installa dipendenze
npm install

# Login Firebase
firebase login

# Inizializza Firebase (se non già fatto)
firebase init
```

### 2. Configurazione Firestore
1. **Database Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access per demo data
    match /siteContent/{document} {
      allow read: true;
      allow write: if request.auth != null;
    }
    
    match /packages/{document} {
      allow read: true;
      allow write: if request.auth != null;
    }
    
    // Private data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. **Firestore Indexes** (`firestore.indexes.json`):
```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 3. Configurazione Firebase Functions
```bash
cd functions

# Installa dipendenze Functions
npm install

# Configura secrets
firebase functions:secrets:set SMTP_PASSWORD
firebase functions:secrets:set RECAPTCHA_SECRET_KEY

# Upload Service Account key
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT --data-file="path/to/service-account.json"
```

### 4. Variabili Environment Firebase
```bash
# Email configuration
firebase functions:config:set smtp.user="nome@gmail.com"
firebase functions:config:set smtp.from="noreply@tuodominio.com"
firebase functions:config:set notification.email="destinatario@gmail.com"

# Calendar configuration  
firebase functions:config:set calendar.service_account_email="xxx@xxx.iam.gserviceaccount.com"
firebase functions:config:set calendar.calendar_id="xxx@group.calendar.google.com"
```

### 5. Deploy Firebase
```bash
# Deploy tutto
firebase deploy

# Deploy solo Functions
firebase deploy --only functions

# Deploy solo Firestore rules
firebase deploy --only firestore:rules

# Deploy solo Hosting
firebase deploy --only hosting
```

---

## 🌐 Setup Render (Pre-produzione)

### 1. Configurazione Repository
1. Push del codice su GitHub
2. Connetti repository a Render
3. Configura auto-deploy

### 2. Configurazione Build Render
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: `18.17.0`
- **Root Directory**: `gznutrition`

### 3. Environment Variables Render
```bash
# Next.js configuration
NODE_ENV=production
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI

# Firebase config (se necessario)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 4. File di Configurazione
Assicurati che questi file siano presenti:
- `package.json` con script di build
- `next.config.js` configurato correttamente
- `.gitignore` che esclude file sensibili

---

## 📧 Configurazione Email

### 1. Setup Gmail SMTP
1. **Abilita 2FA** sull'account Gmail
2. **Genera App Password**:
   - Vai su Account Google → Sicurezza
   - App Password → Seleziona app "Altro"
   - Copia la password generata (16 caratteri)

### 2. Configurazione Firebase Secrets
```bash
# Imposta password SMTP sicura
firebase functions:secrets:set SMTP_PASSWORD
# Incolla la App Password di Gmail quando richiesto
```

### 3. Configurazione Email nel Codice
Le email sono configurate automaticamente tramite:
- **Default SMTP**: `smtp.gmail.com:587`
- **Authentication**: OAuth2 con App Password
- **From Address**: Configurabile da admin
- **To Address**: Configurabile da admin panel

### 4. Test Email
1. Vai su `/admin/settings`
2. Inserisci email notificazione
3. Clicca "Test Configurazione Email"
4. Clicca "Invia Email Test"

---

## 📅 Configurazione Google Calendar

### 1. Creazione Service Account
1. **Google Cloud Console**:
   - Vai su IAM & Admin → Service Accounts
   - Crea nuovo Service Account
   - Scarica chiave JSON

2. **Condividi Calendar**:
   - Apri Google Calendar
   - Crea calendario dedicato per prenotazioni
   - Condividi con Service Account email
   - Assegna permessi "Modifiche eventi"

### 3. Configurazione Firebase
```bash
# Upload Service Account (metodo sicuro)
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT --data-file="service-account.json"

# Oppure configura singoli valori
firebase functions:config:set calendar.service_account_email="xxx@xxx.iam.gserviceaccount.com"
firebase functions:config:set calendar.calendar_id="xxx@group.calendar.google.com"
```

### 4. Test Calendar Integration
1. Vai su `/admin/settings`
2. Configura Calendar Settings
3. Clicca "Test Connessione Calendar"
4. Verifica che il test passi

---

## 🔒 Configurazione reCAPTCHA

### 1. Setup Google reCAPTCHA
1. **Registra sito**:
   - Vai su [reCAPTCHA Console](https://www.google.com/recaptcha/admin)
   - Scegli reCAPTCHA v2 "I'm not a robot"
   - Aggiungi domini: `localhost`, `tuodominio.com`, `app-name.onrender.com`

2. **Ottieni chiavi**:
   - **Site Key**: Per frontend (pubblica)
   - **Secret Key**: Per backend (privata)

### 2. Configurazione Firebase
```bash
# Imposta Secret Key sicura
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
# Incolla la Secret Key quando richiesto
```

### 3. Configurazione Frontend
```bash
# .env.local (sviluppo)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI

# Render Environment Variables
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-real-site-key
```

### 4. Configurazione Admin
1. Vai su `/admin/settings`
2. Sezione "Sicurezza CAPTCHA"
3. Abilita CAPTCHA
4. Inserisci Site Key
5. Salva configurazione

---

## 🚀 Deploy e Testing

### 1. Deploy Pre-produzione (Render)
```bash
# 1. Push codice
git add .
git commit -m "Deploy to pre-production"
git push origin main

# 2. Render auto-deploy si attiva
# 3. Verifica su: https://app-name.onrender.com
```

### 2. Deploy Produzione (Firebase)
```bash
# 1. Build locale
npm run build

# 2. Deploy Firebase
firebase deploy

# 3. Verifica deploy
firebase hosting:channel:list

# 4. URL produzione: https://project-id.web.app
```

### 3. Testing Completo
1. **Funzionalità Base**:
   - [ ] Caricamento homepage
   - [ ] Visualizzazione pacchetti
   - [ ] Form prenotazione
   - [ ] Modal pacchetti

2. **Sistema Admin**:
   - [ ] Login admin (`/admin`)
   - [ ] Gestione prenotazioni
   - [ ] Gestione contenuti
   - [ ] Configurazioni

3. **Integrazioni**:
   - [ ] Email notifiche
   - [ ] Google Calendar sync
   - [ ] CAPTCHA verifica
   - [ ] Database sync

---

## 🔧 Troubleshooting

### Errori Comuni Firebase
```bash
# Error: Permission denied
firebase auth:login
firebase use your-project-id

# Error: Functions timeout
# Aumenta timeout in firebase.json:
{
  "functions": {
    "timeout": "60s"
  }
}

# Error: Firestore rules
firebase deploy --only firestore:rules
```

### Errori Comuni Render
```bash
# Build failure: Dependencies
# Verifica package.json e .nvmrc

# Runtime error: Environment variables
# Verifica tutte le env vars in Render dashboard

# Timeout: Build troppo lungo
# Ottimizza dependencies e build process
```

### Errori Email
```bash
# SMTP Auth failed
# Verifica App Password Gmail (non password account)

# Email non recevute
# Controlla spam folder
# Verifica Firebase Functions logs
```

### Errori Calendar
```bash
# 403 Forbidden
# Verifica Service Account permissions su Calendar

# Calendar not found
# Verifica Calendar ID corretto
# Controlla condivisione calendar
```

---

## ✅ Checklist di Verifica

### Pre-Deploy
- [ ] Dependencies installate correttamente
- [ ] Firebase project configurato
- [ ] Service Account creato e configurato
- [ ] Email SMTP testata
- [ ] reCAPTCHA keys generate
- [ ] Environment variables impostate
- [ ] Build locale successiva

### Post-Deploy Render
- [ ] App accessibile su URL Render
- [ ] Form prenotazione funzionante
- [ ] Admin panel accessibile
- [ ] Data mode "demo" attivo
- [ ] CAPTCHA funzionante (se abilitato)

### Post-Deploy Firebase
- [ ] App accessibile su URL Firebase
- [ ] Database Firestore funzionante
- [ ] Firebase Functions deployate
- [ ] Email notifications attive
- [ ] Google Calendar integration attiva
- [ ] Admin panel completo funzionante
- [ ] Backup automatici attivi

### Test Finali
- [ ] Prenotazione end-to-end
- [ ] Email ricevuta correttamente
- [ ] Evento creato in Calendar
- [ ] Admin può gestire prenotazioni
- [ ] Mobile responsive
- [ ] Performance acceptable (< 3s loading)

---

## 📞 Supporto e Manutenzione

### Log e Monitoraggio
```bash
# Firebase Functions logs
firebase functions:log

# Render logs
# Dashboard Render → Logs tab

# Browser console
# F12 → Console tab
```

### Backup e Recovery
```bash
# Backup Firestore
gcloud firestore export gs://backup-bucket

# Backup Firebase Functions
# Code già versioned in Git

# Backup configurazioni
# Esporta da Firebase Console
```

### Aggiornamenti
1. **Dipendenze**:
   - Aggiorna regolarmente dependencies
   - Testa su branch separato prima del merge

2. **Firebase**:
   - Monitora deprecation warnings
   - Aggiorna Functions runtime se necessario

3. **Security**:
   - Renuova App Passwords periodicamente
   - Aggiorna reCAPTCHA keys se necessario

---

## 💡 Note per Multi-Cliente

### Personalizzazione per Cliente
1. **Branding**:
   - Logo e colori configurabili da admin
   - Nome business personalizzabile
   - Palette colori predefinite

2. **Configurazioni**:
   - Email nutrizionista
   - Google Calendar dedicato
   - reCAPTCHA keys separate
   - Domini personalizzati

3. **Data Isolation**:
   - Firestore project separato per cliente
   - Functions deployment isolato
   - Backup separati

### Template Deployment
Considera di creare uno script di setup automatico che:
1. Crea nuovo progetto Firebase
2. Configura Firestore rules
3. Deploy Functions base
4. Setup Service Account
5. Configura email templates

---

**🚀 Fine Guida - Il tuo sistema è pronto per il deploy!**

Per supporto: [Contatta il developer]
Versione guida: 1.0 - Gennaio 2025
