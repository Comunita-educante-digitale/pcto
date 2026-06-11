"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.slugify = slugify;
exports.findMatchingCategoriesForQuery = findMatchingCategoriesForQuery;
exports.mapRemoteData = mapRemoteData;
function normalizeText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}
function slugify(value) {
    return normalizeText(value).replace(/\s+/g, '-');
}
function findCategoryId(categoryName, categories) {
    if (!categoryName) {
        return '';
    }
    const directMatch = categories[categoryName];
    if (directMatch?.id) {
        return directMatch.id;
    }
    const normalizedInput = normalizeText(categoryName);
    return Object.values(categories).find((category) => {
        const candidate = category;
        return normalizeText(candidate.categoria) === normalizedInput
            || normalizeText(candidate.nome) === normalizedInput
            || normalizeText(candidate.slug) === normalizedInput;
    })?.id || '';
}
// MODIFICATA: Logica di ricerca stringente per evitare falsi positivi ed evitare di mostrare tutte le categorie
function findMatchingCategoriesForQuery(query, data) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
        return [];
    }
    const matchedCategories = new Set();
    // Tokenizziamo la ricerca dell'utente escludendo le particelle cortissime (es. "il", "è", "sul")
    const queryTokens = normalizedQuery.split(/\s+/).filter(token => token.length > 2);
    for (const item of data.keywords) {
        const normalizedPhrase = normalizeText(item.preoccupazione);
        if (!normalizedPhrase) {
            continue;
        }
        let isMatch = false;
        // 1. Controllo base: una frase contiene interamente l'altra?
        if (normalizedPhrase === normalizedQuery || normalizedPhrase.includes(normalizedQuery) || normalizedQuery.includes(normalizedPhrase)) {
            isMatch = true;
        }
        else if (queryTokens.length > 0) {
            // 2. Controllo tokenizzato intelligente: verifichiamo se le parole chiave della preoccupazione nel foglio sono contenute nella ricerca
            const phraseTokens = normalizedPhrase.split(/\s+/).filter(token => token.length > 2);
            if (phraseTokens.length > 0) {
                const allPhraseTokensMatched = phraseTokens.every(token => queryTokens.includes(token));
                const allQueryTokensMatched = queryTokens.every(token => phraseTokens.includes(token));
                if (allPhraseTokensMatched || allQueryTokensMatched) {
                    isMatch = true;
                }
            }
        }
        // Se la riga corrisponde, estraiamo le categorie associate
        if (isMatch) {
            for (const categoryName of item.categorie ?? []) {
                const categoryId = findCategoryId(categoryName, data.categories);
                if (categoryId) {
                    matchedCategories.add(categoryId);
                }
            }
        }
    }
    return Array.from(matchedCategories);
}
function getArrayRows(value) {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'object' && item !== null);
    }
    return [];
}
function getObjectEntries(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.entries(value);
    }
    return [];
}
function mapRemoteData(payload) {
    const categoriesRaw = payload.categorie || payload['CATEGORIE di rischio'] || {};
    const keywordRaw = payload.keywords || payload.KEYWORDS || {};
    const testRaw = payload.test_iniziale || [];
    const rulesRaw = payload.regole || {};
    const activitiesRaw = payload.attivita || payload.ATTIVITA || {};
    const recommendationsRaw = payload.raccomandazioni || payload.RACCOMANDAZIONI || {};
    const categories = {};
    const categoryLookup = new Map();
    getObjectEntries(categoriesRaw).forEach(([key, value]) => {
        const row = typeof value === 'object' && value !== null ? value : {};
        const categoryName = row.categoria || row.titolo || key;
        const categoryId = String(row.id ?? slugify(key));
        const categoryEntry = {
            id: categoryId,
            nome: row.titolo || row.categoria || row.nome || categoryName,
            descrizione: row['info in breve'] || row['info breve'] || row.descrizione || '',
            link: row['link del doc'] || row.link || '',
            categoria: row.categoria || categoryName,
            slug: slugify(categoryName)
        };
        categories[categoryId] = categoryEntry;
        categoryLookup.set(normalizeText(categoryName), categoryId);
        categoryLookup.set(normalizeText(categoryEntry.nome), categoryId);
        categoryLookup.set(normalizeText(categoryEntry.slug), categoryId);
    });
    const keywords = [];
    if (Array.isArray(keywordRaw)) {
        keywordRaw.forEach((row) => {
            const preoccupazione = String(row.preoccupazione || row['preoccupazione'] || '');
            // MODIFICATA: Gestisce la separazione dei chip/tag di Google sia per virgole, spazi multipli o a capo
            const rawCategories = String(row.categorie || row['categorie'] || '');
            const categorie = rawCategories.includes(',')
                ? rawCategories.split(',').map((entry) => entry.trim()).filter(Boolean)
                : rawCategories.split(/\s{2,}/).map((entry) => entry.trim()).filter(Boolean); // Se non ci sono virgole spezza sugli spazi ampi
            if (preoccupazione) {
                keywords.push({ preoccupazione, categorie: categorie.length > 0 ? categorie : [rawCategories.trim()] });
            }
        });
    }
    else {
        getObjectEntries(keywordRaw).forEach(([categoryKey, value]) => {
            if (Array.isArray(value)) {
                value.forEach((phrase) => {
                    if (phrase) {
                        keywords.push({ preoccupazione: String(phrase), categorie: [String(categoryKey)] });
                    }
                });
            }
            else if (typeof value === 'string' && value.trim()) {
                keywords.push({ preoccupazione: value, categorie: [String(categoryKey)] });
            }
        });
    }
    const rules = {};
    const recommendations = {};
    const recommendationRowsByName = new Map();
    getObjectEntries(recommendationsRaw).forEach(([key, value]) => {
        const row = typeof value === 'object' && value !== null ? value : {};
        const recommendationName = row.Raccomandazioni || row.nome || row['Raccomandazioni'] || key;
        if (recommendationName) {
            recommendationRowsByName.set(normalizeText(recommendationName), row);
            recommendations[recommendationName] = {
                nome: recommendationName,
                descrizione: row.descrizione || '',
                link: row['link raccomandazione'] || row.link || ''
            };
        }
    });
    getObjectEntries(rulesRaw).forEach(([ruleName, value]) => {
        const row = typeof value === 'object' && value !== null ? value : {};
        const matchedCategories = [row.categoria1, row.categoria2, row.categoria3, ...(Array.isArray(row.categorie) ? row.categorie : []), ...(Array.isArray(row.categorie_di_rischio) ? row.categorie_di_rischio : [])]
            .filter(Boolean)
            .flatMap((valueEntry) => {
            if (Array.isArray(valueEntry)) {
                return valueEntry.map((item) => String(item));
            }
            return [String(valueEntry)];
        })
            .map((valueEntry) => {
            const normalized = normalizeText(valueEntry);
            return categoryLookup.get(normalized) || Object.values(categories).find((category) => normalizeText(category.categoria) === normalized || normalizeText(category.nome) === normalized || normalizeText(category.slug) === normalized)?.id || '';
        })
            .filter(Boolean);
        const recommendationName = row.raccomandazione || row['raccomandazione del comune di Milano'] || row['Raccomandazione del Comune di Milano'] || '';
        const matchingRecommendation = recommendationRowsByName.get(normalizeText(recommendationName));
        rules[ruleName] = {
            nome: ruleName,
            descrizione: row.descrizione || '',
            icona: row.immagine || row.icona || '📌',
            categorie: matchedCategories,
            raccomandazione: recommendationName,
            linkRaccomandazione: matchingRecommendation?.['link raccomandazione'] || matchingRecommendation?.link || '',
            attivita: Array.isArray(row.attivita) ? row.attivita : []
        };
    });
    const activities = {};
    getObjectEntries(activitiesRaw).forEach(([activityName, value]) => {
        const row = typeof value === 'object' && value !== null ? value : {};
        const ruleName = row.regola || '';
        const activityId = `${ruleName}-${activityName}`;
        activities[activityId] = {
            nome: activityName,
            descrizione: row.descrizione || '',
            eta: row.eta || row['età di riferimento'] || '',
            durata: row.durata || '',
            frequenza: row.frequenza || '',
            regola: ruleName
        };
    });
    const testQuestions = getArrayRows(testRaw).map((row) => {
        const categoryName = row.categotia || row.categoria || row['categoria di rischio'] || '';
        const categoryId = Object.values(categories).find((category) => normalizeText(category.categoria) === normalizeText(categoryName) || normalizeText(category.nome) === normalizeText(categoryName) || normalizeText(category.slug) === normalizeText(categoryName))?.id || slugify(categoryName);
        return {
            domanda: row.domande || row.domanda || '',
            categoria: categoryId,
            se_si: row['se SI'] || row['se SI '] || row['se_si'] || row.se_si || '',
            se_no: row['se NO'] || row['se NO '] || row['se_no'] || row.se_no || ''
        };
    });
    return { categories, keywords, testQuestions, rules, activities, recommendations };
}
