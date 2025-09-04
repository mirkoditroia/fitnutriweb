# 🥗 GZ Nutrition Website

Un sistema completo di gestione prenotazioni per nutrizionisti con integrazione email, calendario e admin panel.

## 🚀 Quick Start

### Sviluppo Locale
```bash
# 1. Clona e installa
git clone https://github.com/[USERNAME]/gznutrition-website.git
cd gznutrition-website/gznutrition
npm install

# 2. Avvia sviluppo
npm run dev

# 3. Apri http://localhost:3000
```

### Modalità Data
- **🔧 Locale**: `localStorage` (automatico in sviluppo)
- **🌐 Demo**: File JSON statici (Render pre-produzione)  
- **🚀 Firebase**: Database reale (produzione)

## 📁 Struttura Progetto

```
gznutrition/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── admin/          # Panel amministrativo
│   │   ├── api/            # API endpoints
│   │   └── globals.css     # Stili globali + Palette
│   ├── components/         # Componenti React
│   │   ├── BookingForm.tsx # Form prenotazioni + CAPTCHA
│   │   ├── navbar.tsx      # Navigation
│   │   └── ui/            # Componenti base
│   └── lib/               # Logica business
│       ├── data.ts        # Firebase integration
│       ├── datasource.ts  # Data abstraction layer
│       ├── palettes.ts    # Sistema colori
│       └── directState.ts # State management
├── functions/             # Firebase Functions
│   └── index.js          # Email + Calendar + CAPTCHA
├── public/
│   └── demo/             # Dati demo per pre-produzione
└── DEPLOYMENT_GUIDE.md  # Guida completa deploy
```

## ✨ Funzionalità

### 👤 Cliente
- 📱 Form prenotazione responsive
- 🎨 Selezione pacchetti con modal
- 📅 Calendario interattivo disponibilità
- 🏢 Scelta sede (online/studio)
- 🔒 Protezione CAPTCHA anti-spam
- 💳 Visualizzazione prezzi e sconti

### 🏥 Nutrizionista (Admin)
- 📊 Dashboard prenotazioni
- ✅ Conferma/rifiuta appuntamenti
- 👥 Gestione clienti automatica
- 📧 Email notifiche configurabili
- 📅 Sincronizzazione Google Calendar
- 🎨 Personalizzazione contenuti e colori
- ⚙️ Configurazioni avanzate

### 🔧 Sistema
- 🔄 Multi-environment (local/demo/prod)
- 📨 Email automatiche con template HTML
- 📅 Google Calendar API integration
- 🔒 reCAPTCHA v2 verification
- 🎨 Sistema palette colori configurabile
- 📱 Responsive design completo

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: Firebase Firestore
- **Backend**: Firebase Functions
- **Email**: Nodemailer + Gmail SMTP
- **Calendar**: Google Calendar API
- **Security**: reCAPTCHA v2
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS + CSS Custom Properties

## 📦 Dipendenze Principali

```json
{
  "dependencies": {
    "next": "15.5.0",
    "react": "^18.0.0",
    "firebase": "^10.7.0",
    "react-hook-form": "^7.48.0",
    "react-google-recaptcha": "^3.1.0",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0"
  }
}
```

## 🚀 Deploy

### Pre-produzione (Render)
- **URL**: `https://app-name.onrender.com`
- **Data**: Demo files from `/public/demo/`
- **Features**: Form + Admin read-only

### Produzione (Firebase)
- **URL**: `https://project-id.web.app`
- **Data**: Firebase Firestore
- **Features**: Complete system + integrations

📖 **Guida completa**: Vedi [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## ⚙️ Configurazione

### Email (Firebase Functions)
```bash
firebase functions:secrets:set SMTP_PASSWORD
# Gmail App Password (16 chars)
```

### Google Calendar
```bash
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT --data-file="service-account.json"
```

### reCAPTCHA
```bash
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
# Google reCAPTCHA Secret Key
```

## 🎨 Personalizzazione

### Palette Colori
5 palette predefinite configurabili da admin:
- **GZ Default**: Verde natura
- **Modern Blue**: Blu professionale  
- **Elegant Dark**: Grigio scuro elegante
- **Nature Green**: Verde intenso
- **Warm Orange**: Arancione caldo

### Contenuti
Tutto personalizzabile da `/admin/content`:
- Hero section + CTA
- Pacchetti e prezzi
- Sezioni informative
- FAQ dinamiche
- Dettagli contatto

## 🔐 Sicurezza

- ✅ **reCAPTCHA v2**: Anti-spam per form
- ✅ **Firebase Security Rules**: Accesso controllato
- ✅ **Environment Variables**: Credenziali sicure
- ✅ **HTTPS Only**: Comunicazioni criptate
- ✅ **Admin Authentication**: Accesso riservato

## 📊 Admin Panel

### Sezioni Disponibili
- 📈 **Dashboard**: Panoramica prenotazioni
- 📅 **Prenotazioni**: Gestione completa appuntamenti
- 👥 **Clienti**: Database clienti automatico
- 📦 **Pacchetti**: Gestione offerte e prezzi
- 📝 **Contenuti**: Personalizzazione sito
- ⚙️ **Impostazioni**: Email, Calendar, CAPTCHA

### Accesso Admin
- **URL**: `/admin`
- **Auth**: Sistema integrato Next.js
- **Responsive**: Ottimizzato mobile

## 🐛 Troubleshooting

### Build Errors
```bash
# Clean e rebuild
rm -rf .next
npm run build
```

### Firebase Issues
```bash
# Re-login e re-deploy
firebase login
firebase use your-project-id
firebase deploy
```

### Email Non Funziona
1. Verifica Gmail App Password (non password account)
2. Controlla Firebase Functions logs: `firebase functions:log`
3. Testa configurazione da admin panel

### Calendar Non Sincronizza
1. Verifica Service Account permissions
2. Controlla Calendar ID in configurazione
3. Assicurati che calendar sia condiviso con Service Account

## 📞 Supporto

### Log e Debug
```bash
# Firebase Functions
firebase functions:log

# Browser Console
F12 → Console tab

# Render Logs
Dashboard → Logs section
```

### Performance
- **Lighthouse**: Score target > 90
- **Core Web Vitals**: Optimized
- **Mobile First**: Responsive design

## 🔄 Updates

Per aggiornare il sistema:
1. Backup database: `gcloud firestore export`
2. Test su branch feature
3. Deploy su pre-produzione
4. Verify functionality  
5. Deploy produzione

## 📋 Checklist Go-Live

- [ ] Firebase project configurato
- [ ] Email SMTP testata
- [ ] Google Calendar collegato
- [ ] reCAPTCHA configurato
- [ ] Admin panel testato
- [ ] Mobile responsive verificato
- [ ] Performance ottimizzata
- [ ] Backup configurato

## 📄 Licenza

Proprietario: GZ Nutrition
Versione: 1.0
Data: Gennaio 2025

---

**🚀 Pronto per il deploy!** 

Per istruzioni dettagliate vedi [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)