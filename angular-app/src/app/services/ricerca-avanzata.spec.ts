import { MotoreRicerca } from './ricerca-avanzata';

describe('MotoreRicerca', () => {
  it('non ripete la stessa keyword nei suggerimenti autocomplete', () => {
    const motore = new MotoreRicerca([
      { preoccupazione: 'al cellulare', categorie: ['telefonia'] },
      { preoccupazione: 'al cellulare', categorie: ['social'] },
      { preoccupazione: 'troppo tempo al cellulare', categorie: ['telefonia'] },
      { preoccupazione: 'uso del cellulare', categorie: ['social'] }
    ]);

    const risultati = motore.suggerisci('cellulare');
    const occorrenze = risultati.filter(value => value === 'al cellulare').length;

    expect(occorrenze).toBe(1);
  });
});
