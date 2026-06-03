import json

with open("data/keywords.json", encoding="utf-8") as f:
    KEYWORDS = json.load(f)

DESCRIZIONI = {
    "dipendenza": "Uso compulsivo di dispositivi e difficolta a staccarsi dagli schermi. Stabilire regole chiare sui tempi di utilizzo e creare momenti offline in famiglia e fondamentale.",
    "isolamento": "Tendenza a ritirarsi dalla vita sociale preferendo il mondo virtuale. Favorire attivita condivise e mantenere aperto il dialogo puo aiutare il ragazzo a ritrovare equilibrio.",
    "contenuti inappropriati": "Esposizione a materiali non adatti all eta come violenza o contenuti sessuali. Filtri e conversazioni aperte sono strumenti fondamentali di protezione.",
    "privacy": "Difficolta a comprendere i rischi legati alla condivisione di dati personali online. Educare alla consapevolezza digitale fin da piccoli e essenziale.",
    "salute mentale": "Segnali di ansia, tristezza o bassa autostima legati all uso dei social. Non sottovalutare questi segnali e cercare supporto professionale se necessario.",
    "impatto cognitivo": "Difficolta di concentrazione e calo del rendimento scolastico. Limitare le notifiche e creare ambienti di studio senza dispositivi puo fare la differenza.",
    "cyberbullismo": "Comportamenti aggressivi, insulti o esclusione subiti online. Il ragazzo deve sapere di poter parlare con un adulto di fiducia senza paura.",
    "salute fisica": "Problemi di postura, disturbi del sonno o sedentarieta. Pause regolari e attivita fisica quotidiana sono fondamentali.",
    "rischi sicurezza": "Contatti con sconosciuti o situazioni pericolose online. Supervisione e dialogo aperto sono le prime forme di protezione.",
    "disinformazione": "Difficolta a distinguere notizie vere da false. Sviluppare il pensiero critico e verificare le fonti sono competenze digitali essenziali.",
    "reale/virtuale": "Confusione tra identita reale e virtuale. Aiutare il ragazzo a valorizzare la propria identita reale e prioritario."
}

NOMI = {
    "dipendenza": "Dipendenza dagli schermi",
    "isolamento": "Isolamento sociale",
    "contenuti inappropriati": "Contenuti inappropriati",
    "privacy": "Privacy e dati personali",
    "salute mentale": "Salute mentale",
    "impatto cognitivo": "Impatto cognitivo",
    "cyberbullismo": "Cyberbullismo",
    "salute fisica": "Salute fisica",
    "rischi sicurezza": "Rischi di sicurezza",
    "disinformazione": "Disinformazione",
    "reale/virtuale": "Reale vs Virtuale"
}

def trova_top3_categorie(queries):
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
        risultati.append({
            "id": cat,
            "nome": NOMI.get(cat, cat),
            "descrizione": DESCRIZIONI.get(cat, ""),
            "score": scores[cat]
        })
    return risultati

def trova_categoria(query):
    risultati = trova_top3_categorie([query])
    return risultati[0]["id"] if risultati else None
