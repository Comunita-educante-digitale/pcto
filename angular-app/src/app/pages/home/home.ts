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

  constructor() {
    // Scroll-reveal giocoso: solo nel browser (SSR-safe), rispetta prefers-reduced-motion.
    afterNextRender(() => {
      const root: HTMLElement = this.host.nativeElement;
      const targets = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) {
        targets.forEach(el => el.classList.add('is-visible'));
        return;
      }
      const io = new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        }
      }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
      targets.forEach(el => io.observe(el));
    });
  }

  campi = signal<string[]>(['']);
  navbarHidden = signal(false);
  mobileMenuOpen = signal(false);

  activeInput = signal(-1);
  activeSuggestion = signal(-1);
  filtered = signal<string[]>([]);

  // ── Percorso interattivo (stepper) ──
  readonly steps = [
    { n: 1, icon: '🔍', title: 'Esprimi le tue preoccupazioni', desc: 'Cerca tra i temi che ti preoccupano di più riguardo all\'uso della tecnologia da parte di tuo figlio.' },
    { n: 2, icon: '🧭', title: 'Test di valutazione', desc: 'Rispondi a poche domande mirate per capire quali aree richiedono maggiore attenzione.' },
    { n: 3, icon: '🧩', title: 'Regole e attività personalizzate', desc: 'Ricevi regole concrete e attività pratiche da svolgere insieme ai tuoi figli, calibrate sulla vostra situazione.' },
    { n: 4, icon: '✍️', title: 'Personalizza il tuo patto', desc: 'Scegli quali regole e attività tenere, elimina quelle che non fanno per voi e adatta il patto alla tua famiglia.' },
    { n: 5, icon: '📌', title: 'Scarica e appendi il patto', desc: 'Salva il documento PDF con le regole scelte e appendilo in casa come promemoria visibile per tutta la famiglia.' },
  ];
  currentStep = signal(0);
  stepDir = signal(1);

  // ── Espandi/accordion ──
  heroExpanded = signal(false);
  notesOpen = signal<[boolean, boolean]>([false, false]);

  private lastY = 0;

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
    if (window.innerWidth > 768) {
      this.mobileMenuOpen.set(false);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  get canAddCampo(): boolean {
    return this.campi().length < MAX_CAMPI;
  }

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
    // Ritarda la chiusura per lasciar arrivare il mousedown sulla voce selezionata
    setTimeout(() => {
      this.activeInput.set(-1);
      this.filtered.set([]);
      this.activeSuggestion.set(-1);
    }, 150);
  }

  private updateFiltered(query: string): void {
    const q = query.trim();
    if (!q) {
      this.filtered.set([]);
      this.activeSuggestion.set(-1);
      return;
    }
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
      if (i >= 0 && items[i]) {
        event.preventDefault();
        this.selectSuggestion(items[i]);
      }
    } else if (event.key === 'Escape') {
      this.filtered.set([]);
      this.activeSuggestion.set(-1);
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

  // ── Stepper ──
  get isFirstStep(): boolean { return this.currentStep() === 0; }
  get isLastStep(): boolean { return this.currentStep() === this.steps.length - 1; }
  get trackFill(): number { return (this.currentStep() / (this.steps.length - 1)) * 100; }
  nextStep(): void { this.stepDir.set(1); this.currentStep.update(i => Math.min(i + 1, this.steps.length - 1)); }
  prevStep(): void { this.stepDir.set(-1); this.currentStep.update(i => Math.max(i - 1, 0)); }
  goToStep(i: number): void { this.stepDir.set(i >= this.currentStep() ? 1 : -1); this.currentStep.set(i); }

  // ── Espandi/accordion ──
  toggleHero(): void { this.heroExpanded.update(v => !v); }
  toggleNote(i: number): void {
    this.notesOpen.update(a => a.map((v, idx) => (idx === i ? !v : v)) as [boolean, boolean]);
  }
}