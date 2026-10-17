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
  domande = signal<DomandaTest[]>([]);
  current = signal(0);

  // ── Stato di gioco ──
  benessere = signal(START);        // 0..100, pilota la barra e l'aspetto del personaggio
  reaction = signal<'up' | 'down' | null>(null);
  lastDelta = signal<number | null>(null);
  locked = signal(false);
  finished = signal(false);
  serene = signal(0);               // numero di risposte "serene"

  mood = computed<'bene' | 'ok' | 'giu'>(() => {
    const b = this.benessere();
    return b >= 70 ? 'bene' : b >= 40 ? 'ok' : 'giu';
  });

  esitoTitolo = computed(() => {
    switch (this.mood()) {
      case 'bene': return 'Rotta serena! ⛵';
      case 'ok': return 'Buona rotta, con qualche onda';
      default: return 'Mare un po\' mosso';
    }
  });
  esitoTesto = computed(() => {
    switch (this.mood()) {
      case 'bene': return 'La gestione del digitale in famiglia sembra equilibrata. Bastano poche attenzioni: ecco le regole suggerite in base alle tue risposte.';
      case 'ok': return 'Ci sono alcune aree da curare insieme. Qui sotto trovi le regole consigliate per la tua famiglia.';
      default: return 'Diverse risposte segnalano preoccupazioni: niente panico, il patto qui sotto raccoglie le regole che possono aiutarvi.';
    }
  });

  private risposteRegole: string[] = [];
  private step = 8;

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
        domande = tutte;
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

  /** Una risposta senza regola = scelta serena (bene); con regola = preoccupazione (male). */
  rispondi(regola: string): void {
    if (this.locked()) return;
    const buona = !regola;
    const delta = buona ? this.step : -this.step;

    this.benessere.update(b => Math.min(100, Math.max(0, b + delta)));
    this.lastDelta.set(delta);
    this.reaction.set(buona ? 'up' : 'down');
    if (buona) this.serene.update(n => n + 1);
    this.locked.set(true);

    setTimeout(() => {
      if (regola) this.risposteRegole.push(regola);
      this.reaction.set(null);
      this.lastDelta.set(null);
      const next = this.current() + 1;
      if (next >= this.domande().length) {
        this.current.set(next);
        this.finished.set(true);
      } else {
        this.current.set(next);
      }
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
