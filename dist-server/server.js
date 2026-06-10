"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const data_source_1 = require("./data-source");
const app = (0, express_1.default)();
const initialPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const GOOGLE_APPS_SCRIPT_URLS = [
    process.env.GOOGLE_APPS_SCRIPT_URL,
    'https://script.google.com/macros/s/AKfycbygppLK3eHQ4uxw-jaw7-V5t5fLQPQkRLp-IyGxjj5zqTwREfn7pWrd6PgzY-M1LlcS/exec',
    'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnTUfZgfHyuJS46VG6WcEUZgQd_JbcTfP_y3pj_WaCGI7S6mplaIB8qRT_b0yRixTBUmmuWMeNzas8pt-G7YRUJUujPcriJepeguQ-8PdmGbRC5jbsH8GnXMD5HRIZ3SL8uFI7s5EffejU_uugUc-26Hi-8TmnAJgzg2dQPi9pvgl9fbxpJ_0yJf7S23Q0mU8z7wHKxbVz6BYiDDUiY9A3PktrZUNjOAkLyyHvUBmSgNtuApVO59G6jEtOxksTO9izjJinHh4TZC-tCDJcpq8T_ywi9pmw&lib=MlRCYSh2pVGq_cqM2lnE5VKR_QGq8bm1S'
].filter(Boolean);
const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedAppData = null;
let lastDataFetchAt = 0;
let lastDataSource = 'fallback';
async function loadRemoteData() {
    for (const url of GOOGLE_APPS_SCRIPT_URLS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const payloadText = await response.text();
            console.log('[data-source] response status', response.status, 'content-type', response.headers.get('content-type'), 'url', url);
            console.log('[data-source] response preview', payloadText.slice(0, 500));
            const payload = JSON.parse(payloadText);
            if (!payload || typeof payload !== 'object') {
                throw new Error('Risposta vuota dal feed dati');
            }
            return (0, data_source_1.mapRemoteData)(payload);
        }
        catch (error) {
            console.error('[data-source] impossibile recuperare i dati da Google Apps Script', url, error);
        }
    }
    console.error('[data-source] impossibile recuperare i dati da Google Apps Script, uso il fallback statico');
    return data_source_1.fallbackData;
}
async function getAppData(forceRefresh = false) {
    if (!forceRefresh && cachedAppData && Date.now() - lastDataFetchAt < CACHE_TTL_MS) {
        return { data: cachedAppData, source: lastDataSource };
    }
    const loadedData = await loadRemoteData();
    cachedAppData = loadedData;
    lastDataFetchAt = Date.now();
    lastDataSource = 'google';
    if (Object.keys(loadedData.categories).length === 0 && Object.keys(loadedData.rules).length === 0) {
        lastDataSource = 'fallback';
    }
    return { data: loadedData, source: lastDataSource };
}
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'static')));
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'templates', 'index.html'));
});
app.get('/test', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'templates', 'test.html'));
});
app.get('/risultati', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'templates', 'risultati.html'));
});
app.get('/test-risultati', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'templates', 'test_risultati.html'));
});
app.get('/api/categorie', async (_req, res) => {
    const { data, source } = await getAppData();
    console.log('[api/categorie] source', source, 'count', Object.keys(data.categories).length);
    res.json(data.categories);
});
app.get('/api/test_iniziale', async (_req, res) => {
    const { data, source } = await getAppData();
    console.log('[api/test_iniziale] source', source, 'questions', data.testQuestions.length, 'rules', Object.keys(data.rules).length);
    res.json({ regole: data.rules, test: data.testQuestions });
});
app.get('/api/attivita', async (_req, res) => {
    const { data, source } = await getAppData();
    console.log('[api/attivita] source', source, 'count', Object.keys(data.activities).length);
    res.json(data.activities);
});
app.get('/api/keywords', async (_req, res) => {
    const { data, source } = await getAppData();
    const keywordList = data.keywords.map((item) => item.preoccupazione);
    console.log('[api/keywords] source', source, 'count', keywordList.length);
    res.json(keywordList);
});
app.post('/search', async (req, res) => {
    const { queries } = req.body;
    console.log('[search] input queries', queries);
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        console.log('[search] no queries provided');
        return res.json({ success: false, risultati: [] });
    }
    const { data, source } = await getAppData();
    const searchTerms = queries.map((q) => (0, data_source_1.normalizeText)(q));
    const risultati = [];
    const foundIds = new Set();
    searchTerms.forEach((term) => {
        data.keywords.forEach((item) => {
            const phrase = (0, data_source_1.normalizeText)(item.preoccupazione);
            const isMatch = term.includes(phrase) || phrase.includes(term) || phrase.split(/\s+/).some((token) => term.includes(token));
            if (!isMatch) {
                return;
            }
            item.categorie.forEach((categoryName) => {
                const categoryId = Object.values(data.categories).find((category) => (0, data_source_1.normalizeText)(category.categoria) === (0, data_source_1.normalizeText)(categoryName) || (0, data_source_1.normalizeText)(category.nome) === (0, data_source_1.normalizeText)(categoryName) || (0, data_source_1.normalizeText)(category.slug) === (0, data_source_1.normalizeText)(categoryName))?.id;
                if (!categoryId || foundIds.has(categoryId)) {
                    return;
                }
                foundIds.add(categoryId);
                const category = data.categories[categoryId];
                risultati.push({ id: categoryId, nome: category?.nome || categoryName, descrizione: category?.descrizione || '' });
            });
        });
    });
    if (risultati.length === 0) {
        Object.entries(data.categories).slice(0, 3).forEach(([id, category]) => {
            risultati.push({ id, nome: category.nome, descrizione: category.descrizione });
        });
    }
    console.log('[search] source', source, 'matched categories', risultati.map((item) => item.id));
    res.json({ success: true, risultati });
});
app.post('/test', async (req, res) => {
    const { categorie: selectedCategories } = req.body;
    if (!selectedCategories || !Array.isArray(selectedCategories)) {
        return res.json({ success: false, regole: [] });
    }
    const { data } = await getAppData();
    const regoleSelezionate = [];
    Object.entries(data.rules).forEach(([nome, dati]) => {
        const ruleCategoriesMatch = (dati.categorie || []).some((cat) => selectedCategories.includes(cat));
        if (ruleCategoriesMatch) {
            regoleSelezionate.push(nome);
        }
    });
    const encodedRegole = encodeURIComponent(JSON.stringify(regoleSelezionate));
    const encodedCategorie = encodeURIComponent(JSON.stringify(selectedCategories));
    res.json({
        success: true,
        redirect: `/test-risultati?regole=${encodedRegole}&categorie=${encodedCategorie}`
    });
});
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'static')));
app.use((_req, res) => {
    res.status(404).sendFile(path_1.default.join(__dirname, '..', 'templates', 'index.html'));
});
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            const fallbackPort = port === 8080 ? 8081 : port + 1;
            console.warn(`Port ${port} is already in use. Retrying on port ${fallbackPort}...`);
            startServer(fallbackPort);
        }
        else {
            console.error('Server failed to start:', error);
            process.exit(1);
        }
    });
}
void getAppData();
startServer(initialPort);
