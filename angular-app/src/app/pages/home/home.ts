import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

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

  campi = signal<string[]>(['']);
  navbarHidden = signal(false);

  suggestions: string[] = [];
  activeInput = signal(-1);
  activeSuggestion = signal(-1);
  filtered = signal<string[]>([]);

  private lastY = 0;

  ngOnInit(): void {
    this.data.getKeywords().then(k => (this.suggestions = k)).catch(() => (this.suggestions = []));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const currentY = window.scrollY;
    this.navbarHidden.set(currentY > this.lastY && currentY > 60);
    this.lastY = currentY;
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
    const q = query.trim().toLowerCase();
    if (!q) {
      this.filtered.set([]);
      this.activeSuggestion.set(-1);
      return;
    }
    this.filtered.set(this.suggestions.filter(s => s.toLowerCase().includes(q)));
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
}
