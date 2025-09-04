# ⚡ Quick Setup Guide - 15 Minuti per Cliente

Guida rapida per configurare il sito per un nuovo cliente in 15 minuti.

## 🎯 Checklist Pre-Setup (5 min)

**Prima di iniziare, prepara:**
- [ ] **Account Gmail** per il cliente (con 2FA attivo)
- [ ] **Progetto Firebase** creato
- [ ] **Google Calendar** dedicato creato
- [ ] **Service Account** Google Cloud creato
- [ ] **reCAPTCHA v2** registrato per domini cliente

## 🚀 Setup Automatico (10 min)

### 1. Clone e Preparazione (2 min)
```bash
# Clone repository
git clone https://github.com/[USERNAME]/gznutrition-website.git
cd gznutrition-website/gznutrition

# Installa dipendenze
npm install

# Installa Firebase CLI (se non già fatto)
npm install -g firebase-tools
```

### 2. Script Automatico (5 min)
```bash
# Avvia setup guidato
node setup.js
```

**Il script ti chiederà:**
- Nome cliente/studio
- Email nutrizionista  
- Dominio finale
- Firebase Project ID e keys
- Gmail App Password
- Google Calendar ID
- reCAPTCHA Site Key e Secret Key

### 3. Deploy Firebase (3 min)
```bash
# Entra nella cartella output
cd setup-output

# Esegui script generato
chmod +x firebase-setup.sh
./firebase-setup.sh
```

## ⚙️ Configurazioni Manuali Veloci

### Gmail App Password (1 min)
1. Gmail → Account Google → Sicurezza
2. Verifica in due passaggi → Password per le app
3. Seleziona "Altro" → Copia password 16 caratteri

### Google Calendar Setup (2 min)
1. Crea nuovo calendario dedicato
2. Impostazioni → Condividi → Aggiungi Service Account email
3. Permessi: "Modifiche eventi"
4. Copia Calendar ID dalle impostazioni

### reCAPTCHA Keys (1 min)
1. [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Nuovo sito → reCAPTCHA v2 "I'm not a robot"
3. Domini: `localhost`, `cliente-dominio.com`, `app-render.onrender.com`
4. Copia Site Key e Secret Key

## 🎨 Personalizzazione (Opzionale)

### Contenuti Base
1. Vai su `/admin/content`
2. Modifica:
   - Nome business
   - Pacchetti e prezzi
   - Sezioni informative
   - FAQ
   - Contatti

### Colori e Branding  
1. Vai su `/admin/content` → Sezione Colori
2. Scegli palette:
   - **GZ Default**: Verde natura
   - **Modern Blue**: Blu professionale
   - **Elegant Dark**: Grigio elegante
   - **Nature Green**: Verde intenso
   - **Warm Orange**: Arancione caldo

## ✅ Test Finale (2 min)

### Checklist Veloce
```bash
# 1. Test homepage
curl https://PROJECT-ID.web.app

# 2. Test admin
# Vai su /admin → verifica accesso

# 3. Test email  
# /admin/settings → "Invia Email Test"

# 4. Test calendar
# /admin/settings → "Test Connessione Calendar"

# 5. Test prenotazione
# Homepage → Compila form → Verifica email ricevuta
```

### URLs da Verificare
- **🌐 Homepage**: `https://PROJECT-ID.web.app`
- **🔧 Admin**: `https://PROJECT-ID.web.app/admin`
- **⚙️ Settings**: `https://PROJECT-ID.web.app/admin/settings`

## 🔧 Template Commands

### Setup Veloce Firebase
```bash
# Login e set project
firebase login
firebase use YOUR-PROJECT-ID

# Secrets in una volta
firebase functions:secrets:set SMTP_PASSWORD --value="GMAIL-APP-PASSWORD"
firebase functions:secrets:set RECAPTCHA_SECRET_KEY --value="RECAPTCHA-SECRET"  
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT --data-file="service-account.json"

# Deploy
firebase deploy
```

### Environment Variables Render
```bash
# Copia-incolla in Render Dashboard
NODE_ENV=production
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
```

## 🎯 Siti Multi-Cliente

### Repository Structure
```
gznutrition-template/          # Template base
├── cliente1/                  # Fork per cliente 1
├── cliente2/                  # Fork per cliente 2
└── setup-scripts/             # Script condivisi
```

### Workflow Efficiente
1. **Template Repository**: Mantieni aggiornato
2. **Fork per Cliente**: Crea fork dedicato
3. **Custom Config**: Personalizza solo configurazioni
4. **Deploy Separato**: Firebase project isolato

### Backup Strategy
```bash
# Backup configurazioni cliente
cp setup-output/* backups/cliente-name/

# Backup database
gcloud firestore export gs://backup-bucket/cliente-name/
```

## 💡 Pro Tips

### Script Personalizzazione
```javascript
// Modifica setup.js per defaults cliente
const DEFAULTS = {
  timeZone: 'Europe/Rome',
  currency: 'EUR',
  language: 'it-IT',
  theme: 'gz-default'
};
```

### Auto-Deploy
```yaml
# .github/workflows/deploy.yml
name: Auto Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

### Monitoring Script
```bash
#!/bin/bash
# health-check.sh
curl -f https://PROJECT-ID.web.app/api/health || exit 1
echo "✅ Site healthy"
```

## 🆘 Quick Fixes

### Email Non Funziona
```bash
# 1. Verifica App Password (non password account!)
# 2. Check Firebase Functions logs
firebase functions:log

# 3. Test SMTP manuale
node -e "console.log('Test email config')"
```

### Calendar Non Sincronizza
```bash
# 1. Verifica Service Account permissions
# 2. Test API manualmente
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://www.googleapis.com/calendar/v3/calendars/CALENDAR-ID/events"
```

### Build Fails
```bash
# Clean e rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## 🎉 Risultato Finale

**Tempo totale: ~15 minuti**

✅ **Sito funzionante con:**
- Form prenotazioni + CAPTCHA
- Email automatiche
- Google Calendar sync  
- Admin panel completo
- Personalizzazione colori
- Mobile responsive

✅ **URLs pronti:**
- **Homepage**: `https://PROJECT-ID.web.app`
- **Admin**: `https://PROJECT-ID.web.app/admin`

**🚀 Cliente pronto per raccogliere prenotazioni!**
