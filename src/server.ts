import express from 'express';
import path from 'path';

const app = express();
const initialPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'static')));

// ============ DATI ============
const categorie: Record<string, any> = {
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
  'privacy': {
    id: 'privacy',
    nome: 'Privacy Online',
    descrizione: 'Protezione dei dati personali e informazioni sensibili condivise online.',
    link: 'https://example.com/privacy'
  },
  'cyberbullismo': {
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
  'dipendenza': {
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
};

const regole: Record<string, any> = {
  'Niente dispositivi a tavola': {
    icona: '🍽️',
    descrizione: 'Niente dispositivi a tavola, in camera da letto e durante i compiti. Questo tempo è dedicato alla famiglia e alle attività importanti.',
    categorie: ['zone-off-limits']
  },
  'Massimo 2 ore al giorno': {
    icona: '⏱️',
    descrizione: 'Il tempo sullo schermo è limitato a un massimo di 2 ore al giorno nei giorni feriali e 3 ore nei weekend, salvo eccezioni concordate.',
    categorie: ['limiti-orari']
  },
  'Niente dispositivi prima di andare a letto': {
    icona: '😴',
    descrizione: 'Niente dispositivi almeno 30 minuti prima di andare a letto. La luce blu può interferire con il sonno.',
    categorie: ['limiti-orari', 'salute-fisica']
  },
  'Password forti e uniche': {
    icona: '🔐',
    descrizione: 'Tutte le password devono essere forti (almeno 8 caratteri, lettere, numeri e simboli) e uniche per ogni account.',
    categorie: ['sicurezza-password']
  },
  'Non condividere informazioni personali': {
    icona: '🔒',
    descrizione: 'Non condividere mai numeri di telefono, indirizzi, numeri di carta di credito o informazioni sensibili online.',
    categorie: ['privacy']
  },
  'Segnalare comportamenti strani': {
    icona: '🚨',
    descrizione: 'Se qualcuno online si comporta in modo strano o minaccia, va segnalato immediatamente ai genitori e alla piattaforma.',
    categorie: ['cyberbullismo']
  },
  'Essere consapevoli di cosa si condivide': {
    icona: '📸',
    descrizione: 'Prima di condividere una foto o un video, chiedersi: "È qualcosa che voglio che tutti vedano?"',
    categorie: ['social-media', 'privacy']
  },
  'Fare pause regolari': {
    icona: '👀',
    descrizione: 'Fare una pausa di 5-10 minuti ogni 20-30 minuti di utilizzo del dispositivo per riposare gli occhi.',
    categorie: ['salute-fisica']
  }
};

const attivita: Record<string, any> = {
  'Un giorno senza dispositivi': {
    descrizione: 'Scegliere una giornata o alcune ore della settimana in cui alcune stanze della casa restano completamente senza schermi.',
    durata: '2 mesi',
    frequenza: 'settimanale',
    regola: 'Niente dispositivi a tavola'
  },
  'Mappa degli spazi digitali': {
    descrizione: 'Creare insieme una mappa della casa indicando dove i dispositivi possono e non possono essere utilizzati.',
    durata: 'Continuo',
    frequenza: 'giornaliero',
    regola: 'Niente dispositivi a tavola'
  },
  'Sfida della stanza libera': {
    descrizione: 'Trasforare un pomeriggio in una zona off-limits dedicandosi a giochi, lettura o conversazione.',
    durata: '1 mese',
    frequenza: 'giornaliero',
    regola: 'Niente dispositivi a tavola'
  },
  'Orario di spegnimento': {
    descrizione: 'Stabilire un orario fisso ogni giorno dopo il quale tutti i dispositivi vengono spenti e messi in una zona neutrale.',
    durata: 'Continuo',
    frequenza: 'giornaliero',
    regola: 'Massimo 2 ore al giorno'
  },
  'Monitoraggio del tempo schermo': {
    descrizione: 'Utilizzare app di monitoraggio per tracciare il tempo effettivamente speso sui dispositivi.',
    durata: '1 mese',
    frequenza: 'settimanale',
    regola: 'Massimo 2 ore al giorno'
  },
  'Ricarica notturna fuori dalla camera': {
    descrizione: 'Lasciare i dispositivi a ricaricare fuori dalla camera da letto per evitare tentazioni notturne.',
    durata: 'Continuo',
    frequenza: 'giornaliero',
    regola: 'Niente dispositivi prima di andare a letto'
  },
  'Routine notturna senza schermo': {
    descrizione: 'Creare una routine serale di 30 minuti senza dispositivi (leggere, stare con la famiglia, meditare).',
    durata: '2 settimane',
    frequenza: 'giornaliero',
    regola: 'Niente dispositivi prima di andare a letto'
  },
  'Test di password': {
    descrizione: 'Imparare a riconoscere una password forte e testare la sicurezza dei propri account online.',
    durata: '1 settimana',
    frequenza: 'una tantum',
    regola: 'Password forti e uniche'
  },
  'Revisione privacy account': {
    descrizione: 'Controllare e modificare le impostazioni di privacy su tutti i social media e app utilizzate.',
    durata: 'Continuo',
    frequenza: 'mensile',
    regola: 'Non condividere informazioni personali'
  },
  'Segnalazione consapevole': {
    descrizione: 'Imparare come segnalare contenuti inappropriati, account falsi o comportamenti sospetti.',
    durata: '1 mese',
    frequenza: 'settimanale',
    regola: 'Segnalare comportamenti strani'
  },
  'Sfida della consapevolezza social': {
    descrizione: 'Per una settimana, prima di condividere qualcosa chiedere il permesso a un genitore o fare una pausa di 5 minuti.',
    durata: '1 settimana',
    frequenza: 'giornaliero',
    regola: 'Essere consapevoli di cosa si condivide'
  },
  'Esercizi degli occhi': {
    descrizione: 'Imparare e praticare esercizi per rilassare gli occhi affaticati dopo l\'utilizzo prolungato del dispositivo.',
    durata: '2 settimane',
    frequenza: 'giornaliero',
    regola: 'Fare pause regolari'
  }
};

const domande = [
  {
    domanda: 'Usate spesso dispositivi a tavola durante i pasti?',
    categoria: 'zone-off-limits',
    se_si: 'Niente dispositivi a tavola',
    se_no: ''
  },
  {
    domanda: 'I dispositivi sono presenti in camera da letto durante la notte?',
    categoria: 'zone-off-limits',
    se_si: 'Niente dispositivi prima di andare a letto',
    se_no: ''
  },
  {
    domanda: 'Si fa fatica a concentrarsi su compiti e studio per colpa dei dispositivi?',
    categoria: 'zone-off-limits',
    se_si: 'Niente dispositivi a tavola',
    se_no: ''
  },
  {
    domanda: 'Vi preoccupa il tempo totale trascorso sui dispositivi?',
    categoria: 'limiti-orari',
    se_si: 'Massimo 2 ore al giorno',
    se_no: ''
  },
  {
    domanda: 'È difficile smettere di usare i dispositivi una volta iniziato?',
    categoria: 'limiti-orari',
    se_si: 'Orario di spegnimento',
    se_no: ''
  },
  {
    domanda: 'Si usa il dispositivo prima di dormire?',
    categoria: 'limiti-orari',
    se_si: 'Niente dispositivi prima di andare a letto',
    se_no: ''
  },
  {
    domanda: 'Vi preoccupano le password deboli degli account dei vostri figli?',
    categoria: 'sicurezza-password',
    se_si: 'Password forti e uniche',
    se_no: ''
  },
  {
    domanda: 'Si condividono facilmente informazioni personali online?',
    categoria: 'privacy',
    se_si: 'Non condividere informazioni personali',
    se_no: ''
  },
  {
    domanda: 'I vostri figli capiscono i rischi del cyberbullismo?',
    categoria: 'cyberbullismo',
    se_si: 'Segnalare comportamenti strani',
    se_no: ''
  },
  {
    domanda: 'Vi preoccupa cosa condividono sui social media?',
    categoria: 'social-media',
    se_si: 'Essere consapevoli di cosa si condivide',
    se_no: ''
  },
  {
    domanda: 'Pensate che vostro figlio potrebbe avere una dipendenza da internet?',
    categoria: 'dipendenza',
    se_si: 'Massimo 2 ore al giorno',
    se_no: ''
  },
  {
    domanda: 'Notate affaticamento agli occhi dopo l\'uso prolungato del dispositivo?',
    categoria: 'salute-fisica',
    se_si: 'Fare pause regolari',
    se_no: ''
  }
];

const keywords = [
  'Zona off-limits', 'Dispositivi', 'Tavola', 'Camera da letto', 'Compiti',
  'Limiti orari', 'Tempo schermo', 'Password', 'Sicurezza', 'Privacy',
  'Cyberbullismo', 'Social media', 'Dipendenza', 'Salute fisica', 'Sonno',
  'Informazioni personali', 'Immagini', 'Video', 'Condivisione', 'Pausa'
];

// ============ ROUTES ============

// Serve templates
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'templates', 'index.html'));
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'templates', 'test.html'));
});

app.get('/risultati', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'templates', 'risultati.html'));
});

// Serve test results
app.get('/test-risultati', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'templates', 'test_risultati.html'));
});

// API: Get all categories
app.get('/api/categorie', (req, res) => {
  res.json(categorie);
});

// API: Get all rules (for test results)
app.get('/api/test_iniziale', (req, res) => {
  res.json({ regole, test: domande });
});

// API: Get all activities
app.get('/api/attivita', (req, res) => {
  res.json(attivita);
});

// API: Get keywords for autocomplete
app.get('/api/keywords', (req, res) => {
  res.json(keywords);
});

// API: Search endpoint
app.post('/search', (req, res) => {
  const { queries } = req.body;
  
  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return res.json({ success: false, risultati: [] });
  }

  const searchTerms = queries.map((q: string) => q.toLowerCase().trim());
  
  // Simple search: match keywords to categories
  const risultati: any[] = [];
  const foundIds = new Set<string>();

  searchTerms.forEach((term) => {
    keywords.forEach((kw) => {
      if (kw.toLowerCase().includes(term) || term.includes(kw.toLowerCase())) {
        // Find categories that match this keyword
        Object.entries(categorie).forEach(([id, cat]) => {
          if (!foundIds.has(id)) {
            foundIds.add(id);
            risultati.push({ id, nome: cat.nome, descrizione: cat.descrizione });
          }
        });
      }
    });
  });

  // If no matches, return top categories
  if (risultati.length === 0) {
    const topCategories = Object.entries(categorie).slice(0, 3);
    topCategories.forEach(([id, cat]) => {
      risultati.push({ id, nome: cat.nome, descrizione: cat.descrizione });
    });
  }

  res.json({ success: true, risultati });
});

// API: Generate patto familiare based on categories
app.post('/test', (req, res) => {
  const { categorie: selectedCategories } = req.body;
  
  if (!selectedCategories || !Array.isArray(selectedCategories)) {
    return res.json({ success: false, regole: [] });
  }

  // Find all rules that match the selected categories
  const regoleSelezionate: string[] = [];
  
  Object.entries(regole).forEach(([nome, dati]) => {
    const ruleCategoriesMatch = (dati.categorie || []).some((cat: string) =>
      selectedCategories.includes(cat)
    );
    if (ruleCategoriesMatch) {
      regoleSelezionate.push(nome);
    }
  });

  // Redirect to results page with encoded regole
  const encodedRegole = encodeURIComponent(JSON.stringify(regoleSelezionate));
  res.json({ 
    success: true, 
    redirect: `/test-risultati?regole=${encodedRegole}` 
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'static')));

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'templates', 'index.html'));
});

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = port === 8080 ? 8081 : port + 1;
      console.warn(`Port ${port} is already in use. Retrying on port ${fallbackPort}...`);
      startServer(fallbackPort);
    } else {
      console.error('Server failed to start:', error);
      process.exit(1);
    }
  });
}

startServer(initialPort);
