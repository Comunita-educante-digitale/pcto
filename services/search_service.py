import json
import urllib.request

SHEETS_URL = "https://script.google.com/macros/s/AKfycbyHqHHE8kwp_vLcb4tBr_w1yQm6iVFkE501s0GcnoPBtpLDzDP_Zl5cNbG5ZjLXav9T/exec"

def carica_dati():
    try:
        req = urllib.request.Request(SHEETS_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode())
        return data.get("keywords", {}), data.get("categorie", {})
    except Exception as e:
        print("Errore caricamento Google Sheets:", e)
        with open("data/keywords.json", encoding="utf-8") as f:
            kw = json.load(f)
        return kw, {}

def trova_top3_categorie(queries):
    KEYWORDS, CATEGORIE = carica_dati()
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
