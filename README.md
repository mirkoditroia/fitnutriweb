GZnutrition — Next.js 14 App Router
===================================

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Firebase (Auth + Firestore)

Palette: Primary #00D084, Accent #FF6B6B, Dark #0E0F12, Light #F7F9FB.

Avvio locale
------------

1. Requisiti: Node 18+
2. Installazione dipendenze:
   - `npm install`
3. Variabili ambiente: copia `.env.example` in `.env.local` e popola i valori.
4. Sviluppo: `npm run dev` su `http://localhost:3000`
5. Lint/Type: `npm run lint` / `npm run typecheck`
6. Build/Prod: `npm run build` e `npm start`

Variabili ambiente
------------------
- `NEXT_PUBLIC_FIREBASE_*` per inizializzare Firebase client-side
- `ADMIN_ACCESS_KEY` chiave semplice per protezioni basiche su endpoint admin
- `TRUSTPILOT_API_KEY`, `TRUSTPILOT_API_SECRET`, `TRUSTPILOT_BUSINESS_UNIT_ID` per integrazione Trustpilot

Area /admin
-----------
Disponibile su `/admin`. Consente di:

- Modificare: pacchetti (titolo, descrizione, prezzo, immagine, featured, badge), disponibilità (slot agenda), contenuti landing (hero title/subtitle/CTA), immagini di sezione, microcopy FAQ.
- Visualizzare: prenotazioni (con stato), schede cliente, statistiche rapide (richieste ultimo mese), log Trustpilot (esito fetch).

UI/UX
-----
- Mobile-first, energica ma pulita
- Accessibilità: alt/aria, focus ring visibile, contrasto ≥ 4.5:1
- Componenti utili disponibili in `src/components/ui` (button, input, card)
