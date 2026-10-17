import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { DataService, DomandaTest } from '../../services/data.service';

const START = 60;

@Component({
  selector: 'app-test',
  imports: [RouterLink],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test implements OnInit {
  private data = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  loading = signal(true);
  errore = signal<string | null>(null);
  nessunaDomanda = signal(false);
  domande = signal<DomandaTest[]>([]);   // "rotta": piano di domande (può crescere in modalità adattiva)
  current = signal(0);
  adattivo = signal(false);

  // ── Stato di gioco ──
  benessere = signal(START);
  reaction = signal<'up' | 'down' | null>(null);
  lastDelta = signal<number | null>(null);
  locked = signal(false);
  finished = signal(false);
  serene = signal(0);

  mood = computed<'bene' | 'ok' | 'giu'>(() => {
    const b = this.benessere();
    return b >= 70 ? 'bene' : b >= 40 ? 'ok' : 'giu';
  });

  esitoTitolo = computed(() => {
    switch (this.mood()) {
      case 'bene': return 'Sei arrivato in un porto sereno ⛵';
      case 'ok': return 'In porto, con qualche onda da sistemare';
      default: return 'Approdo tra acque un po\' mosse';
    }
  });
  esitoTesto = computed(() => {
    switch (this.mood()) {
      case 'bene': return 'La gestione del digitale in famiglia sembra equilibrata. Bastano poche attenzioni: ecco le regole suggerite in base alle tue risposte.';
      case 'ok': return 'Ci sono alcune aree da curare insieme. Qui sotto trovi le regole consigliate per la tua famiglia.';
      default: return 'Diverse risposte segnalano preoccupazioni: niente panico, il patto qui sotto raccoglie le regole che possono aiutarvi, un passo alla volta.';
    }
  });

  private risposteRegole: string[] = [];
  private followUps = new Map<DomandaTest, DomandaTest[]>(); // sentinella → approfondimenti della sua area
  private step = 10;

  ngOnInit(): void {
    this.carica();
  }

  indietro(): void {
    this.location.back();
  }

  get progress(): number {
    const tot = this.domande().length;
    return tot > 0 ? (this.current() / tot) * 100 : 0;
  }

  get domandaCorrente(): DomandaTest | null {
    return this.domande()[this.current()] ?? null;
  }

  /** Posizione della barca lungo la rotta (0 = partenza a sinistra, 1 = porto a destra). */
  get rotta(): number {
    const tot = this.domande().length;
    if (tot <= 1) return this.finished() ? 1 : 0;
    return Math.min(1, Math.max(0, this.current() / (tot - 1)));
  }

  private async carica(): Promise<void> {
    try {
      const categorieParam = this.route.snapshot.queryParamMap.get('categorie');
      const categoriaParam = this.route.snapshot.queryParamMap.get('categoria');

      const data = await this.data.getTestIniziale();
      const tutte = data.test || [];

      let domande: DomandaTest[];
      if (categorieParam) {
        const categorie: string[] = JSON.parse(categorieParam);
        domande = tutte.filter(d => d.categoria && categorie.some(c => c.toLowerCase() === d.categoria.toLowerCase()));
      } else if (categoriaParam) {
        domande = tutte.filter(d => d.categoria && d.categoria.toLowerCase() === categoriaParam.toLowerCase());
      } else {
        // TEST COMPLETO · modalità adattiva "a imbuto":
        // 1 domanda-sentinella per area; gli approfondimenti si aprono solo se la sentinella segnala un problema.
        domande = this.costruisciImbuto(tutte);
        this.adattivo.set(true);
      }

      if (domande.length === 0) {
        this.nessunaDomanda.set(true);
        this.loading.set(false);
        return;
      }
      this.domande.set(domande);
      this.step = Math.max(8, Math.round(100 / domande.length));
      this.loading.set(false);
    } catch (e: any) {
      this.errore.set(e?.message || 'errore sconosciuto');
      this.loading.set(false);
    }
  }

  /** Prima domanda per ogni area = sentinella; le altre restano come approfondimenti da aprire su richiesta. */
  private costruisciImbuto(tutte: DomandaTest[]): DomandaTest[] {
    const perArea = new Map<string, DomandaTest[]>();
    for (const d of tutte) {
      const k = (d.categoria || 'altro').toLowerCase();
      const arr = perArea.get(k);
      if (arr) arr.push(d); else perArea.set(k, [d]);
    }
    const sentinelle: DomandaTest[] = [];
    this.followUps = new Map();
    for (const qs of perArea.values()) {
      if (!qs.length) continue;
      const [prima, ...resto] = qs;
      sentinelle.push(prima);
      if (resto.length) this.followUps.set(prima, resto);
    }
    return sentinelle;
  }

  /** Una risposta senza regola = scelta serena (bene); con regola = preoccupazione (male). */
  rispondi(regola: string): void {
    if (this.locked()) return;
    const q = this.domandaCorrente;
    const buona = !regola;
    const delta = buona ? this.step : -this.step;

    this.benessere.update(b => Math.min(100, Math.max(0, b + delta)));
    this.lastDelta.set(delta);
    this.reaction.set(buona ? 'up' : 'down');
    if (buona) this.serene.update(n => n + 1);
    this.locked.set(true);

    setTimeout(() => {
      if (regola) this.risposteRegole.push(regola);

      // imbuto: se una sentinella segnala una preoccupazione, inserisci gli approfondimenti della sua area
      if (regola && q && this.followUps.has(q)) {
        const extra = this.followUps.get(q)!;
        this.followUps.delete(q);
        this.domande.update(plan => {
          const copy = [...plan];
          copy.splice(this.current() + 1, 0, ...extra);
          return copy;
        });
      }

      this.reaction.set(null);
      this.lastDelta.set(null);
      const next = this.current() + 1;
      this.current.set(next);
      if (next >= this.domande().length) this.finished.set(true);
      this.locked.set(false);
    }, 750);
  }

  proceed(): void {
    const queryParams: Record<string, string> = { regole: JSON.stringify(this.risposteRegole) };
    const categorieParam = this.route.snapshot.queryParamMap.get('categorie');
    if (categorieParam) queryParams['categorie'] = categorieParam;
    this.router.navigate(['/test-risultati'], { queryParams });
  }
}
