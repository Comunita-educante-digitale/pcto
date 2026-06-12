# Educazione Digitale Familiare

Sito statico per l'educazione digitale familiare. Nessun backend richiesto.

## Architettura

Il browser fa fetch diretto a Google Apps Script all'avvio della pagina, con cache in localStorage (TTL 5 minuti).

## File principali

- `index.html`, `test.html`, `risultati.html`, `test_risultati.html` - pagine del sito
- `js/app.js` - logica di fetch dati, cache, ricerca
- `js/search.js` - gestione UI di ricerca e autocomplete
- `style.css` - stili

## Deploy

### GitHub Pages

Il workflow in `.github/workflows/deploy.yml` builda automaticamente il sito su push al branch e lo pubblica sul branch `gh-pages`.

Vai su Settings → Pages → Branch: `gh-pages` → / (root)

### Netlify

1. Collega il repository
2. Build command: (nessuno)
3. Publish directory: `.`
