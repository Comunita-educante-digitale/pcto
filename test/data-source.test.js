const test = require('node:test');
const assert = require('node:assert/strict');

const { findMatchingCategoriesForQuery, mapRemoteData } = require('../dist-server/data-source.js');

test('findMatchingCategoriesForQuery returns only categories tied to the best keyword match', () => {
  const data = {
    categories: {
      dipendenza: { id: 'dipendenza', nome: 'dipendenza', categoria: 'dipendenza', slug: 'dipendenza' },
      cyberbullismo: { id: 'cyberbullismo', nome: 'cyberbullismo', categoria: 'cyberbullismo', slug: 'cyberbullismo' }
    },
    keywords: [
      { preoccupazione: 'mio figlio è sempre sul telefono', categorie: ['dipendenza'] },
      { preoccupazione: 'cyberbullismo tra compagni', categorie: ['cyberbullismo'] }
    ],
    testQuestions: [],
    rules: {},
    activities: {},
    recommendations: {}
  };

  const result = findMatchingCategoriesForQuery('telefono', data);

  assert.deepEqual(result, ['dipendenza']);
});

test('mapRemoteData converts the live Google payload into app data', () => {
  const payload = {
    categorie: {
      dipendenza: {
        nome: 'dipendenza dai dispositivi',
        descrizione: 'descrizione dipendenza',
        link: 'https://example.com/dipendenza'
      }
    },
    keywords: {
      dipendenza: ['mio figlio è sempre sul cellulare']
    },
    test_iniziale: [
      {
        id: 1,
        categoria: 'dipendenza',
        domanda: 'Domanda di prova',
        se_si: 'ZONE OFF-LIMITS',
        se_no: 'LIMITI ORARI CONCORDATI'
      }
    ],
    regole: {
      'ZONE OFF-LIMITS': {
        descrizione: 'Niente dispositivi in camera',
        icona: '📵',
        categorie: ['dipendenza'],
        attivita: ['Attività 1'],
        raccomandazione: 'Patto familiare'
      }
    },
    attivita: {
      'Attività 1': {
        regola: 'ZONE OFF-LIMITS',
        descrizione: 'Attività di prova',
        eta: '7+',
        durata: '1 settimana',
        frequenza: 'giornaliera'
      }
    }
  };

  const data = mapRemoteData(payload);

  assert.equal(data.categories.dipendenza.nome, 'dipendenza dai dispositivi');
  assert.equal(data.keywords[0].preoccupazione, 'mio figlio è sempre sul cellulare');
  assert.equal(data.testQuestions[0].categoria, 'dipendenza');
  assert.equal(data.rules['ZONE OFF-LIMITS'].categorie[0], 'dipendenza');
  assert.equal(data.activities['ZONE OFF-LIMITS-Attività 1'].nome, 'Attività 1');
});
