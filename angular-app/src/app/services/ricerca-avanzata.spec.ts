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

  it('mantiene più categorie rilevanti per una stessa keyword', () => {
    const motore = new MotoreRicerca([
      { preoccupazione: 'sempre sul cellulare', categorie: ['dipendenza', 'isolamento', 'salute mentale'] },
      { preoccupazione: 'non riesce a staccarsi dal telefono', categorie: ['dipendenza', 'salute mentale'] },
      { preoccupazione: 'usa il telefono tutto il giorno', categorie: ['dipendenza', 'impatto cognitivo'] },
      { preoccupazione: 'non smette mai di guardare il telefono', categorie: ['dipendenza', 'impatto cognitivo'] },
      { preoccupazione: 'è ossessionato dal cellulare', categorie: ['dipendenza', 'salute mentale'] },
      { preoccupazione: 'non riesce a cenare senza telefono', categorie: ['dipendenza', 'isolamento'] },
      { preoccupazione: 'va a dormire tardi per il telefono', categorie: ['dipendenza', 'salute fisica'] }
    ]);

    const risultati = motore.cerca('sempre sul cellulare');
    const categorie = risultati.map(r => r.categoria);

    expect(categorie).toContain('dipendenza');
    expect(categorie).toContain('salute mentale');
    expect(categorie).toContain('isolamento');
  });
});
