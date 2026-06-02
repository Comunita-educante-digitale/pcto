import json

with open("data/keywords.json", encoding="utf-8") as f:
    KEYWORDS = json.load(f)


def trova_categoria(query):

    query = query.lower()

    for categoria, parole in KEYWORDS.items():

        for parola in parole:

            if parola.lower() in query:
                return categoria

    return None