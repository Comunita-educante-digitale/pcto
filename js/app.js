const GOOGLE_APPS_SCRIPT_URLS = [
  'https://script.google.com/macros/s/AKfycbygppLK3eHQ4uxw-jaw7-V5t5fLQPQkRLp-IyGxjj5zqTwREfn7pWrd6PgzY-M1LlcS/exec',
  'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnTUfZgfHyuJS46VG6WcEUZgQd_JbcTfP_y3pj_WaCGI7S6mplaIB8qRT_b0yRixTBUmmuWMeNzas8pt-G7YRUJUujPcriJepeguQ-8PdmGbRC5jbsH8GnXMD5HRIZ3SL8uFI7s5EffejU_uugUc-26Hi-8TmnAJgzg2dQPi9pvgl9fbxpJ_0yJf7S23Q0mU8z7wHKxbVz6BYiDDUiY9A3PktrZUNjOAkLyyHvUBmSgNtuApVO59G6jEtOxksTO9izjJinHh4TZC-tCDJcpq8T_ywi9pmw&lib=MlRCYSh2pVGq_cqM2lnE5VKR_QGq8bm1S'
];
const CACHE_KEY = 'appData_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function slugify(value) { return normalizeText(value).replace(/\s+/g, '-'); }

function getObjectEntries(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return Object.entries(value);
  return [];
}
function getArrayRows(value) {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'object' && item !== null);
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
    const entry = {
      id: categoryId, nome: row.titolo || row.categoria || row.nome || categoryName,
      descrizione: row['info in breve'] || row['info breve'] || row.descrizione || '',
      link: row['link del doc'] || row.link || '',
      categoria: row.categoria || categoryName, slug: slugify(categoryName)
    };
    categories[categoryId] = entry;
    categoryLookup.set(normalizeText(categoryName), categoryId);
    categoryLookup.set(normalizeText(entry.nome), categoryId);
    categoryLookup.set(normalizeText(entry.slug), categoryId);
  });

  const keywords = [];
  if (Array.isArray(keywordRaw)) {
    keywordRaw.forEach(row => {
      const preoccupazione = String(row.preoccupazione || '');
      const rawCategorie = String(row.categorie || '');
      const categorie = rawCategorie.includes(',') ? rawCategorie.split(',').map(e => e.trim()).filter(Boolean) : rawCategorie.split(/\s{2,}/).map(e => e.trim()).filter(Boolean);
      if (preoccupazione) keywords.push({ preoccupazione, categorie: categorie.length > 0 ? categorie : [rawCategorie.trim()] });
    });
  } else {
    getObjectEntries(keywordRaw).forEach(([categoryKey, value]) => {
      if (Array.isArray(value)) value.forEach(phrase => { if (phrase) keywords.push({ preoccupazione: String(phrase), categorie: [String(categoryKey)] }); });
      else if (typeof value === 'string' && value.trim()) keywords.push({ preoccupazione: value, categorie: [String(categoryKey)] });
    });
  }

  const recommendations = {};
  const recommendationRowsByName = new Map();
  getObjectEntries(recommendationsRaw).forEach(([key, value]) => {
    const row = typeof value === 'object' && value !== null ? value : {};
    const name = row.Raccomandazioni || row.nome || key;
    if (name) { recommendationRowsByName.set(normalizeText(name), row); recommendations[name] = { nome: name, descrizione: row.descrizione || '', link: row['link raccomandazione'] || row.link || '' }; }
  });

  const rules = {};
  getObjectEntries(rulesRaw).forEach(([ruleName, value]) => {
    const row = typeof value === 'object' && value !== null ? value : {};
    const matchedCategories = [row.categoria1, row.categoria2, row.categoria3, ...(Array.isArray(row.categorie) ? row.categorie : []), ...(Array.isArray(row.categorie_di_rischio) ? row.categorie_di_rischio : [])]
      .filter(Boolean).flatMap(v => Array.isArray(v) ? v.map(String) : [String(v)])
      .map(v => { const norm = normalizeText(v); return categoryLookup.get(norm) || Object.values(categories).find(c => normalizeText(c.categoria) === norm || normalizeText(c.nome) === norm || normalizeText(c.slug) === norm)?.id || ''; })
      .filter(Boolean);
    const raccomandazione = row.raccomandazione || row['raccomandazione del comune di Milano'] || row['Raccomandazione del Comune di Milano'] || '';
    const matchingRec = recommendationRowsByName.get(normalizeText(raccomandazione));
    rules[ruleName] = { nome: ruleName, descrizione: row.descrizione || '', icona: row.immagine || row.icona || '📌', categorie: matchedCategories, raccomandazione, linkRaccomandazione: matchingRec?.['link raccomandazione'] || matchingRec?.link || '', attivita: Array.isArray(row.attivita) ? row.attivita : [] };
  });

  const activities = {};
  getObjectEntries(activitiesRaw).forEach(([activityName, value]) => {
    const row = typeof value === 'object' && value !== null ? value : {};
    const ruleName = row.regola || '';
    activities[`${ruleName}-${activityName}`] = { nome: activityName, descrizione: row.descrizione || '', eta: row.eta || row['età di riferimento'] || '', durata: row.durata || '', frequenza: row.frequenza || '', regola: ruleName };
  });

  const testQuestions = getArrayRows(testRaw).map(row => {
    const categoryName = row.categotia || row.categoria || row['categoria di rischio'] || '';
    const categoryId = Object.values(categories).find(c => normalizeText(c.categoria) === normalizeText(categoryName) || normalizeText(c.nome) === normalizeText(categoryName) || normalizeText(c.slug) === normalizeText(categoryName))?.id || slugify(categoryName);
    return { domanda: row.domande || row.domanda || '', categoria: categoryId, se_si: row['se SI'] || row['se SI '] || row.se_si || '', se_no: row['se NO'] || row['se NO '] || row.se_no || '' };
  });

  return { categories, keywords, testQuestions, rules, activities, recommendations };
}

function findMatchingCategoriesForQuery(query, data) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];
  const matchedCategories = new Set();
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2);
  for (const item of data.keywords) {
    const normalizedPhrase = normalizeText(item.preoccupazione);
    if (!normalizedPhrase) continue;
    let isMatch = false;
    if (normalizedPhrase === normalizedQuery || normalizedPhrase.includes(normalizedQuery) || normalizedQuery.includes(normalizedPhrase)) { isMatch = true; }
    else if (queryTokens.length > 0) {
      const phraseTokens = normalizedPhrase.split(/\s+/).filter(t => t.length > 2);
      if (phraseTokens.length > 0 && (phraseTokens.every(t => queryTokens.includes(t)) || queryTokens.every(t => phraseTokens.includes(t)))) isMatch = true;
    }
    if (isMatch) {
      for (const categoryName of item.categorie ?? []) {
        const norm = normalizeText(categoryName);
        const categoryId = Object.values(data.categories).find(c => normalizeText(c.categoria) === norm || normalizeText(c.nome) === norm || normalizeText(c.slug) === norm)?.id || '';
        if (categoryId) matchedCategories.add(categoryId);
      }
    }
  }
  return Array.from(matchedCategories);
}

async function caricaGoogleAppScriptData() {
  for (const url of GOOGLE_APPS_SCRIPT_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload || typeof payload !== 'object') throw new Error('Risposta vuota');
      return payload;
    } catch (e) { console.warn('[app.js] fetch fallito per', url, e); }
  }
  return null;
}
// cacca
async function getAppData(forceRefresh = false) {
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) return { data, source: 'cache' };
      }
    } catch (e) {}
  }
  const payload = await caricaGoogleAppScriptData();
  if (payload) {
    const data = mapRemoteData(payload);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch (e) {}
    return { data, source: 'google' };
  }
  return { data: { categories: {}, keywords: [], testQuestions: [], rules: {}, activities: {}, recommendations: {} }, source: 'fallback' };
}

async function getCategorie() { const { data } = await getAppData(); return data.categories; }
async function getTestIniziale() { const { data } = await getAppData(); return { regole: data.rules, test: data.testQuestions }; }
async function getAttivita() { const { data } = await getAppData(); return data.activities; }
async function getKeywords() { const { data } = await getAppData(); return data.keywords.map(item => item.preoccupazione); }

async function searchCategories(queries) {
  if (!queries || !Array.isArray(queries) || queries.length === 0) return { success: false, risultati: [] };
  const { data } = await getAppData();
  const risultati = [];
  const foundIds = new Set();
  for (const query of queries) {
    const matchedIds = findMatchingCategoriesForQuery(query, data);
    for (const categoryId of matchedIds) {
      if (!categoryId || foundIds.has(categoryId)) continue;
      foundIds.add(categoryId);
      const category = data.categories[categoryId];
      risultati.push({ id: categoryId, nome: category?.nome || categoryId, descrizione: category?.descrizione || '' });
    }
  }
  return risultati.length > 0 ? { success: true, risultati } : { success: false, risultati: [] };
}

async function filterRulesByCategories(selectedCategories) {
  if (!selectedCategories || !Array.isArray(selectedCategories)) return { success: false, regole: [] };
  const { data } = await getAppData();
  const regoleSelezionate = [];
  Object.entries(data.rules).forEach(([nome, dati]) => {
    const match = (dati.categorie || []).some(cat => selectedCategories.includes(cat));
    if (match) regoleSelezionate.push(nome);
  });
  return { success: true, regole: regoleSelezionate };
}

window.getAppData = getAppData;
window.getCategorie = getCategorie;
window.getTestIniziale = getTestIniziale;
window.getAttivita = getAttivita;
window.getKeywords = getKeywords;
window.searchCategories = searchCategories;
window.filterRulesByCategories = filterRulesByCategories;
window.normalizeText = normalizeText;
