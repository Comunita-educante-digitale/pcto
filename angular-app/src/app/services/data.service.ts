import { Injectable } from '@angular/core';

export interface Categoria {
  id: string;
  nome: string;
  descrizione: string;
  link: string;
  categoria: string;
  slug: string;
}

export interface Keyword {
  preoccupazione: string;
  categorie: string[];
}

export interface Regola {
  nome: string;
  descrizione: string;
  icona: string;
  categorie: string[];
  raccomandazione: string;
  linkRaccomandazione: string;
  attivita: unknown[];
}

export interface Attivita {
  nome: string;
  descrizione: string;
  eta: string;
  durata: string;
  frequenza: string;
  approccio: string;
  regola: string;
}

export interface Raccomandazione {
  nome: string;
  descrizione: string;
  link: string;
}

export interface DomandaTest {
  domanda: string;
  categoria: string;
  se_si: string;
  se_no: string;
}

export interface AppData {
  categories: Record<string, Categoria>;
  keywords: Keyword[];
  testQuestions: DomandaTest[];
  rules: Record<string, Regola>;
  activities: Record<string, Attivita>;
  recommendations: Record<string, Raccomandazione>;
}

export interface RisultatoRicerca {
  id: string;
  nome: string;
  descrizione: string;
}

const GOOGLE_APPS_SCRIPT_URLS = [
  'https://script.google.com/macros/s/AKfycbzm25VHhONFiJejy76iWiK5DjqlURt1JEWP3dPylKcrNmkUzn1mYY_zMsQ4UUIrPzM/exec',
  'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnTUfZgfHyuJS46VG6WcEUZgQd_JbcTfP_y3pj_WaCGI7S6mplaIB8qRT_b0yRixTBUmmuWMeNzas8pt-G7YRUJUujPcriJepeguQ-8PdmGbRC5jbsH8GnXMD5HRIZ3SL8uFI7s5EffejU_uugUc-26Hi-8TmnAJgzg2dQPi9pvgl9fbxpJ_0yJf7S23Q0mU8z7wHKxbVz6BYiDDUiY9A3PktrZUNjOAkLyyHvUBmSgNtuApVO59G6jEtOxksTO9izjJinHh4TZC-tCDJcpq8T_ywi9pmw&lib=MlRCYSh2pVGq_cqM2lnE5VKR_QGq8bm1S'
];
const CACHE_KEY = 'appData_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

export function normalizeText(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function slugify(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, '-');
}

// Parole troppo generiche per contare come sovrapposizione significativa tra
// la preoccupazione dell'utente e le frasi chiave del database
const STOPWORDS = new Set([
  'non', 'per', 'che', 'con', 'come', 'del', 'dei', 'dello', 'della', 'delle', 'degli',
  'nel', 'nella', 'nelle', 'sul', 'sullo', 'sulla', 'sui', 'alla', 'alle', 'allo', 'agli',
  'mio', 'mia', 'miei', 'mie', 'suo', 'sua', 'suoi', 'sue', 'gli', 'una', 'uno',
  'ancora', 'anche', 'quando', 'sempre', 'mai', 'cosa', 'fare', 'essere', 'avere',
  'viene', 'stato', 'solo', 'tutto', 'tutti', 'tutta', 'tutte', 'poco', 'molto',
  'qualcosa', 'qualcuno'
]);

function significantTokens(normalized: string): string[] {
  return normalized.split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function getObjectEntries(value: unknown): [string, unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) return Object.entries(value);
  return [];
}

function getArrayRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'object' && item !== null);
  return [];
}

function mapRemoteData(payload: Record<string, unknown>): AppData {
  const categoriesRaw = payload['categorie'] || payload['CATEGORIE di rischio'] || {};
  const keywordRaw = payload['keywords'] || payload['KEYWORDS'] || {};
  const testRaw = payload['test_iniziale'] || [];
  const rulesRaw = payload['regole'] || {};
  const activitiesRaw = payload['attivita'] || payload['ATTIVITA'] || {};
  const recommendationsRaw = payload['raccomandazioni'] || payload['RACCOMANDAZIONI'] || {};

  const categories: Record<string, Categoria> = {};
  const categoryLookup = new Map<string, string>();

  getObjectEntries(categoriesRaw).forEach(([key, value]) => {
    const row: any = typeof value === 'object' && value !== null ? value : {};
    const categoryName = row.categoria || row.titolo || key;
    const categoryId = String(row.id ?? slugify(key));
    const entry: Categoria = {
      id: categoryId,
      nome: row.titolo || row.categoria || row.nome || categoryName,
      descrizione: row['info in breve'] || row['info breve'] || row.descrizione || '',
      link: row['link del doc'] || row.link || '',
      categoria: row.categoria || categoryName,
      slug: slugify(categoryName)
    };
    categories[categoryId] = entry;
    categoryLookup.set(normalizeText(categoryName), categoryId);
    categoryLookup.set(normalizeText(entry.nome), categoryId);
    categoryLookup.set(normalizeText(entry.slug), categoryId);
  });

  const keywords: Keyword[] = [];
  if (Array.isArray(keywordRaw)) {
    keywordRaw.forEach((row: any) => {
      const preoccupazione = String(row.preoccupazione || '');
      const rawCategorie = String(row.categorie || '');
      const categorie = rawCategorie.includes(',')
        ? rawCategorie.split(',').map(e => e.trim()).filter(Boolean)
        : rawCategorie.split(/\s{2,}/).map(e => e.trim()).filter(Boolean);
      if (preoccupazione) keywords.push({ preoccupazione, categorie: categorie.length > 0 ? categorie : [rawCategorie.trim()] });
    });
  } else {
    getObjectEntries(keywordRaw).forEach(([categoryKey, value]) => {
      if (Array.isArray(value)) value.forEach(phrase => { if (phrase) keywords.push({ preoccupazione: String(phrase), categorie: [String(categoryKey)] }); });
      else if (typeof value === 'string' && value.trim()) keywords.push({ preoccupazione: value, categorie: [String(categoryKey)] });
    });
  }

  const recommendations: Record<string, Raccomandazione> = {};
  const recommendationRowsByName = new Map<string, any>();
  getObjectEntries(recommendationsRaw).forEach(([key, value]) => {
    const row: any = typeof value === 'object' && value !== null ? value : {};
    const name = row.Raccomandazioni || row.nome || key;
    if (name) {
      recommendationRowsByName.set(normalizeText(name), row);
      recommendations[name] = { nome: name, descrizione: row.descrizione || '', link: row['link raccomandazione'] || row.link || '' };
    }
  });

  const rules: Record<string, Regola> = {};
  getObjectEntries(rulesRaw).forEach(([ruleName, value]) => {
    const row: any = typeof value === 'object' && value !== null ? value : {};
    const matchedCategories = [row.categoria1, row.categoria2, row.categoria3, ...(Array.isArray(row.categorie) ? row.categorie : []), ...(Array.isArray(row.categorie_di_rischio) ? row.categorie_di_rischio : [])]
      .filter(Boolean).flatMap((v: unknown) => Array.isArray(v) ? v.map(String) : [String(v)])
      .map((v: string) => {
        const norm = normalizeText(v);
        return categoryLookup.get(norm) || Object.values(categories).find(c => normalizeText(c.categoria) === norm || normalizeText(c.nome) === norm || normalizeText(c.slug) === norm)?.id || '';
      })
      .filter(Boolean);
    const raccomandazione = row.raccomandazione || row['raccomandazione del comune di Milano'] || row['Raccomandazione del Comune di Milano'] || '';
    const matchingRec = recommendationRowsByName.get(normalizeText(raccomandazione));
    rules[ruleName] = {
      nome: ruleName,
      descrizione: row.descrizione || '',
      icona: row.immagine || row.icona || '📌',
      categorie: matchedCategories,
      raccomandazione,
      linkRaccomandazione: row.link || matchingRec?.link || matchingRec?.['link raccomandazione'] || '',
      attivita: Array.isArray(row.attivita) ? row.attivita : []
    };
  });

  const activities: Record<string, Attivita> = {};
  getObjectEntries(activitiesRaw).forEach(([activityName, value]) => {
    const row: any = typeof value === 'object' && value !== null ? value : {};
    const ruleName = row.regola || '';
    activities[`${ruleName}-${activityName}`] = {
      nome: activityName,
      descrizione: row.descrizione || '',
      eta: row.eta || row['età di riferimento'] || '',
      durata: row.durata || '',
      frequenza: row.frequenza || '',
      approccio: row.approccio || '',
      regola: ruleName
    };
  });

  const testQuestions: DomandaTest[] = getArrayRows(testRaw).map((row: any) => {
    const categoryName = row.categotia || row.categoria || row['categoria di rischio'] || '';
    const categoryId = Object.values(categories).find(c => normalizeText(c.categoria) === normalizeText(categoryName) || normalizeText(c.nome) === normalizeText(categoryName) || normalizeText(c.slug) === normalizeText(categoryName))?.id || slugify(categoryName);
    return { domanda: row.domande || row.domanda || '', categoria: categoryId, se_si: row['se SI'] || row['se SI '] || row.se_si || '', se_no: row['se NO'] || row['se NO '] || row.se_no || '' };
  });

  return { categories, keywords, testQuestions, rules, activities, recommendations };
}

function findMatchingCategoriesForQuery(query: string, data: AppData): string[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];
  const matchedCategories = new Set<string>();
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2);
  for (const item of data.keywords) {
    const normalizedPhrase = normalizeText(item.preoccupazione);
    if (!normalizedPhrase) continue;
    let isMatch = false;
    if (normalizedPhrase === normalizedQuery || normalizedPhrase.includes(normalizedQuery) || normalizedQuery.includes(normalizedPhrase)) {
      isMatch = true;
    } else if (queryTokens.length > 0) {
      const phraseTokens = normalizedPhrase.split(/\s+/).filter(t => t.length > 2);
      if (phraseTokens.length > 0 && (phraseTokens.every(t => queryTokens.includes(t)) || queryTokens.every(t => phraseTokens.includes(t)))) {
        isMatch = true;
      } else {
        // Match parziale: almeno 2 parole significative in comune che coprano
        // metà della frase chiave (tollera frasi libere tipo
        // "mio figlio passa troppo tempo sullo smartphone")
        const querySignificant = significantTokens(normalizedQuery);
        const phraseSignificant = significantTokens(normalizedPhrase);
        const comuni = phraseSignificant.filter(t => querySignificant.includes(t));
        if (comuni.length >= 2 && comuni.length >= Math.ceil(phraseSignificant.length / 2)) isMatch = true;
      }
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

const EMPTY_DATA: AppData = { categories: {}, keywords: [], testQuestions: [], rules: {}, activities: {}, recommendations: {} };

@Injectable({ providedIn: 'root' })
export class DataService {

  private async caricaGoogleAppScriptData(): Promise<Record<string, unknown> | null> {
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
      } catch (e) {
        console.warn('[data.service] fetch fallito per', url, e);
      }
    }
    return null;
  }

  async getAppData(forceRefresh = false): Promise<{ data: AppData; source: 'cache' | 'google' | 'fallback' }> {
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS) return { data, source: 'cache' };
        }
      } catch (e) { /* cache illeggibile: si prosegue col fetch */ }
    }
    const payload = await this.caricaGoogleAppScriptData();
    if (payload) {
      const data = mapRemoteData(payload);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch (e) { /* storage pieno o negato */ }
      return { data, source: 'google' };
    }
    return { data: EMPTY_DATA, source: 'fallback' };
  }

  async getCategorie(): Promise<Record<string, Categoria>> {
    const { data } = await this.getAppData();
    return data.categories;
  }

  async getTestIniziale(): Promise<{ regole: Record<string, Regola>; test: DomandaTest[] }> {
    const { data } = await this.getAppData();
    return { regole: data.rules, test: data.testQuestions };
  }

  async getAttivita(): Promise<Record<string, Attivita>> {
    const { data } = await this.getAppData();
    return data.activities;
  }

  async getKeywords(): Promise<string[]> {
    const { data } = await this.getAppData();
    return data.keywords.map(item => item.preoccupazione);
  }

  async searchCategories(queries: string[]): Promise<{ success: boolean; risultati: RisultatoRicerca[] }> {
    if (!queries || !Array.isArray(queries) || queries.length === 0) return { success: false, risultati: [] };
    const { data } = await this.getAppData();
    const risultati: RisultatoRicerca[] = [];
    const foundIds = new Set<string>();
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

  async filterRulesByCategories(selectedCategories: string[]): Promise<{ success: boolean; regole: string[] }> {
    if (!selectedCategories || !Array.isArray(selectedCategories)) return { success: false, regole: [] };
    const { data } = await this.getAppData();
    const regoleSelezionate: string[] = [];
    Object.entries(data.rules).forEach(([nome, dati]) => {
      const match = (dati.categorie || []).some(cat => selectedCategories.includes(cat));
      if (match) regoleSelezionate.push(nome);
    });
    return { success: true, regole: regoleSelezionate };
  }
}
