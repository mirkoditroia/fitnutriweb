# 🏗️ Architettura Google Calendar - GZnutrition

## 📐 Schema Architetturale

### **Architettura Sicura Implementata**

```
User Browser
    ↓
Next.js Frontend (Firebase Hosting)
    ↓
/api/calendar/route.ts (Proxy)
    ↓
Firebase Functions (Secure Environment)
    ↓
Google Calendar API
```

---

## 🔒 Problema Risolto

### **Problema Originale**
- Next.js su Firebase Hosting NON può accedere a environment variables sensibili
- Firebase Functions v2 NON supporta `functions.config()`
- Credenziali Google Calendar non accessibili in modo sicuro

### **Soluzione Implementata**
1. **Proxy Pattern**: Next.js inoltra richieste a Firebase Functions
2. **Firebase Secrets**: Credenziali sicure solo in Functions
3. **Public Functions**: Functions accessibili via HTTPS

---

## 📁 File di Sistema

### **Frontend (Next.js)**
- `src/app/api/calendar/route.ts` - **Proxy** alle Firebase Functions
- `src/lib/googleCalendar.ts` - Interfaccia frontend per UI

### **Backend (Firebase Functions)**
- `functions/index.js` - **Logic sicura** con Firebase Secrets
  - `testCalendarConnection()` - Test connessione
  - `calendarOperations()` - CRUD eventi

---

## 🔧 Configurazione Tecnica

### **Firebase Functions (functions/index.js)**
```javascript
// Definizione Secrets
const googleClientEmail = defineSecret('GOOGLE_CLIENT_EMAIL');
const googlePrivateKey = defineSecret('GOOGLE_PRIVATE_KEY');

// Functions configurate per accesso pubblico
exports.testCalendarConnection = onRequest({ 
  cors: { origin: true },
  invoker: 'public',
  secrets: [googleClientEmail, googlePrivateKey]
}, async (req, res) => {
  // Accesso sicuro ai secrets
  const email = googleClientEmail.value();
  const key = googlePrivateKey.value();
});
```

### **Next.js Proxy (src/app/api/calendar/route.ts)**
```typescript
// URLs Firebase Functions pubbliche
const CALENDAR_FUNCTIONS = {
  test: 'https://testcalendarconnection-URL.run.app',
  operations: 'https://calendaroperations-URL.run.app'
};

// Proxy alle Functions
async function callFirebaseFunction(url: string, data?: any) {
  const response = await fetch(url, {
    method: data ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });
  return response.json();
}
```

---

## 🛡️ Sicurezza

### **Livelli di Sicurezza**
1. **Firebase Secrets**: Credenziali Google mai esposte
2. **Public Functions**: Accessible ma senza credenziali in chiaro
3. **Proxy Pattern**: Next.js non gestisce credenziali sensibili
4. **CORS Configuration**: Accesso controllato dalle Functions

### **Best Practices Implementate**
- ✅ Credenziali SOLO in Firebase Secrets
- ✅ Functions pubbliche per accessibilità
- ✅ Proxy per separazione delle responsabilità
- ✅ Error handling robusto
- ✅ Logging per troubleshooting

---

## 🔄 Flusso Operativo

### **Test Connessione**
1. User → Admin Panel "Test Connessione"
2. Frontend → `/api/calendar?action=test`
3. Next.js Proxy → Firebase Function `testCalendarConnection`
4. Function → Google Calendar API (con secrets)
5. Response ← Chain completa

### **Creazione Evento**
1. User → Conferma prenotazione
2. Frontend → `/api/calendar` (POST con event data)
3. Next.js Proxy → Firebase Function `calendarOperations`
4. Function → Google Calendar API `events.insert`
5. Event created ← Sincronizzazione completa

---

## 🐛 Debug e Monitoring

### **Log Functions**
```bash
firebase functions:log
```

### **Test Diretto Functions**
```bash
curl https://testcalendarconnection-URL.run.app
curl -X POST https://calendaroperations-URL.run.app -d '{"action":"test"}'
```

### **Monitoring Points**
- Firebase Functions logs
- Next.js API routes responses  
- Google Calendar API quotas
- Error handling nei proxy

---

## 🚀 Deploy Process

### **Functions Update**
```bash
# 1. Configurazione secrets
firebase functions:secrets:set GOOGLE_CLIENT_EMAIL
firebase functions:secrets:set GOOGLE_PRIVATE_KEY

# 2. Deploy functions
firebase deploy --only functions

# 3. Deploy frontend
firebase deploy
```

### **Verification**
```bash
# Test functions directly
curl https://testcalendarconnection-URL.run.app

# Check logs
firebase functions:log
```

---

## 📈 Vantaggi Architettura

### **Sicurezza**
- Credenziali mai esposte al frontend
- Secrets gestiti da Firebase
- Accesso controllato e loggato

### **Scalabilità**
- Functions serverless auto-scaling
- Proxy pattern separazione responsabilità
- Easy maintenance e update

### **Reliability**
- Error handling robusto
- Fallback mechanisms
- Comprehensive logging

---

**Data**: Gennaio 2025  
**Versione**: 2.0  
**Stato**: Produzione attiva
