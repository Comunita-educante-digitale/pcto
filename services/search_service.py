import json
import urllib.request
import time
import threading

SHEETS_URL = "https://script.google.com/macros/s/AKfycbygppLK3eHQ4uxw-jaw7-V5t5fLQPQkRLp-IyGxjj5zqTwREfn7pWrd6PgzY-M1LlcS/exec"
CACHE_TTL = 300

_cache = {"keywords": {}, "categorie": {}, "test_iniziale": [], "regole": {}, "attivita": {}, "last_update": 0}

def _fetch_from_sheets():
    try:
        req = urllib.request.Request(SHEETS_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode())
        _cache["keywords"] = data.get("keywords", {})
        _cache["categorie"] = data.get("categorie", {})
        _cache["test_iniziale"] = data.get("test_iniziale", [])
        _cache["regole"] = data.get("regole", {})
        _cache["attivita"] = data.get("attivita", {})
        _cache["last_update"] = time.time()
        print("Cache aggiornata da Google Sheets")
    except Exception as e:
        print("Errore caricamento Google Sheets:", e)

def aggiorna_cache_background():
    threading.Thread(target=_fetch_from_sheets, daemon=True).start()

def carica_dati(force=False):
    now = time.time()
    cache_scaduta = (now - _cache["last_update"]) > CACHE_TTL
    if force or cache_scaduta:
        aggiorna_cache_background()
    if not _cache["keywords"]:
        _fetch_from_sheets()
    return _cache["keywords"], _cache["categorie"], _cache["test_iniziale"], _cache["regole"], _cache["attivita"]

def trova_top3_categorie(queries):
    KEYWORDS, CATEGORIE, _, _, _ = carica_dati()
    scores = {}
    STOPWORDS = {'il','lo','la','i','gli','le','un','uno','una','di','a','da','in','con','su','per','tra','fra','e','o','ma','se','non','che','chi','cui','ne','ci','si','mi','ti','vi','al','del','dei','dal','nel','sul','col','con','anche','mai','sempre','ogni','tutto','tutti'}

    for query in queries:
        if not query:
            continue
        q = query.lower().strip()

        # 1. Corrispondenza esatta — massima priorità
        exact_found = False
        for categoria, parole in KEYWORDS.items():
            for parola in parole:
                if parola.lower().strip() == q:
                    scores[categoria] = scores.get(categoria, 0) + 100
                    exact_found = True

        if exact_found:
            continue

        # 2. La keyword è contenuta nella query
        for categoria, parole in KEYWORDS.items():
            for parola in parole:
                p = parola.lower().strip()
                if p in q:
                    scores[categoria] = scores.get(categoria, 0) + 10

        # 3. Parole significative in comune (escluse stopwords)
        words_in_query = [w for w in q.split() if w not in STOPWORDS and len(w) > 3]
        for categoria, parole in KEYWORDS.items():
            for parola in parole:
                p = parola.lower().strip()
                for word in words_in_query:
                    if word in p:
                        scores[categoria] = scores.get(categoria, 0) + 1
                        break

    top3 = sorted(scores, key=lambda c: scores[c], reverse=True)[:3]
    risultati = []
    for cat in top3:
        info = CATEGORIE.get(cat, {})
        risultati.append({
            "id": cat,
            "nome": info.get("nome", cat),
            "descrizione": info.get("descrizione", ""),
            "link": info.get("link", ""),
            "score": scores[cat]
        })
    return risultati

def trova_categoria(query):
    risultati = trova_top3_categorie([query])
    return risultati[0]["id"] if risultati else None
