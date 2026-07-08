# Educazione Digitale Familiare — sorgente Angular

Ricostruzione in Angular dell'app "Educazione Digitale Familiare" (il sorgente Angular
originale era andato perso: nel repository esisteva solo il bundle compilato).
Replica pagina per pagina la versione HTML/JS vanilla del branch `backend_only`.

## Struttura

- `src/app/services/data.service.ts` — caricamento dati da Google Apps Script
  (con cache in `localStorage`, TTL 5 minuti), mapping dei fogli remoti
  (categorie, keywords, test, regole, attività, raccomandazioni) e logica di
  ricerca per parole chiave. Porting fedele di `js/app.js`.
- `src/app/pages/home` — homepage: hero, ricerca multi-campo (max 3) con
  autocomplete, sezioni "come funziona", esperti, temi, privacy, CTA.
- `src/app/pages/risultati` — categorie trovate dalla ricerca (`?data=...`),
  card espandibili, link "Crea il tuo patto familiare".
- `src/app/pages/test` — domande SI/NO filtrate per categorie
  (`?categorie=[...]` oppure `?categoria=x`), con progress bar.
- `src/app/pages/test-risultati` — il patto familiare: regole e attività
  eliminabili, download del PDF a 5 sezioni (jsPDF + jspdf-autotable).

## Sviluppo

```bash
npm install
npm start        # ng serve su http://localhost:4200
```

## Build di produzione

```bash
npm run build    # output in dist/angular-app/browser
```

Nota: essendo una SPA con routing sui path (`/risultati`, `/test`,
`/test-risultati`), per il deploy su GitHub Pages serve il fallback SPA
(copiare `index.html` in `404.html` nella cartella pubblicata) e l'opzione
`--base-href` adeguata al percorso del sito.
