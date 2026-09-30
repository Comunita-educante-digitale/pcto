import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (ready()) {
      <router-outlet />
    } @else {
      <div class="app-loading-screen">
        <div class="app-loading-card">
          <div class="app-loading-spinner"></div>
          <p>Caricamento dati...</p>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: #f4f7f5;
      font-family: 'Segoe UI', sans-serif;
    }

    .app-loading-screen {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #f3faf5 0%, #edf4f1 100%);
    }

    .app-loading-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem 2.5rem;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(30, 92, 68, 0.1);
      box-shadow: 0 12px 36px rgba(26, 74, 57, 0.08);
    }

    .app-loading-spinner {
      width: 42px;
      height: 42px;
      border: 4px solid rgba(24, 118, 77, 0.12);
      border-top-color: #18764d;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }

    .app-loading-card p {
      margin: 0;
      color: #244b3d;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
})
export class App {
  private data = inject(DataService);
  readonly ready = signal(false);

  constructor() {
    this.data.initializeAppData().then(() => this.ready.set(true));
  }
}
