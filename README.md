# GZnutrition — Piattaforma Nutrizionista

Stack completo: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Firebase (Firestore + Storage)**

## 🚀 Quick Start

### Prerequisiti
- **Node.js 20+** (richiesto per deploy Firebase)
- Account Firebase con progetto configurato

### Installazione

```bash
# 1. Installa dipendenze
npm install

# 2. Configura environment
cp .env.example .env.local
# Popola i valori Firebase nel file .env.local

# 3. Avvia development server
npm run dev
```

🌐 **URL Development**: `http://localhost:3000`  
🔧 **Admin Panel**: `http://localhost:3000/admin?key=admin123`

## 🔧 Modalità di Data

Il sistema supporta 3 modalità configurabili via `NEXT_PUBLIC_DATA_MODE`:

### 🏠 `local` (Development)
- **Storage**: localStorage + file JSON locali in `.data/`
- **Uso**: Development locale e testing
- **Persistenza**: Dati salvati localmente, persi solo con reset manuale

### 📁 `demo` (Pre-production)
- **Storage**: File statici in `/public/demo/`
- **Uso**: Demo su GitHub Pages o altri hosting statici
- **Caratteristiche**: Read-only, perfetto per showcasing

### ☁️ `firebase` (Production)
- **Storage**: Firebase Firestore + Storage
- **Uso**: Production con dati persistenti
- **Caratteristiche**: Scalabile, backup automatico, real-time

## ⚙️ Environment Variables

```bash
# Data Mode
NEXT_PUBLIC_DATA_MODE=local  # local | demo | firebase

# Firebase (solo per modalità 'firebase')
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Admin Access
ADMIN_ACCESS_KEY=admin123

# Trustpilot (opzionale)
TRUSTPILOT_API_KEY=
TRUSTPILOT_BUSINESS_ID=
```

## 🛠️ Scripts NPM

```bash
npm run dev        # Development server
npm run build      # Build produzione
npm run start      # Start build produzione
npm run lint       # ESLint check
npm run typecheck  # TypeScript check
npm run format     # Prettier format
```

## 📱 Admin Panel

**URL**: `/admin?key=ADMIN_ACCESS_KEY`

### 📋 Gestione Prenotazioni
- **Visualizza** tutte le richieste con dettagli completi
- **Conferma/Rifiuta** prenotazioni con aggiornamento stato
- **Gestione slot**: slot confermati vengono automaticamente rimossi dalla disponibilità

### 📦 Gestione Pacchetti  
- CRUD completo: titolo, descrizione, prezzo, immagine, badge
- Toggle attivo/disattivo, flag "featured"
- Upload immagini (locale/Firebase Storage)

### 📅 Disponibilità
- Generatore slot automatico con intervalli configurabili
- Calendar picker per selezione date
- Gestione orari (inizio, fine, intervallo)

### 🏠 Contenuti Landing
- Hero section: titolo, sottotitolo, CTA
- Sezione "Chi sono": titolo, immagine, descrizione
- FAQ: CRUD completo domande/risposte
- Galleria immagini con slider

## 🎨 Design System

**Palette Colori**:
- 🟢 Primary: `#00D084` (neon wellness green)
- 🔴 Accent: `#FF6B6B` (CTA red)  
- ⚫ Dark: `#0E0F12` (deep dark)
- ⚪ Light: `#F7F9FB` (clean light)

**Principi UX**:
- 📱 Mobile-first responsive design
- ♿ Accessibilità: contrasto 4.5:1, focus ring, ARIA labels
- ⚡ Performance: ottimizzato per mobile, lazy loading
- 🎯 Target: giovani adulti 20-35 focalizzati su fitness/wellness

## 🚀 Deploy Firebase

```bash
# 1. Build del progetto
npm run build

# 2. Login Firebase
npx firebase login

# 3. Deploy (include Firestore rules + hosting)
npx firebase deploy

# 4. Configura environment produzione
# Imposta NEXT_PUBLIC_DATA_MODE=firebase nelle env vars di Firebase
```

### Firestore Rules
Le regole sono automaticamente deployate da `firestore.rules`:
- **Packages, Content, Availability**: Read pubblico, Write solo admin
- **Bookings, Clients**: Read/Write aperto (da restringere con auth in futuro)

## 🧪 Testing & QA

### Checklist Manual Testing
- [ ] 📱 Responsive design su mobile/tablet/desktop
- [ ] 🎨 Palette colori corretta in tutte le sezioni  
- [ ] ♿ Focus ring visibile su navigazione keyboard
- [ ] 📋 Form prenotazione: validazione + submit + toast
- [ ] 🔧 Admin: tutte le sezioni CRUD funzionanti
- [ ] 📦 Pacchetti: scroll a form + precompilazione
- [ ] 📅 Disponibilità: generazione slot + rimozione su conferma
- [ ] 🌐 Switch modalità: local ↔ firebase funzionante

### Performance Targets
- 📊 Lighthouse Mobile: ≥90 Performance, ≥95 Accessibility
- ⚡ First Contentful Paint: <2.5s
- 📱 Mobile responsiveness: tutte le breakpoint

---

**Target Audience**: Giovani adulti 20-35 orientati a trasformazione fisica, estetica e performance  
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Firebase, React Hook Form, Zod validation
