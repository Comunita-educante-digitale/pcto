import json
import urllib.request
import time
import threading

SHEETS_URL = "https://script.google.com/macros/s/AKfycbyQlimUfoMV2SqQfvJtD1-msT5Q7RZyUDH1wZK-S9yqzGrxUZArkAh60IDOupf1eFmd/exec"
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
    for query in queries:
        if not query:
            continue
        q = query.lower()
        for categoria, parole in KEYWORDS.items():
            for parola in parole:
                if parola.lower() in q:
                    scores[categoria] = scores.get(categoria, 0) + 1
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
