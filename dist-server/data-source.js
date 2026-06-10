"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackData = void 0;
exports.normalizeText = normalizeText;
exports.slugify = slugify;
exports.mapRemoteData = mapRemoteData;
exports.fallbackData = {
    categories: {
        'zone-off-limits': {
            id: 'zone-off-limits',
            nome: 'Zone Off-Limits',
            descrizione: 'Aree della casa o situazioni in cui i dispositivi non devono essere utilizzati, come la tavola, la camera da letto o durante i compiti.',
            link: 'https://example.com/zone-off-limits'
        },
        'limiti-orari': {
            id: 'limiti-orari',
            nome: 'Limiti Orari Concordati',
            descrizione: 'Stabilire fasce orarie specifiche durante le quali i dispositivi possono essere utilizzati, per garantire equilibrio tra attività online e offline.',
            link: 'https://example.com/limiti-orari'
        },
        'sicurezza-password': {
            id: 'sicurezza-password',
            nome: 'Sicurezza Password e Account',
            descrizione: 'Regole sulla creazione di password sicure e sulla protezione degli account personali.',
            link: 'https://example.com/sicurezza-password'
        },
        privacy: {
            id: 'privacy',
            nome: 'Privacy Online',
            descrizione: 'Protezione dei dati personali e informazioni sensibili condivise online.',
            link: 'https://example.com/privacy'
        },
        cyberbullismo: {
            id: 'cyberbullismo',
            nome: 'Prevenzione Cyberbullismo',
            descrizione: 'Come riconoscere e affrontare il cyberbullismo, con supporto della famiglia.',
            link: 'https://example.com/cyberbullismo'
        },
        'social-media': {
            id: 'social-media',
            nome: 'Social Media Consapevole',
            descrizione: 'Utilizzo responsabile dei social media e consapevolezza del tempo trascorso.',
            link: 'https://example.com/social-media'
        },
        dipendenza: {
            id: 'dipendenza',
            nome: 'Dipendenza da Internet',
            descrizione: 'Riconoscere i segni di dipendenza e mantenere un uso equilibrato della tecnologia.',
            link: 'https://example.com/dipendenza'
        },
        'salute-fisica': {
            id: 'salute-fisica',
            nome: 'Salute Fisica',
            descrizione: 'L\'importanza delle pause dallo schermo per proteggere gli occhi e la postura.',
            link: 'https://example.com/salute-fisica'
        }
    },
    keywords: [
        { preoccupazione: 'mio figlio è sempre sul cellulare', categorie: ['dipendenza'] },
        { preoccupazione: 'uso eccessivo degli schermi', categorie: ['dipendenza', 'salute-fisica'] },
        { preoccupazione: 'cyberbullismo tra compagni', categorie: ['cyberbullismo'] },
        { preoccupazione: 'privacy e condivisione online', categorie: ['privacy'] },
        { preoccupazione: 'password deboli', categorie: ['sicurezza-password'] },
        { preoccupazione: 'dispositivi a tavola', categorie: ['zone-off-limits'] }
    ],
    testQuestions: [
        { domanda: 'Usate spesso dispositivi a tavola durante i pasti?', categoria: 'zone-off-limits', se_si: 'ZONE OFF-LIMITS', se_no: '' },
        { domanda: 'I dispositivi sono presenti in camera da letto durante la notte?', categoria: 'zone-off-limits', se_si: 'ZONE OFF-LIMITS', se_no: '' },
        { domanda: 'Vi preoccupa il tempo totale trascorso sui dispositivi?', categoria: 'limiti-orari', se_si: 'LIMITI ORARI CONCORDATI', se_no: '' },
        { domanda: 'Vi preoccupano le password deboli degli account dei vostri figli?', categoria: 'sicurezza-password', se_si: 'SICUREZZA PASSWORD', se_no: '' },
        { domanda: 'Si condividono facilmente informazioni personali online?', categoria: 'privacy', se_si: 'PRIVACY ONLINE', se_no: '' }
    ],
    rules: {
        'ZONE OFF-LIMITS': {
            nome: 'ZONE OFF-LIMITS',
            descrizione: 'Niente dispositivi a tavola, in camera da letto e durante i compiti.',
            icona: '📵',
            categorie: ['zone-off-limits'],
            raccomandazione: 'Alleanza educativa (Patto)',
            linkRaccomandazione: ''
        },
        'LIMITI ORARI CONCORDATI': {
            nome: 'LIMITI ORARI CONCORDATI',
            descrizione: 'Stabilire fasce orarie specifiche durante le quali i dispositivi possono essere utilizzati.',
            icona: '⏰',
            categorie: ['limiti-orari'],
            raccomandazione: 'Alleanza educativa (Patto)',
            linkRaccomandazione: ''
        },
        'SICUREZZA PASSWORD': {
            nome: 'SICUREZZA PASSWORD',
            descrizione: 'Usare password forti e uniche per ogni account.',
            icona: '🔐',
            categorie: ['sicurezza-password'],
            raccomandazione: 'Alleanza educativa (Patto)',
            linkRaccomandazione: ''
        },
        'PRIVACY ONLINE': {
            nome: 'PRIVACY ONLINE',
            descrizione: 'Proteggere i dati personali e condividere informazioni in modo responsabile.',
            icona: '🔒',
            categorie: ['privacy'],
            raccomandazione: 'Alleanza educativa (Patto)',
            linkRaccomandazione: ''
        }
    },
    activities: {
        'ZONE OFF-LIMITS-1': {
            nome: 'Un giorno senza dispositivi',
            descrizione: 'Scegliere una giornata o alcune ore della settimana in cui alcune stanze della casa restano completamente senza schermi.',
            eta: '7+',
            durata: '2 mesi',
            frequenza: 'settimanale',
            regola: 'ZONE OFF-LIMITS'
        },
        'LIMITI ORARI CONCORDATI-1': {
            nome: 'Orario di spegnimento',
            descrizione: 'Stabilire un orario fisso ogni giorno dopo il quale tutti i dispositivi vengono spenti.',
            eta: '7+',
            durata: 'Continuo',
            frequenza: 'giornaliero',
            regola: 'LIMITI ORARI CONCORDATI'
        }
    },
    recommendations: {
        'Alleanza educativa (Patto)': {
            nome: 'Alleanza educativa (Patto)',
            descrizione: 'Raccomandazione istituzionale del Comune di Milano.',
            link: ''
        }
    }
};
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
            const categorie = String(row.categorie || row['categorie'] || '')
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean);
            if (preoccupazione) {
                keywords.push({ preoccupazione, categorie });
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
