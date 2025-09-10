# 🚀 Deploy Google Calendar - Firebase Functions v2

## ⚠️ ISTRUZIONI CRITICHE PER NUOVI CLIENTI

### 📋 CHECKLIST PRE-DEPLOY (OBBLIGATORIO)

1. **NON usare mai `firebase functions:config:set` per credenziali**
2. **USA SEMPRE Firebase Secrets per GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY**
3. **Testa SEMPRE con `firebase functions:log` dopo ogni deploy**

---

## 🔧 SETUP RAPIDO NUOVO CLIENTE

### **1. Configurazione Google Cloud (Una volta per cliente)**
```bash
# Vai su Google Cloud Console
# 1. Crea Service Account
# 2. Genera chiave JSON
# 3. Abilita Google Calendar API
# 4. Condividi calendario con service account
```

### **2. Configurazione Firebase Secrets (CRITICO)**
```bash
# Nel progetto Firebase del cliente
firebase functions:secrets:set GOOGLE_CLIENT_EMAIL
# Inserisci: service-account@progetto.iam.gserviceaccount.com

firebase functions:secrets:set GOOGLE_PRIVATE_KEY
# Inserisci: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### **3. Configurazione Calendar ID**
```bash
firebase functions:config:set gcal.calendar_id="CALENDAR_ID_DEL_CLIENTE"
firebase functions:config:set gcal.timezone="Europe/Rome"
firebase functions:config:set gcal.enabled="true"
```

### **4. Deploy**
```bash
firebase deploy --only functions
```

### **5. Test Obbligatorio**
```bash
# Verifica log senza errori
firebase functions:log

# Test endpoint diretto
curl https://testcalendarconnection-URL.run.app
```

---

## 🚨 PROBLEMI COMUNI E SOLUZIONI

### **Errore: "functions.config() is no longer available"**
❌ **CAUSA**: Credentials in config invece che in secrets
✅ **SOLUZIONE**: 
```bash
firebase functions:secrets:set GOOGLE_CLIENT_EMAIL
firebase functions:secrets:set GOOGLE_PRIVATE_KEY
firebase deploy --only functions
```

### **Errore: "error:1E08010C:DECODER routines::unsupported"**
❌ **CAUSA**: Chiave privata formato sbagliato
✅ **SOLUZIONE**: Usa Firebase Secrets (mai hardcode)

### **Errore: "Forbidden"**
❌ **CAUSA**: Functions non pubbliche
✅ **SOLUZIONE**: Già risolto nel codice (invoker: public)

### **Errore 500 generico**
❌ **CAUSA**: Environment variables non configurate
✅ **SOLUZIONE**: 
1. Verifica Firebase Secrets
2. Controlla `firebase functions:log`
3. Testa endpoint diretto

---

## ✅ CHECKLIST POST-DEPLOY

- [ ] `firebase functions:log` senza errori
- [ ] Test endpoint: `curl https://testcalendarconnection-URL.run.app`
- [ ] Test dal sito admin panel
- [ ] Verifica eventi creati su Google Calendar
- [ ] Test sincronizzazione bidirezionale

---

## 📞 TROUBLESHOOTING

### **Commands utili**
```bash
# Log functions in tempo reale
firebase functions:log

# Verifica secrets configurati
firebase functions:secrets:access GOOGLE_CLIENT_EMAIL
firebase functions:secrets:access GOOGLE_PRIVATE_KEY

# Redeploy in caso di problemi
firebase deploy --only functions

# Test endpoint diretto
curl https://testcalendarconnection-URL.run.app
```

### **File critici da non modificare**
- `functions/index.js` (logica Firebase Secrets)
- `src/app/api/calendar/route.ts` (proxy Firebase Functions)

---

**RICORDA**: 
- ✅ Firebase Secrets per credenziali sensibili
- ✅ Config normale per dati non sensibili  
- ✅ Test sempre post-deploy
- ❌ Mai hardcode credenziali
- ❌ Mai usare functions.config() per secrets

**Ultimo aggiornamento**: Gennaio 2025  
**Versione**: 2.0 - Firebase Functions v2
