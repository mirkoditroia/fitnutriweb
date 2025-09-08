# 🔐 Configurazione Autenticazione Admin

## Panoramica

Il sistema di autenticazione admin utilizza **Firebase Authentication** per garantire un accesso sicuro all'area amministrativa. Questa implementazione sostituisce il sistema di chiavi semplici precedente con un'autenticazione robusta basata su email e password.

## 🚀 Setup Iniziale

### 1. Configurazione Firebase

Assicurati che Firebase sia configurato correttamente nel progetto:

```bash
# Verifica che le variabili d'ambiente siano impostate
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Abilitazione Firebase Authentication

Nel Firebase Console:
1. Vai su **Authentication** > **Sign-in method**
2. Abilita **Email/Password** come provider
3. Configura le regole di sicurezza se necessario

### 3. Creazione Primo Admin

1. Vai su `/admin/setup` nel browser
2. Compila il form con:
   - **Nome Admin**: Nome visualizzato
   - **Email**: Email per l'accesso
   - **Password**: Password sicura (min. 6 caratteri)
   - **Conferma Password**: Ripeti la password
3. Clicca "Crea Account Admin"

## 🔑 Accesso Admin

### Login
1. Vai su qualsiasi route `/admin/*`
2. Inserisci email e password
3. Clicca "Accedi"

### Logout
- Clicca il pulsante "🚪 Logout" nell'header admin
- La sessione viene chiusa automaticamente

## 🛡️ Sicurezza

### Caratteristiche di Sicurezza
- **Autenticazione Firebase**: Gestione sicura delle credenziali
- **Sessione persistente**: Login automatico al ritorno
- **Protezione route**: Tutte le route admin sono protette
- **Logout sicuro**: Chiusura completa della sessione

### Best Practices
- Usa password forti e uniche
- Non condividere le credenziali admin
- Logout quando finisci di lavorare
- Monitora gli accessi nel Firebase Console

## 🔧 Gestione Account

### Creazione Account Aggiuntivi
- Usa la pagina `/admin/setup` per creare nuovi admin
- Ogni admin ha accesso completo al sistema

### Recupero Password
- Usa la funzione "Password dimenticata" di Firebase
- Configura email di recupero nel Firebase Console

## 📁 Struttura File

```
src/
├── components/
│   ├── AdminLogin.tsx          # Componente login
│   ├── AdminProtected.tsx      # Protezione route
│   └── AdminHeader.tsx         # Header con logout
├── hooks/
│   └── useAuth.ts              # Hook autenticazione
└── app/admin/
    ├── layout.tsx              # Layout protetto
    └── setup/
        ├── layout.tsx          # Layout setup (non protetto)
        └── page.tsx            # Pagina creazione admin
```

## 🚨 Troubleshooting

### Problemi Comuni

**"Firebase non configurato"**
- Verifica le variabili d'ambiente
- Controlla la configurazione in `src/lib/firebase.ts`

**"Email già in uso"**
- L'account esiste già
- Usa un'email diversa o recupera la password

**"Password troppo debole"**
- Usa almeno 6 caratteri
- Includi lettere, numeri e simboli

**"Errore di connessione"**
- Verifica la connessione internet
- Controlla le regole Firebase

### Log e Debug
- Apri la console del browser per i log dettagliati
- Controlla il Firebase Console per gli errori di autenticazione

## 🔄 Migrazione da Sistema Precedente

Se stavi usando il sistema di chiavi semplici:

1. **Rimuovi le variabili d'ambiente**:
   ```bash
   # Rimuovi o commenta
   # ADMIN_ACCESS_KEY=your_old_key
   ```

2. **Crea il primo admin**:
   - Vai su `/admin/setup`
   - Crea un account con le tue credenziali

3. **Testa l'accesso**:
   - Vai su `/admin`
   - Verifica che il login funzioni

## 📞 Supporto

Per problemi o domande:
1. Controlla i log della console
2. Verifica la configurazione Firebase
3. Consulta la documentazione Firebase Auth

---

**Nota**: Questa implementazione garantisce un livello di sicurezza molto superiore rispetto al sistema di chiavi semplici precedente, proteggendo l'area admin con standard enterprise.
