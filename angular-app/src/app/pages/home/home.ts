import { Component, ElementRef, HostListener, OnInit, afterNextRender, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService, Categoria } from '../../services/data.service';

const MAX_CAMPI = 3;

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private data = inject(DataService);
  private router = inject(Router);
  private host = inject(ElementRef) as ElementRef<HTMLElement>;
  categories = signal<Categoria[]>([]);

  campi = signal<string[]>(['']);
  navbarHidden = signal(false);
  mobileMenuOpen = signal(false);

  activeInput = signal(-1);
  activeSuggestion = signal(-1);
  filtered = signal<string[]>([]);

  // ── Le 5 tappe del percorso (testi invariati) ──
  readonly steps = [
    { n: 1, icon: '🧭', title: 'Esprimi le tue preoccupazioni', desc: 'Cerca tra i temi che ti preoccupano di più riguardo all\'uso della tecnologia da parte di tuo figlio.' },
    { n: 2, icon: '📝', title: 'Test di valutazione', desc: 'Rispondi a poche domande mirate per capire quali aree richiedono maggiore attenzione.' },
    { n: 3, icon: '🧩', title: 'Regole e attività personalizzate', desc: 'Ricevi regole concrete e attività pratiche da svolgere insieme ai tuoi figli, calibrate sulla vostra situazione.' },
    { n: 4, icon: '✍️', title: 'Personalizza il tuo patto', desc: 'Scegli quali regole e attività tenere, elimina quelle che non fanno per voi e adatta il patto alla tua famiglia.' },
    { n: 5, icon: '📜', title: 'Scarica e appendi il patto', desc: 'Salva il documento PDF con le regole scelte e appendilo in casa come promemoria visibile per tutta la famiglia.' },
  ];

  // ── Porti della traversata (rail laterale) ──
  readonly ports = [
    { id: 'che-cose', icon: '⚓', label: 'Partenza' },
    { id: 'cerca', icon: '🧭', label: 'La rotta' },
    { id: 'come-funziona', icon: '🗺️', label: 'Il percorso' },
    { id: 'esperti', icon: '⭐', label: 'Le guide' },
    { id: 'temi', icon: '🏝️', label: 'Le acque' },
    { id: 'chi-siamo', icon: '🏠', label: 'Equipaggio' },
  ];
  activeScene = signal('che-cose');

  // ── Espandi/accordion ──
  heroExpanded = signal(false);
  notesOpen = signal<[boolean, boolean]>([false, false]);

  private lastY = 0;

  constructor() {
    // Tutto scroll/DOM solo nel browser (SSR-safe) e nel rispetto di prefers-reduced-motion.
    afterNextRender(() => {
      const root: HTMLElement = this.host.nativeElement;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      // Reveal degli elementi che accompagnano il testo
      const targets = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
      if (reduce || !('IntersectionObserver' in window)) {
        targets.forEach(el => el.classList.add('in'));
      } else {
        const io = new IntersectionObserver((entries, obs) => {
          for (const e of entries) {
            if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
          }
        }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
        targets.forEach(el => io.observe(el));
      }

      // Scena attiva (per il rail laterale)
      if ('IntersectionObserver' in window) {
        const sceneIO = new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              const id = (e.target as HTMLElement).dataset['scene'];
              if (id) this.activeScene.set(id);
            }
          }
        }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
        root.querySelectorAll<HTMLElement>('[data-scene]').forEach(s => sceneIO.observe(s));
      }

      // La nave avanza e la rotta si riempie con lo scroll
      const ship = root.querySelector<HTMLElement>('.voyage-ship');
      const fill = root.querySelector<HTMLElement>('.voyage-fill');
      const track = root.querySelector<HTMLElement>('.voyage-track');
      let ticking = false;
      const update = () => {
        ticking = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (fill) fill.style.height = (p * 100).toFixed(2) + '%';
        if (ship && track) ship.style.top = (p * (track.clientHeight - ship.offsetHeight)).toFixed(1) + 'px';
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    });
  }

  ngOnInit(): void {
    this.data.getCategorie()
      .then(c => this.categories.set(Object.values(c)))
      .catch(() => this.categories.set([]));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const currentY = window.scrollY;
    this.navbarHidden.set(currentY > this.lastY && currentY > 60);
    this.lastY = currentY;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void { this.mobileMenuOpen.update(open => !open); }
  closeMobileMenu(): void { this.mobileMenuOpen.set(false); }

  get canAddCampo(): boolean { return this.campi().length < MAX_CAMPI; }

  aggiungiCampo(): void {
    if (!this.canAddCampo) return;
    this.campi.update(c => [...c, '']);
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.search-big');
      inputs[inputs.length - 1]?.focus();
    });
  }

  updateCampo(index: number, value: string): void {
    this.campi.update(c => c.map((v, i) => (i === index ? value : v)));
    this.activeInput.set(index);
    this.updateFiltered(value);
  }

  onFocusCampo(index: number): void {
    this.activeInput.set(index);
    this.updateFiltered(this.campi()[index] || '');
  }

  onBlurCampo(): void {
    setTimeout(() => {
      this.activeInput.set(-1);
      this.filtered.set([]);
      this.activeSuggestion.set(-1);
    }, 150);
  }

  private updateFiltered(query: string): void {
    const q = query.trim();
    if (!q) { this.filtered.set([]); this.activeSuggestion.set(-1); return; }
    this.data.suggerisciKeywords(q).then(s => this.filtered.set(s));
    this.activeSuggestion.set(-1);
  }

  selectSuggestion(text: string): void {
    const idx = this.activeInput();
    if (idx < 0) return;
    this.campi.update(c => c.map((v, i) => (i === idx ? text : v)));
    this.filtered.set([]);
    this.activeSuggestion.set(-1);
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.filtered();
    if (items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestion.update(i => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestion.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      const i = this.activeSuggestion();
      if (i >= 0 && items[i]) { event.preventDefault(); this.selectSuggestion(items[i]); }
    } else if (event.key === 'Escape') {
      this.filtered.set([]); this.activeSuggestion.set(-1);
    }
  }

  async doSearch(): Promise<void> {
    const queries = this.campi().map(v => v.trim()).filter(Boolean);
    if (queries.length === 0) return;
    const data = await this.data.searchCategories(queries);
    if (data.success && data.risultati.length > 0) {
      this.router.navigate(['/risultati'], { queryParams: { data: JSON.stringify(data.risultati) } });
    } else {
      alert('Nessuna categoria trovata. Prova con parole diverse.');
    }
  }

  // ── Espandi/accordion ──
  toggleHero(): void { this.heroExpanded.update(v => !v); }
  toggleNote(i: number): void {
    this.notesOpen.update(a => a.map((v, idx) => (idx === i ? !v : v)) as [boolean, boolean]);
  }
}
