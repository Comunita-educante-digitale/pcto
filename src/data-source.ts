export interface AppData {
  categories: Record<string, any>;
  keywords: Array<{ preoccupazione: string; categorie: string[] }>;
  testQuestions: Array<any>;
  rules: Record<string, any>;
  activities: Record<string, any>;
  recommendations: Record<string, any>;
}

export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugify(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, '-');
}

function findCategoryId(categoryName: string, categories: Record<string, any>): string {
  if (!categoryName) {
    return '';
  }

  const directMatch = categories[categoryName];
  if (directMatch?.id) {
    return directMatch.id;
  }

  const normalizedInput = normalizeText(categoryName);
  return Object.values(categories).find((category: any) => {
    const candidate = category as Record<string, any>;
    return normalizeText(candidate.categoria) === normalizedInput
      || normalizeText(candidate.nome) === normalizedInput
      || normalizeText(candidate.slug) === normalizedInput;
  })?.id || '';
}

export function findMatchingCategoriesForQuery(query: unknown, data: AppData): string[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return [];
  }

  let bestKeyword: { preoccupazione: string; categorie: string[] } | undefined;
  let bestScore = -1;

  for (const item of data.keywords) {
    const normalizedPhrase = normalizeText(item.preoccupazione);
    if (!normalizedPhrase) {
      continue;
    }

    let score = 0;
    if (normalizedPhrase === normalizedQuery) {
      score = 100;
    } else if (normalizedPhrase.includes(normalizedQuery) || normalizedQuery.includes(normalizedPhrase)) {
      score = 90;
    } else {
      const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
      const phraseTokens = normalizedPhrase.split(/\s+/).filter(Boolean);
      const commonTokens = queryTokens.filter((token) => phraseTokens.includes(token));
      if (commonTokens.length > 0) {
        score = 50 + commonTokens.length * 10;
      }
    }

    if (score === 0) {
      continue;
    }

    if (!bestKeyword || score > bestScore || (score === bestScore && normalizedPhrase.length < normalizeText(bestKeyword.preoccupazione).length)) {
      bestKeyword = item;
      bestScore = score;
    }
  }

  if (!bestKeyword) {
    return [];
  }

  const matchedCategories = new Set<string>();
  for (const categoryName of bestKeyword.categorie ?? []) {
    const categoryId = findCategoryId(categoryName, data.categories);
    if (categoryId) {
      matchedCategories.add(categoryId);
    }
  }

  return Array.from(matchedCategories);
}

function getArrayRows(value: unknown): Array<Record<string, any>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, any> => typeof item === 'object' && item !== null);
  }
  return [];
}

function getObjectEntries(value: unknown): Array<[string, any]> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, any>);
  }
  return [];
}

export function mapRemoteData(payload: Record<string, any>): AppData {
  const categoriesRaw = payload.categorie || payload['CATEGORIE di rischio'] || {};
  const keywordRaw = payload.keywords || payload.KEYWORDS || {};
  const testRaw = payload.test_iniziale || [];
  const rulesRaw = payload.regole || {};
  const activitiesRaw = payload.attivita || payload.ATTIVITA || {};
  const recommendationsRaw = payload.raccomandazioni || payload.RACCOMANDAZIONI || {};

  const categories: Record<string, any> = {};
  const categoryLookup = new Map<string, string>();

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

  const keywords: Array<{ preoccupazione: string; categorie: string[] }> = [];
  if (Array.isArray(keywordRaw)) {
    keywordRaw.forEach((row: Record<string, any>) => {
      const preoccupazione = String(row.preoccupazione || row['preoccupazione'] || '');
      const categorie = String(row.categorie || row['categorie'] || '')
        .split(',')
        .map((entry: string) => entry.trim())
        .filter(Boolean);
      if (preoccupazione) {
        keywords.push({ preoccupazione, categorie });
      }
    });
  } else {
    getObjectEntries(keywordRaw).forEach(([categoryKey, value]) => {
      if (Array.isArray(value)) {
        value.forEach((phrase) => {
          if (phrase) {
            keywords.push({ preoccupazione: String(phrase), categorie: [String(categoryKey)] });
          }
        });
      } else if (typeof value === 'string' && value.trim()) {
        keywords.push({ preoccupazione: value, categorie: [String(categoryKey)] });
      }
    });
  }

  const rules: Record<string, any> = {};
  const recommendations: Record<string, any> = {};
  const recommendationRowsByName = new Map<string, Record<string, any>>();

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
      .flatMap((valueEntry: unknown) => {
        if (Array.isArray(valueEntry)) {
          return valueEntry.map((item) => String(item));
        }
        return [String(valueEntry)];
      })
      .map((valueEntry: string) => {
        const normalized = normalizeText(valueEntry);
        return categoryLookup.get(normalized) || Object.values(categories).find((category: any) => normalizeText(category.categoria) === normalized || normalizeText(category.nome) === normalized || normalizeText(category.slug) === normalized)?.id || '';
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

  const activities: Record<string, any> = {};
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
    const categoryId = Object.values(categories).find((category: any) => normalizeText(category.categoria) === normalizeText(categoryName) || normalizeText(category.nome) === normalizeText(categoryName) || normalizeText(category.slug) === normalizeText(categoryName))?.id || slugify(categoryName);
    return {
      domanda: row.domande || row.domanda || '',
      categoria: categoryId,
      se_si: row['se SI'] || row['se SI '] || row['se_si'] || row.se_si || '',
      se_no: row['se NO'] || row['se NO '] || row['se_no'] || row.se_no || ''
    };
  });

  return { categories, keywords, testQuestions, rules, activities, recommendations };
}